// =====================================================
// COMPLAINT SCORING ENGINE
// =====================================================
// Calculates verified complaint score (0-100) at submission time
// based on weighted factors per DS 011-2011-PCM requirements.
// Feature flag: ENABLE_AUTO_DEACTIVATION
// =====================================================

import { db } from '@/core/database/client';
import { complaintBookRecords, payments } from '@/core/database/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

import {
  PATTERN_THRESHOLD,
  PATTERN_WINDOW_DAYS,
  SCORE_WEIGHTS,
  SLA_BUSINESS_DAYS,
  addBusinessDays,
  calculateTierFromScore,
} from './complaintScoringCore';

export interface ComplaintScoreResult {
  score: number;
  tier: 'verified' | 'under_review' | 'rejected';
  breakdown: {
    linkedToOrder: boolean;
    buyerKycVerified: boolean;
    culqiChargeback: boolean;
    slaExpired: boolean;
    patternSimilar: boolean;
  };
}

/**
 * Calculate complaint score based on weighted factors.
 * Returns score (0-100), tier, and breakdown.
 */
export async function calculateComplaintScore(
  complaintId: string,
  businessId: string,
): Promise<ComplaintScoreResult> {
  // Feature flag guard
  if (process.env.ENABLE_AUTO_DEACTIVATION !== 'true') {
    return {
      score: 0,
      tier: 'rejected',
      breakdown: {
        linkedToOrder: false,
        buyerKycVerified: false,
        culqiChargeback: false,
        slaExpired: false,
        patternSimilar: false,
      },
    };
  }

  // Fetch complaint record
  const complaint = await db.query.complaintBookRecords.findFirst({
    where: eq(complaintBookRecords.id, complaintId),
    columns: {
      id: true,
      businessId: true,
      linkedOrderId: true,
      createdAt: true,
      status: true,
      claimType: true,
    },
  });

  if (!complaint || complaint.businessId !== businessId) {
    throw new Error('Complaint not found or business mismatch');
  }

  const breakdown = {
    linkedToOrder: false,
    buyerKycVerified: false,
    culqiChargeback: false,
    slaExpired: false,
    patternSimilar: false,
  };

  let score = 0;

  // Factor 1: Linked to real order (+30)
  if (complaint.linkedOrderId) {
    breakdown.linkedToOrder = true;
    score += SCORE_WEIGHTS.linkedToOrder;

    // Fetch linked order for additional factors
    const order = await db.query.payments.findFirst({
      where: eq(payments.id, complaint.linkedOrderId),
      columns: {
        id: true,
        buyerDni: true,
        culqiChargeId: true,
        status: true,
      },
    });

    if (order) {
      // Factor 2: Buyer KYC verified (+25) - has DNI
      if (order.buyerDni) {
        breakdown.buyerKycVerified = true;
        score += SCORE_WEIGHTS.buyerKycVerified;
      }

      // Factor 3: Culqi chargeback/dispute (+40) — DS 011 §1 requires
      // "Prueba financiera objetiva". The REAL dispute signal is the linked
      // payment being in the 'disputed' status (the customer contested the
      // charge). A culqiChargeId alone only proves a transaction existed
      // (already scored by linkedToOrder) — it is NOT proof of a dispute.
      if (order.status === 'disputed') {
        breakdown.culqiChargeback = true;
        score += SCORE_WEIGHTS.culqiChargeback;
      }
    }
  }

  // Factor 4: SLA 15 business days expired without response (+15)
  const slaDeadline = addBusinessDays(complaint.createdAt, SLA_BUSINESS_DAYS);
  if (complaint.status === 'pending' && new Date() > slaDeadline) {
    breakdown.slaExpired = true;
    score += SCORE_WEIGHTS.slaExpired;
  }

  // Factor 5: Pattern of >=3 similar complaints in 30 days (+20)
  const windowStart = new Date(Date.now() - PATTERN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const similarComplaints = await db.query.complaintBookRecords.findMany({
    where: and(
      eq(complaintBookRecords.businessId, businessId),
      eq(complaintBookRecords.claimType, complaint.claimType),
      gte(complaintBookRecords.createdAt, windowStart),
      lt(complaintBookRecords.createdAt, complaint.createdAt),
    ),
    columns: { id: true },
    limit: PATTERN_THRESHOLD,
  });

  if (similarComplaints.length >= PATTERN_THRESHOLD) {
    breakdown.patternSimilar = true;
    score += SCORE_WEIGHTS.patternSimilar;
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine tier
  const tier = calculateTierFromScore(score);

  return { score, tier, breakdown };
}

/**
 * Update complaint record with score and tier
 */
export async function updateComplaintScore(
  complaintId: string,
  result: ComplaintScoreResult,
): Promise<void> {
  await db
    .update(complaintBookRecords)
    .set({
      score: result.score,
      scoreTier: result.tier,
      scoreBreakdown: result.breakdown,
      isVerified: result.tier === 'verified',
      verifiedAt: result.tier === 'verified' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(complaintBookRecords.id, complaintId));
}

// Re-export pure functions for testing
export {
  PATTERN_THRESHOLD,
  PATTERN_WINDOW_DAYS,
  SCORE_TIERS,
  SCORE_WEIGHTS,
  SLA_BUSINESS_DAYS,
  addBusinessDays,
  calculateTierFromScore,
} from './complaintScoringCore';
