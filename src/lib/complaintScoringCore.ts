// =====================================================
// COMPLAINT SCORING - PURE LOGIC (No DB Dependencies)
// =====================================================
// Constants and pure functions for complaint scoring.
// This file has NO database dependencies and can be tested in isolation.
// =====================================================

export const SCORE_WEIGHTS = {
  linkedToOrder: 30,
  buyerKycVerified: 25,
  culqiChargeback: 40,
  slaExpired: 15,
  patternSimilar: 20,
} as const;

export const SCORE_TIERS = {
  verified: 60,
  underReview: 30,
  rejected: 0,
} as const;

export const SLA_BUSINESS_DAYS = 15;
export const PATTERN_WINDOW_DAYS = 30;
export const PATTERN_THRESHOLD = 3;

/**
 * Add business days to a date (skip weekends)
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    // 0 = Sunday, 6 = Saturday
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Determine tier from score
 */
export function calculateTierFromScore(score: number): 'verified' | 'under_review' | 'rejected' {
  if (score >= SCORE_TIERS.verified) {
    return 'verified';
  } else if (score >= SCORE_TIERS.underReview) {
    return 'under_review';
  } else {
    return 'rejected';
  }
}

/**
 * Calculate score from breakdown (pure function)
 */
export function calculateScoreFromBreakdown(breakdown: {
  linkedToOrder: boolean;
  buyerKycVerified: boolean;
  culqiChargeback: boolean;
  slaExpired: boolean;
  patternSimilar: boolean;
}): number {
  let score = 0;
  if (breakdown.linkedToOrder) score += SCORE_WEIGHTS.linkedToOrder;
  if (breakdown.buyerKycVerified) score += SCORE_WEIGHTS.buyerKycVerified;
  if (breakdown.culqiChargeback) score += SCORE_WEIGHTS.culqiChargeback;
  if (breakdown.slaExpired) score += SCORE_WEIGHTS.slaExpired;
  if (breakdown.patternSimilar) score += SCORE_WEIGHTS.patternSimilar;
  return Math.min(score, 100);
}
