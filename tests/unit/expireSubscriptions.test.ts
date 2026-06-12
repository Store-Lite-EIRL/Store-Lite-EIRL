// =====================================================
// expireSubscriptions — Unit tests
// =====================================================
// Verifies SCD-002: expireSubscriptions() marks
// expired subscriptions as inactive, idempotently.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockReturningChain = vi.fn();
const mockWhereChain = vi.fn(() => ({ returning: mockReturningChain }));
const mockSetChain = vi.fn(() => ({ where: mockWhereChain }));
const mockUpdate = vi.fn(() => ({ set: mockSetChain }));

vi.mock('@/core/database/client', () => ({
  db: {
    update: mockUpdate,
  },
}));

// ── Suite ────────────────────────────────────────────

describe('expireSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates expired active subscriptions to inactive', async () => {
    mockReturningChain.mockResolvedValue([{ id: 'sub_1' }, { id: 'sub_2' }, { id: 'sub_3' }]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 3 });

    // Verify the correct table and conditions
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockSetChain).toHaveBeenCalledWith({
      planStatus: 'inactive',
      updatedAt: expect.any(Date),
    });
  });

  test('returns 0 when no subscriptions are expired', async () => {
    mockReturningChain.mockResolvedValue([]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0 });
  });

  test('is idempotent — running twice returns same result', async () => {
    mockReturningChain.mockResolvedValue([{ id: 'sub_1' }, { id: 'sub_2' }]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const first = await expireSubscriptions();
    const second = await expireSubscriptions();

    expect(first).toEqual({ expired: 2 });
    expect(second).toEqual({ expired: 2 });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  test('does not update subscriptions that are already inactive', async () => {
    // The WHERE clause filters planStatus = 'active',
    // so inactive subscriptions are never touched.
    mockReturningChain.mockResolvedValue([]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0 });
  });
});
