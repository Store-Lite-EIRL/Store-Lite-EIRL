// =====================================================
// expireSubscriptions — Unit tests
// =====================================================
// Verifies SCD-002: expireSubscriptions() marks
// expired subscriptions as inactive, idempotently.
// Also verifies T2: enforceProductLimit is called
// for each expired business.
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

const mockEnforceProductLimit = vi.fn();

vi.mock('@/core/entitlements/enforceProductLimit', () => ({
  enforceProductLimit: mockEnforceProductLimit,
}));

// ── Suite ────────────────────────────────────────────

describe('expireSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates expired active subscriptions to inactive and disables excess products', async () => {
    mockReturningChain.mockResolvedValue([
      { id: 'sub_1', businessId: 'biz_1' },
      { id: 'sub_2', businessId: 'biz_2' },
      { id: 'sub_3', businessId: 'biz_3' },
    ]);
    mockEnforceProductLimit.mockResolvedValue(5);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 3, productsDisabled: 15 });

    // Verify the correct table and conditions
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockSetChain).toHaveBeenCalledWith({
      planStatus: 'inactive',
      updatedAt: expect.any(Date),
    });

    // Verify enforceProductLimit called per expired business
    expect(mockEnforceProductLimit).toHaveBeenCalledTimes(3);
    expect(mockEnforceProductLimit).toHaveBeenCalledWith('biz_1', 50);
    expect(mockEnforceProductLimit).toHaveBeenCalledWith('biz_2', 50);
    expect(mockEnforceProductLimit).toHaveBeenCalledWith('biz_3', 50);
  });

  test('returns 0 when no subscriptions are expired', async () => {
    mockReturningChain.mockResolvedValue([]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0, productsDisabled: 0 });
    expect(mockEnforceProductLimit).not.toHaveBeenCalled();
  });

  test('is idempotent — running twice returns same result', async () => {
    mockReturningChain.mockResolvedValue([
      { id: 'sub_1', businessId: 'biz_1' },
      { id: 'sub_2', businessId: 'biz_2' },
    ]);
    mockEnforceProductLimit.mockResolvedValue(3);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const first = await expireSubscriptions();
    const second = await expireSubscriptions();

    expect(first).toEqual({ expired: 2, productsDisabled: 6 });
    expect(second).toEqual({ expired: 2, productsDisabled: 6 });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  test('does not update subscriptions that are already inactive', async () => {
    mockReturningChain.mockResolvedValue([]);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0, productsDisabled: 0 });
    expect(mockEnforceProductLimit).not.toHaveBeenCalled();
  });

  test('returns productsDisabled as 0 when expired business has no excess products', async () => {
    mockReturningChain.mockResolvedValue([{ id: 'sub_1', businessId: 'biz_1' }]);
    mockEnforceProductLimit.mockResolvedValue(0);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 1, productsDisabled: 0 });
    expect(mockEnforceProductLimit).toHaveBeenCalledTimes(1);
    expect(mockEnforceProductLimit).toHaveBeenCalledWith('biz_1', 50);
  });

  test('handles multiple businesses with varied disabled counts', async () => {
    mockReturningChain.mockResolvedValue([
      { id: 'sub_a', businessId: 'biz_a' },
      { id: 'sub_b', businessId: 'biz_b' },
      { id: 'sub_c', businessId: 'biz_c' },
    ]);
    mockEnforceProductLimit
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 3, productsDisabled: 13 });
    expect(mockEnforceProductLimit).toHaveBeenCalledTimes(3);
    expect(mockEnforceProductLimit).toHaveBeenNthCalledWith(1, 'biz_a', 50);
    expect(mockEnforceProductLimit).toHaveBeenNthCalledWith(2, 'biz_b', 50);
    expect(mockEnforceProductLimit).toHaveBeenNthCalledWith(3, 'biz_c', 50);
  });
});
