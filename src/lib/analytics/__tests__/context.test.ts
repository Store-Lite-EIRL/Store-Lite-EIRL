import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────
// The real schema: `business_team_members` holds membership (business_id,
// user_id); the plan lives in `business_subscriptions.plan_type` (the
// `businesses` table has NO plan column). The mock dispatches by table name
// so any query against a wrong table fails loudly.

const { mockGetUser, mockFrom, mockMembershipSingle, mockSubscriptionSingle } = vi.hoisted(() => {
  const mockMembershipSingle = vi.fn();
  const mockMembershipLimit = vi.fn(() => ({ single: mockMembershipSingle }));
  const mockMembershipEq = vi.fn(() => ({ limit: mockMembershipLimit }));
  const mockMembershipSelect = vi.fn(() => ({ eq: mockMembershipEq }));

  const mockSubscriptionSingle = vi.fn();
  const mockSubscriptionLimit = vi.fn(() => ({ single: mockSubscriptionSingle }));
  const mockSubscriptionOrder = vi.fn(() => ({ limit: mockSubscriptionLimit }));
  const mockSubscriptionEqFilter = vi.fn(() => ({ order: mockSubscriptionOrder }));
  const mockSubscriptionEq = vi.fn(() => ({ eq: mockSubscriptionEqFilter }));
  const mockSubscriptionSelect = vi.fn(() => ({ eq: mockSubscriptionEq }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'business_team_members') {
      return { select: mockMembershipSelect };
    }
    if (table === 'business_subscriptions') {
      return { select: mockSubscriptionSelect };
    }
    throw new Error(`Unexpected table queried: ${table}`);
  });

  const mockGetUser = vi.fn();

  return {
    mockGetUser,
    mockFrom,
    mockMembershipSingle,
    mockSubscriptionSingle,
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { getAnalyticsContext } from '../context';

describe('getAnalyticsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns userId, businessId, and active-subscription plan when they exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
    mockMembershipSingle.mockResolvedValue({ data: { business_id: 'biz-123' } });
    mockSubscriptionSingle.mockResolvedValue({ data: { plan_type: 'emprendedor' } });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: 'user-abc',
      businessId: 'biz-123',
      plan: 'emprendedor',
    });
  });

  it('queries business_team_members (not business_members) and business_subscriptions for plan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
    mockMembershipSingle.mockResolvedValue({ data: { business_id: 'biz-123' } });
    mockSubscriptionSingle.mockResolvedValue({ data: { plan_type: 'pro' } });

    await getAnalyticsContext();

    expect(mockFrom).toHaveBeenCalledWith('business_team_members');
    expect(mockFrom).not.toHaveBeenCalledWith('business_members');
    expect(mockSubscriptionSingle).toHaveBeenCalled();
  });

  it('returns null userId and defaults when no session exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: null,
      businessId: null,
      plan: 'none',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns businessId with "none" plan when membership has no active subscription', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-xyz' } } });
    mockMembershipSingle.mockResolvedValue({ data: { business_id: 'biz-456' } });
    mockSubscriptionSingle.mockResolvedValue({ data: null });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: 'user-xyz',
      businessId: 'biz-456',
      plan: 'none',
    });
  });

  it('returns null businessId and "none" plan when user has no membership', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-lonely' } } });
    mockMembershipSingle.mockResolvedValue({ data: null });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: 'user-lonely',
      businessId: null,
      plan: 'none',
    });
    expect(mockFrom).not.toHaveBeenCalledWith('business_subscriptions');
  });
});
