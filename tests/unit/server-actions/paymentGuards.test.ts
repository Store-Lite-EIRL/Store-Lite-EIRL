// =====================================================
// paymentGuards — hasLockingPayments unit tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const { mockSelect, mockSelectFrom, mockSelectWhere } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockSelectFrom = vi.fn();
  const mockSelectWhere = vi.fn();

  return { mockSelect, mockSelectFrom, mockSelectWhere };
});

vi.mock('@/core/database/client', () => ({
  db: {
    select: mockSelect,
  },
}));

// ── Suite ────────────────────────────────────────────

describe('hasLockingPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain: select → from → where → returns [{ count: 0 }]
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectWhere.mockResolvedValue([{ count: 0 }]);
  });

  test('returns true when business has pending payments', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const result = await hasLockingPayments({ businessId: 'biz-123' });

    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  test('returns true when business has paid payments', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 3 }]);

    const result = await hasLockingPayments({ businessId: 'biz-123' });

    expect(result).toBe(true);
  });

  test('returns false when business has only failed payments', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 0 }]);

    const result = await hasLockingPayments({ businessId: 'biz-123' });

    expect(result).toBe(false);
  });

  test('returns true when product has locking payments', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 2 }]);

    const result = await hasLockingPayments({ productId: 'prod-456' });

    expect(result).toBe(true);
    expect(mockSelectFrom).toHaveBeenCalled();
  });

  test('returns false when product has no locking payments', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 0 }]);

    const result = await hasLockingPayments({ productId: 'prod-456' });

    expect(result).toBe(false);
  });

  test('returns false when count is exactly 0', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 0 }]);

    const result = await hasLockingPayments({ businessId: 'biz-empty' });

    expect(result).toBe(false);
  });

  test('returns true when count is greater than 0', async () => {
    const { hasLockingPayments } = await import('@/core/orders/paymentGuards');

    mockSelectWhere.mockResolvedValue([{ count: 5 }]);

    const result = await hasLockingPayments({ businessId: 'biz-many' });

    expect(result).toBe(true);
  });
});
