// =====================================================
// src/features/legal/actions/appealReview — Unit tests
// =====================================================
// Verifies the admin appeal review server action:
//  - ENABLE_AUTO_DEACTIVATION flag gates the whole action
//  - Zod validation produces a 400-style error state
//  - only owners/admins of the business may review
//  - approved → business reactivated, appeal updated,
//    deactivation notice resolved, decision notification sent
//  - rejected → business stays deactivated, notification sent
//  - notification failure is non-fatal (DB trail is the truth)
// =====================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// restoreMocks: true wipes vi.fn implementations each test,
// so ALL implementations are re-seeded in beforeEach.

const APPEAL_ID = '11111111-1111-4111-8111-111111111111';
const BUSINESS_ID = '22222222-2222-4222-8222-222222222222';
const NOTICE_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_USER_ID = '44444444-4444-4444-8444-444444444444';

const mocks = vi.hoisted(() => ({
  appealFindFirst: vi.fn(),
  update: vi.fn(),
  requireAuthenticatedUserId: vi.fn(),
  getMemberPermissions: vi.fn(),
  sendAppealDecisionNotification: vi.fn(),
  revalidatePath: vi.fn(),
  updateCalls: [] as { table: string; values: Record<string, unknown> }[],
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      appeals: { findFirst: mocks.appealFindFirst },
    },
    update: mocks.update,
  },
}));

vi.mock('@/core/database/schema', () => {
  const appeals = {
    id: 'appeals.id',
    businessId: 'appeals.businessId',
    deactivationNoticeId: 'appeals.deactivationNoticeId',
    status: 'appeals.status',
    adminReviewerId: 'appeals.adminReviewerId',
    adminNotes: 'appeals.adminNotes',
    reviewedAt: 'appeals.reviewedAt',
    resolution: 'appeals.resolution',
    reactivatedAt: 'appeals.reactivatedAt',
    _tableName: 'appeals',
  };
  const businesses = {
    id: 'businesses.id',
    isActive: 'businesses.isActive',
    deactivationReason: 'businesses.deactivationReason',
    deactivationDate: 'businesses.deactivationDate',
    appealStatus: 'businesses.appealStatus',
    gracePeriodEndsAt: 'businesses.gracePeriodEndsAt',
    updatedAt: 'businesses.updatedAt',
    _tableName: 'businesses',
  };
  const deactivationNotices = {
    id: 'notices.id',
    isResolved: 'notices.isResolved',
    resolvedAt: 'notices.resolvedAt',
    resolvedBy: 'notices.resolvedBy',
    _tableName: 'deactivationNotices',
  };
  return { appeals, businesses, deactivationNotices };
});

