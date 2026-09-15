// =====================================================
// src/lib/legal/indecopiAudit — Unit tests
// =====================================================
// Verifies the DS 011-2011-PCM / INDECOPI audit trail query:
//  - getDeactivationAuditTrail combines deactivation notices,
//    appeals (submission + decision) and verified complaints
//    into a single chronological event stream
//  - events are typed via a Zod discriminated union so the
//    trail is serialization-safe
//  - businessId-only SQL fetch; window filtering happens in
//    JS so the filtering logic is fully unit-testable
// =====================================================

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// The module only filters by businessId in SQL; the mock
// returns ALL rows for the business. Any filtering the module
// must do (verified complaints, date window) is real logic
// exercised by these tests.

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  // Queue of row arrays returned by the 3 where() calls
  // (notices → appeals → complaints) in module execution order.
  rowQueue: [] as unknown[][],
}));

vi.mock('@/core/database/client', () => ({
  db: {
    select: mocks.select,
  },
}));

vi.mock('@/core/database/schema', () => ({
  deactivationNotices: {
    id: 'notices.id',
    businessId: 'notices.businessId',
    reason: 'notices.reason',
    evidence: 'notices.evidence',
    createdAt: 'notices.createdAt',
    gracePeriodEndsAt: 'notices.gracePeriodEndsAt',
    appealDeadline: 'notices.appealDeadline',
    isResolved: 'notices.isResolved',
  },
  appeals: {
    id: 'appeals.id',
    businessId: 'appeals.businessId',
    status: 'appeals.status',
    submittedAt: 'appeals.submittedAt',
    slaDeadline: 'appeals.slaDeadline',
    adminReviewerId: 'appeals.adminReviewerId',
    adminNotes: 'appeals.adminNotes',
    reviewedAt: 'appeals.reviewedAt',
    resolution: 'appeals.resolution',
    reactivatedAt: 'appeals.reactivatedAt',
  },
  complaintBookRecords: {
    id: 'complaints.id',
    businessId: 'complaints.businessId',
    ticketNumber: 'complaints.ticketNumber',
    score: 'complaints.score',
    scoreTier: 'complaints.scoreTier',
    isVerified: 'complaints.isVerified',
    verifiedAt: 'complaints.verifiedAt',
    createdAt: 'complaints.createdAt',
  },
}));

import { auditTrailSchema, getDeactivationAuditTrail } from '@/lib/legal/indecopiAudit';

// ── Fixtures ─────────────────────────────────────────

const T1 = new Date('2026-09-14T09:00:00.000Z'); // verified complaint
const T2 = new Date('2026-09-15T12:00:00.000Z'); // deactivation notice
const T3 = new Date('2026-09-15T15:00:00.000Z'); // appeal decision
const T4 = new Date('2026-09-15T18:00:00.000Z'); // appeal submission

function makeNotice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notice-1',
    reason: 'verified_complaints',
    evidence: { complaintIds: ['c1', 'c2'], orderIds: [] },
    createdAt: T2,
    gracePeriodEndsAt: new Date('2026-09-18T12:00:00.000Z'),
    appealDeadline: new Date('2026-09-25T12:00:00.000Z'),
    isResolved: true,
    ...overrides,
  };
}

function makeAppeal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appeal-1',
    status: 'approved',
    submittedAt: T4,
    slaDeadline: new Date('2026-09-25T12:00:00.000Z'),
    adminReviewerId: 'admin-1',
    adminNotes: 'Evidencia suficiente',
    reviewedAt: T3,
    resolution: 'reactivated',
    reactivatedAt: T3,
    ...overrides,
  };
}

function makeComplaint(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    ticketNumber: 'LR-2026-abc12345-0001',
    score: 85,
    scoreTier: 'verified',
    isVerified: true,
    verifiedAt: T1,
    createdAt: T1,
    ...overrides,
  };
}

function seedRows(...rows: unknown[][]) {
  for (const row of rows) mocks.rowQueue.push(row);
}

function mockSelectChain() {
  mocks.select.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(mocks.rowQueue.shift() ?? [])),
    })),
  }));
}

