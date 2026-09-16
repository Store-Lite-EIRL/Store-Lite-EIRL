// =====================================================
// INDECOPI AUDIT TRAIL QUERY (LEGAL-004)
// =====================================================
// Read-only query that reconstructs the full, traceable audit
// trail for a business (DS 011-2011-PCM / INDECOPI submission):
//  - deactivation_notices      → written notification evidence
//  - appeals + resolutions     → appeal submission & decision
//  - verified complaints       → scoring evidence (isVerified)
// Every event is documented via a Zod discriminated union so the
// trail is serialization-safe. Events are returned in strict
// chronological order; the optional from/to window filters by
// each event's occurrence timestamp.
// =====================================================

import { db } from '@/core/database/client';
import { appeals, complaintBookRecords, deactivationNotices } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// ── Documented event shape (serialization safety) ──

export const auditEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('deactivation_notice'),
    occurredAt: z.date(),
    payload: z.object({
      noticeId: z.string(),
      reason: z.enum(['verified_complaints', 'incomplete_orders']),
      complaintIds: z.array(z.string()),
      gracePeriodEndsAt: z.date(),
      appealDeadline: z.date(),
      isResolved: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal('appeal'),
    occurredAt: z.date(),
    payload: z.object({
      appealId: z.string(),
      status: z.enum(['pending', 'approved', 'rejected']),
      submittedAt: z.date(),
      slaDeadline: z.date(),
    }),
  }),
  z.object({
    type: z.literal('appeal_decision'),
    occurredAt: z.date(),
    payload: z.object({
      appealId: z.string(),
      decision: z.enum(['approved', 'rejected']),
      resolution: z.string(),
      reviewedBy: z.string().nullable(),
      decisionNotes: z.string().nullable(),
      appealDecisionAt: z.date(),
    }),
  }),
  z.object({
    type: z.literal('verified_complaint'),
    occurredAt: z.date(),
    payload: z.object({
      complaintId: z.string(),
      ticketNumber: z.string(),
      score: z.number().nullable(),
      scoreTier: z.string(),
      verifiedAt: z.date(),
    }),
  }),
]);

export type AuditEvent = z.infer<typeof auditEventSchema>;

export const auditTrailSchema = z.array(auditEventSchema);

// ── Query options ──

export interface AuditTrailOptions {
  /** Earliest event timestamp (inclusive). */
  from?: Date;
  /** Latest event timestamp (inclusive). */
  to?: Date;
}

function withinWindow(occurredAt: Date, opts: AuditTrailOptions): boolean {
  if (opts.from && occurredAt < opts.from) return false;
  if (opts.to && occurredAt > opts.to) return false;
  return true;
}

/**
 * Full deactivation audit trail for a business. SQL narrows by
 * businessId only (small per-business volume); verified-complaint
 * and date-window filtering are applied here so the semantics are
 * explicit and unit-testable.
 */
export async function getDeactivationAuditTrail(
  businessId: string,
  opts: AuditTrailOptions = {},
): Promise<AuditEvent[]> {
  const [notices, appealRows, complaintRows] = await Promise.all([
    db
      .select({
        id: deactivationNotices.id,
        reason: deactivationNotices.reason,
        evidence: deactivationNotices.evidence,
        createdAt: deactivationNotices.createdAt,
        gracePeriodEndsAt: deactivationNotices.gracePeriodEndsAt,
        appealDeadline: deactivationNotices.appealDeadline,
        isResolved: deactivationNotices.isResolved,
      })
      .from(deactivationNotices)
      .where(eq(deactivationNotices.businessId, businessId)),
    db
      .select({
        id: appeals.id,
        status: appeals.status,
        submittedAt: appeals.submittedAt,
        slaDeadline: appeals.slaDeadline,
        adminReviewerId: appeals.adminReviewerId,
        adminNotes: appeals.adminNotes,
        reviewedAt: appeals.reviewedAt,
        resolution: appeals.resolution,
        reactivatedAt: appeals.reactivatedAt,
      })
      .from(appeals)
      .where(eq(appeals.businessId, businessId)),
    db
      .select({
        id: complaintBookRecords.id,
        ticketNumber: complaintBookRecords.ticketNumber,
        score: complaintBookRecords.score,
        scoreTier: complaintBookRecords.scoreTier,
        isVerified: complaintBookRecords.isVerified,
        verifiedAt: complaintBookRecords.verifiedAt,
        createdAt: complaintBookRecords.createdAt,
      })
      .from(complaintBookRecords)
      .where(eq(complaintBookRecords.businessId, businessId)),
  ]);

  const events: AuditEvent[] = [];

  for (const notice of notices) {
    if (!withinWindow(notice.createdAt, opts)) continue;
    events.push({
      type: 'deactivation_notice',
      occurredAt: notice.createdAt,
      payload: {
        noticeId: notice.id,
        reason: notice.reason,
        complaintIds: notice.evidence?.complaintIds ?? [],
        gracePeriodEndsAt: notice.gracePeriodEndsAt,
        appealDeadline: notice.appealDeadline,
        isResolved: notice.isResolved,
      },
    });
  }

  for (const appeal of appealRows) {
    if (!withinWindow(appeal.submittedAt, opts)) continue;
    events.push({
      type: 'appeal',
      occurredAt: appeal.submittedAt,
      payload: {
        appealId: appeal.id,
        status: appeal.status,
        submittedAt: appeal.submittedAt,
        slaDeadline: appeal.slaDeadline,
      },
    });

    if (appeal.status !== 'pending' && appeal.reviewedAt) {
      if (!withinWindow(appeal.reviewedAt, opts)) continue;
      events.push({
        type: 'appeal_decision',
        occurredAt: appeal.reviewedAt,
        payload: {
          appealId: appeal.id,
          decision: appeal.status,
          resolution: appeal.resolution ?? 'upheld',
          reviewedBy: appeal.adminReviewerId,
          decisionNotes: appeal.adminNotes,
          appealDecisionAt: appeal.reviewedAt,
        },
      });
    }
  }

  for (const complaint of complaintRows) {
    if (!complaint.isVerified) continue;
    const occurredAt = complaint.verifiedAt ?? complaint.createdAt;
    if (!withinWindow(occurredAt, opts)) continue;
    events.push({
      type: 'verified_complaint',
      occurredAt,
      payload: {
        complaintId: complaint.id,
        ticketNumber: complaint.ticketNumber,
        score: complaint.score,
        scoreTier: complaint.scoreTier ?? 'rejected',
        verifiedAt: occurredAt,
      },
    });
  }

  events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  return auditTrailSchema.parse(events);
}
