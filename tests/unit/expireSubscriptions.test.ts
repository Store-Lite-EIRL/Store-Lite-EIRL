// =====================================================
// expireSubscriptions — Unit tests
// =====================================================
// Verifies SCD-002: expireSubscriptions() marks
// expired subscriptions as inactive, idempotently.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockUpdateChain = vi.fn();
const mockSetChain = vi.fn(() => ({ where: mockUpdateChain }));
const mockWhereChain = vi.fn(() => ({ rowCount: 0 }));
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
    mockUpdateChain.mockResolvedValue({ rowCount: 3 });

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 3 });

    // Verify the correct table and conditions
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockSetChain).toHaveBeenCalledWith({ planStatus: 'inactive' });
  });

  test('returns 0 when no subscriptions are expired', async () => {
    mockUpdateChain.mockResolvedValue({ rowCount: 0 });

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0 });
  });

  test('is idempotent — running twice returns same result', async () => {
    mockUpdateChain.mockResolvedValue({ rowCount: 2 });

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
    mockUpdateChain.mockResolvedValue({ rowCount: 0 });

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0 });
  });

  test('handles rowCount being null gracefully', async () => {
    // Simulate driver returning null rowCount
    mockUpdateChain.mockResolvedValue({ rowCount: null });

    const { expireSubscriptions } = await import('@/core/entitlements/expireSubscriptions');

    const result = await expireSubscriptions();

    expect(result).toEqual({ expired: 0 });
  });
});
