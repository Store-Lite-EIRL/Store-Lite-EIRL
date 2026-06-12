// =====================================================
// getBusinessEntitlements — Unit tests
// =====================================================
// Verifies SCD-001: expiration check, plan selection,
// and edge cases (no subscription, expired, inactive).
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockBusinessFindFirst = vi.fn();
const mockSubscriptionFindFirst = vi.fn();
const mockSettingsFindFirst = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: { findFirst: mockBusinessFindFirst },
      businessSubscriptions: { findFirst: mockSubscriptionFindFirst },
      businessSettings: { findFirst: mockSettingsFindFirst },
    },
  },
}));

// ── Helpers ──────────────────────────────────────────

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    planType: 'business_pro',
    planEndDate: new Date('2026-12-31T23:59:59Z'), // far future
    ...overrides,
  };
}

function makeSettings(overrides: Record<string, unknown> = {}) {
  return {
    culqiPublicKey: 'pk_test_xxx',
    culqiSecretKey: 'sk_test_xxx',
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('getBusinessEntitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockBusinessFindFirst.mockResolvedValue({ isActive: true });
    mockSettingsFindFirst.mockResolvedValue(makeSettings());
  });

  test('returns plan entitlements for active valid subscription', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription());

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.plan).toBe('business_pro');
    expect(result.maxProducts).toBe(300);
    expect(result.canImportProducts).toBe(true);
    expect(result.hasPaymentGateway).toBe(true);
    expect(result.planEndDate).toBe('2026-12-31T23:59:59.000Z');
  });

  test('returns DEFAULT_PLAN when subscription is expired', async () => {
    // planEndDate in the past
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ planEndDate: new Date('2024-01-01T00:00:00Z') }),
    );

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.plan).toBe('basico');
    expect(result.maxProducts).toBe(50);
    expect(result.hasPaymentGateway).toBe(false);
    expect(result.planEndDate).toBe('2024-01-01T00:00:00.000Z');
  });

  test('returns DEFAULT_PLAN when no subscription exists', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.plan).toBe('basico');
    expect(result.maxProducts).toBe(50);
    expect(result.planEndDate).toBeNull();
  });

  test('returns DEFAULT_PLAN when subscription status is inactive', async () => {
    // The query already filters planStatus = 'active', so inactive → null
    mockSubscriptionFindFirst.mockResolvedValue(null);

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.plan).toBe('basico');
    expect(result.planEndDate).toBeNull();
  });

  test('includes isActive from business record', async () => {
    mockBusinessFindFirst.mockResolvedValue({ isActive: false });
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription());

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.isActive).toBe(false);
    expect(result.plan).toBe('business_pro');
  });

  test('exposes culqiPublicKey when payment is configured', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription());

    const { getBusinessEntitlements } = await import('@/core/entitlements/getBusinessEntitlements');

    const result = await getBusinessEntitlements('biz_123');

    expect(result.culqiPublicKey).toBe('pk_test_xxx');
    expect(result.isPaymentConfigured).toBe(true);
  });
});