vi.mock('@/features/storage/actions/authz', () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock('@/lib/permissions', () => ({
  getMemberPermissions: mocks.getMemberPermissions,
}));

vi.mock('@/lib/legal/gracePeriodWorkflow', () => ({
  sendAppealDecisionNotification: mocks.sendAppealDecisionNotification,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

// Import after mocks
import { reviewAppeal } from '../appealReview';

// ── Fixtures ─────────────────────────────────────────

function makeAppeal(overrides: Record<string, unknown> = {}) {
  return {
    id: APPEAL_ID,
    businessId: BUSINESS_ID,
    deactivationNoticeId: NOTICE_ID,
    status: 'pending',
    ...overrides,
  };
}

function getUpdateValuesFor(table: string): Record<string, unknown> | undefined {
  return mocks.updateCalls.find((call) => call.table === table)?.values;
}

// ── Suite ────────────────────────────────────────────

describe('reviewAppeal (server action)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCalls.length = 0;
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';

    mocks.appealFindFirst.mockResolvedValue(makeAppeal());
    mocks.requireAuthenticatedUserId.mockResolvedValue(ADMIN_USER_ID);
    mocks.getMemberPermissions.mockResolvedValue({
      isOwner: false,
      role: 'admin',
      permissions: [],
    });
    mocks.sendAppealDecisionNotification.mockResolvedValue({ success: true });

    mocks.update.mockImplementation((table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        mocks.updateCalls.push({
          table: (table as { _tableName?: string })._tableName ?? 'unknown',
          values,
        });
        return { where: vi.fn().mockResolvedValue(undefined) };
      },
    }));
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  it('returns a no-op success and touches nothing when the flag is off', async () => {
    process.env.ENABLE_AUTO_DEACTIVATION = 'false';

    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'approved',
      adminNotes: 'Notes',
    });

    expect(result).toMatchObject({ success: true, skipped: true });
    expect(mocks.appealFindFirst).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.sendAppealDecisionNotification).not.toHaveBeenCalled();
  });

  it('returns a validation error state for invalid input', async () => {
    const result = await reviewAppeal({
      appealId: 'not-a-uuid',
      decision: 'approved',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mocks.requireAuthenticatedUserId).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('requires adminNotes when the decision is rejected', async () => {
    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'rejected',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('required when rejecting');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('denies non-admin team members', async () => {
    mocks.getMemberPermissions.mockResolvedValue({
      isOwner: false,
      role: 'member',
      permissions: ['products.view'],
    });

    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'approved',
      adminNotes: 'Notes',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Admin access required');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.sendAppealDecisionNotification).not.toHaveBeenCalled();
  });

  it('approves: reactivates the business, resolves the appeal and deactivation notice, notifies with approved content', async () => {
    const reviewedAt = new Date('2026-09-16T10:00:00.000Z');

    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'approved',
      adminNotes: 'Evidencia suficiente',
      decisionTimestampOverride: reviewedAt,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      appealId: APPEAL_ID,
      businessId: BUSINESS_ID,
      decision: 'approved',
      resolution: 'reactivated',
      notificationSent: true,
    });
    expect((result.data as { reviewedAt: string }).reviewedAt).toBe(reviewedAt.toISOString());

    // Appeal row updated with the review decision
    const appealValues = getUpdateValuesFor('appeals');
    expect(appealValues).toMatchObject({
      status: 'approved',
      adminReviewerId: ADMIN_USER_ID,
      adminNotes: 'Evidencia suficiente',
      resolution: 'reactivated',
    });
    expect((appealValues as Record<string, unknown>).reviewedAt).toEqual(reviewedAt);

    // Business reactivated and deactivation fields cleared
    const businessValues = getUpdateValuesFor('businesses');
    expect(businessValues).toMatchObject({
      isActive: true,
      deactivationReason: null,
      deactivationDate: null,
      appealStatus: 'approved',
      gracePeriodEndsAt: null,
    });

    // Deactivation notice resolved as appeal_approved
    expect(getUpdateValuesFor('deactivationNotices')).toMatchObject({
      isResolved: true,
      resolvedBy: 'appeal_approved',
    });

    // Decision notification sent with approved arm + reactivation timestamp
    expect(mocks.sendAppealDecisionNotification).toHaveBeenCalledTimes(1);
    expect(mocks.sendAppealDecisionNotification).toHaveBeenCalledWith(
      BUSINESS_ID,
      'approved',
      'Evidencia suficiente',
      reviewedAt,
    );
  });

  it('rejects: keeps the business deactivated, marks notice as admin_override, notifies with rejected content', async () => {
    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'rejected',
      adminNotes: 'Sin sustento',
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      decision: 'rejected',
      resolution: 'upheld',
      notificationSent: true,
    });

    const appealValues = getUpdateValuesFor('appeals');
    expect(appealValues).toMatchObject({
      status: 'rejected',
      resolution: 'upheld',
      adminNotes: 'Sin sustento',
    });
    expect((appealValues as Record<string, unknown>).reactivatedAt).toBeUndefined();

    // Business stays deactivated: no isActive flip, only appealStatus moves
    const businessValues = getUpdateValuesFor('businesses');
    expect(businessValues).toMatchObject({
      appealStatus: 'rejected',
    });
    expect((businessValues as Record<string, unknown>).isActive).toBeUndefined();

    expect(getUpdateValuesFor('deactivationNotices')).toMatchObject({
      isResolved: true,
      resolvedBy: 'admin_override',
    });

    expect(mocks.sendAppealDecisionNotification).toHaveBeenCalledWith(
      BUSINESS_ID,
      'rejected',
      'Sin sustento',
      undefined,
    );
  });

  it('keeps the review successful when the decision notification fails (non-fatal)', async () => {
    mocks.sendAppealDecisionNotification.mockResolvedValue({
      success: false,
      error: 'Email provider down',
    });

    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'approved',
      adminNotes: 'Notes',
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ notificationSent: false });
    expect(getUpdateValuesFor('appeals')).toMatchObject({ status: 'approved' });
    expect(getUpdateValuesFor('businesses')).toMatchObject({ isActive: true });
  });

  it('returns an error state when the appeal does not exist', async () => {
    mocks.appealFindFirst.mockResolvedValue(null);

    const result = await reviewAppeal({
      appealId: APPEAL_ID,
      decision: 'approved',
      adminNotes: 'Notes',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