// ── Suite ────────────────────────────────────────────

describe('getDeactivationAuditTrail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rowQueue.length = 0;
    mockSelectChain();
  });

  it('returns an empty array for a business with no records', async () => {
    const result = await getDeactivationAuditTrail('biz-nowhere');

    expect(result).toEqual([]);
  });

  it('orders events chronologically across notices, complaints and appeals', async () => {
    seedRows(
      [makeNotice()], // notices
      [makeAppeal()], // appeals
      [makeComplaint()], // complaints
    );

    const result = await getDeactivationAuditTrail('biz-1');

    expect(result.map((e) => e.type)).toEqual([
      'verified_complaint',
      'deactivation_notice',
      'appeal_decision',
      'appeal',
    ]);
    expect(result.map((e) => e.occurredAt)).toEqual([T1, T2, T3, T4]);
  });

  it('emits an appeal and an appeal_decision event for a reviewed appeal', async () => {
    seedRows([], [makeAppeal()], []);

    const result = await getDeactivationAuditTrail('biz-1');

    const appealEvents = result.filter((e) => e.type === 'appeal');
    const decisionEvents = result.filter((e) => e.type === 'appeal_decision');

    expect(appealEvents).toHaveLength(1);
    expect(decisionEvents).toHaveLength(1);
    if (appealEvents[0].type === 'appeal') {
      expect(appealEvents[0].payload).toMatchObject({
        appealId: 'appeal-1',
        status: 'approved',
      });
    }
    if (decisionEvents[0].type === 'appeal_decision') {
      expect(decisionEvents[0].payload).toMatchObject({
        appealId: 'appeal-1',
        decision: 'approved',
        resolution: 'reactivated',
        reviewedBy: 'admin-1',
        decisionNotes: 'Evidencia suficiente',
      });
    }
  });

  it('does not emit an appeal_decision event for a pending appeal', async () => {
    seedRows([], [makeAppeal({ status: 'pending', reviewedAt: null, resolution: null })], []);

    const result = await getDeactivationAuditTrail('biz-1');

    expect(result.filter((e) => e.type === 'appeal_decision')).toHaveLength(0);
    expect(result).toHaveLength(1);
  });

  it('excludes complaints that are not verified', async () => {
    seedRows(
      [],
      [],
      [
        makeComplaint({ id: 'c1', isVerified: true }),
        makeComplaint({ id: 'c2', isVerified: false }),
      ],
    );

    const result = await getDeactivationAuditTrail('biz-1');

    expect(result).toHaveLength(1);
    const complaintEvents = result.filter((e) => e.type === 'verified_complaint');
    expect(complaintEvents).toHaveLength(1);
    if (complaintEvents[0].type === 'verified_complaint') {
      expect(complaintEvents[0].payload.complaintId).toBe('c1');
    }
  });

  it('includes verified complaints only within the from/to window', async () => {
    seedRows(
      [],
      [makeAppeal({ status: 'pending', reviewedAt: null, resolution: null })],
      [
        makeComplaint({ id: 'inside', verifiedAt: T2 }), // inside [T1, T3]
        makeComplaint({ id: 'before', verifiedAt: new Date('2026-09-10T00:00:00.000Z') }),
        makeComplaint({ id: 'after', verifiedAt: new Date('2026-09-20T00:00:00.000Z') }),
      ],
    );

    const result = await getDeactivationAuditTrail('biz-1', { from: T1, to: T3 });

    const inside = result.filter(
      (e): e is Extract<typeof e, { type: 'verified_complaint' }> =>
        e.type === 'verified_complaint',
    );
    expect(inside).toHaveLength(1);
    expect(inside[0].payload.complaintId).toBe('inside');
  });

  it('parses cleanly with the exported Zod audit trail schema', async () => {
    seedRows([makeNotice()], [makeAppeal()], [makeComplaint({ id: 'c1', score: null })]);

    const result = await getDeactivationAuditTrail('biz-1');

    expect(() => auditTrailSchema.parse(result)).not.toThrow();
    expect(auditTrailSchema.parse(result)).toHaveLength(4);
  });
});
