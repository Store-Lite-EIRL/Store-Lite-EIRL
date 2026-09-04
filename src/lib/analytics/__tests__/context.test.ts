import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────

const { mockGetUser, mockSupabaseChain } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockLimit = vi.fn(() => ({ single: mockSingle }));
  const mockEq = vi.fn(() => ({ limit: mockLimit }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  const mockGetUser = vi.fn();

  return {
    mockGetUser,
    mockSupabaseChain: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      single: mockSingle,
    },
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseChain.from,
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

  it('returns userId, businessId, and plan when session and business exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
    mockSupabaseChain.single.mockResolvedValue({
      data: { business_id: 'biz-123', businesses: [{ id: 'biz-123', plan: 'pro' }] },
    });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: 'user-abc',
      businessId: 'biz-123',
      plan: 'pro',
    });
  });

  it('returns null userId and defaults when no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: null,
      businessId: null,
      plan: 'none',
    });
    expect(mockSupabaseChain.from).not.toHaveBeenCalled();
  });

  it('returns "none" plan when business has no plan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-xyz' } } });
    mockSupabaseChain.single.mockResolvedValue({
      data: { business_id: 'biz-456', businesses: [{ id: 'biz-456', plan: null }] },
    });

    const ctx = await getAnalyticsContext();

    expect(ctx).toEqual({
      userId: 'user-xyz',
      businessId: 'biz-456',
      plan: 'none',
    });
  });
});
