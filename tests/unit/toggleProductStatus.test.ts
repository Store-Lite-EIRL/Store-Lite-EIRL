// =====================================================
// toggleProductStatus — Unit tests
// =====================================================
// Verifies T5: guard against enabling products when
// business has reached its plan's maxProducts limit.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockRequireOwnedBusinessBySlug = vi.fn();
const mockGetEntitlements = vi.fn();
const mockSelect = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelectWhere = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock('@/features/storage/actions/authz', () => ({
  requireOwnedBusinessBySlug: mockRequireOwnedBusinessBySlug,
}));

vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

vi.mock('@/core/database/client', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ── Chain helpers ────────────────────────────────────

function setupSelectChains() {
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
}

function setupUpdateChains() {
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
}

// ── Entitlements helpers ─────────────────────────────

const BASE_ENTITLEMENTS = {
  plan: 'emprendedor' as const,
  isActive: true,
  hasPaymentGateway: true,
  isPaymentConfigured: true,
  maxProducts: 150,
  maxCategories: 7,
  canImportProducts: true,
  canCustomizeStorefront: true,
  chatEnabled: true,
  dashboardEnabled: true,
  seoEnabled: true,
  canUseAIAssistant: true,
  maxTeamMembers: 3,
  culqiPublicKey: undefined as string | undefined,
  planEndDate: null as string | null,
};

// ── Suite ────────────────────────────────────────────

describe('toggleProductStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSelectChains();
    setupUpdateChains();

    // Default: authenticated as business owner
    mockRequireOwnedBusinessBySlug.mockResolvedValue({
      businessId: 'biz-123',
      ownerId: 'user-456',
      slug: 'test-business',
    });

    // Default: unlimited plan (no guard trigger)
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: -1,
    });

    // Default: select count succeeds with 0 active products
    mockSelectWhere.mockResolvedValue([{ count: 0 }]);

    // Default: update succeeds
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  // ============================================================
  // TOGGLE ENABLE (false → true)
  // ============================================================

  test('toggle enable succeeds when under the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: 10,
    });
    mockSelectWhere.mockResolvedValue([{ count: 5 }]);

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', false, 'test-business');

    expect(result).toEqual({ success: true, newStatus: true });

    // Should have counted active products
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelectWhere).toHaveBeenCalled();

    // Should have proceeded with update
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateWhere).toHaveBeenCalled();
  });

  test('toggle enable returns error when at the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: 10,
    });
    mockSelectWhere.mockResolvedValue([{ count: 10 }]);

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', false, 'test-business');

    expect(result).toEqual({
      success: false,
      error:
        'Has alcanzado el límite de 10 productos activos para tu plan actual. Desactiva otros productos o mejora tu plan para activar este.',
    });

    // Should NOT have proceeded with update
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('toggle enable returns error when over the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: 10,
    });
    mockSelectWhere.mockResolvedValue([{ count: 12 }]);

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', false, 'test-business');

    expect(result).toEqual({
      success: false,
      error:
        'Has alcanzado el límite de 10 productos activos para tu plan actual. Desactiva otros productos o mejora tu plan para activar este.',
    });

    // Should NOT have proceeded with update
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('toggle enable succeeds when plan has unlimited products', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: -1,
    });

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', false, 'test-business');

    expect(result).toEqual({ success: true, newStatus: true });

    // Should NOT have counted products (unlimited — skip check)
    expect(mockSelect).not.toHaveBeenCalled();

    // Should have proceeded with update
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // TOGGLE DISABLE (true → false) — always allowed
  // ============================================================

  test('toggle disable always succeeds — no limit check', async () => {
    // Even when at/over limit, disabling should be allowed
    mockGetEntitlements.mockResolvedValue({
      ...BASE_ENTITLEMENTS,
      maxProducts: 10,
    });
    mockSelectWhere.mockResolvedValue([{ count: 10 }]);

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', true, 'test-business');

    expect(result).toEqual({ success: true, newStatus: false });

    // Should NOT have checked product count (disabling skips check)
    expect(mockSelect).not.toHaveBeenCalled();

    // Should have proceeded with update
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  test('returns error when requireOwnedBusinessBySlug throws', async () => {
    mockRequireOwnedBusinessBySlug.mockRejectedValue(new Error('No autorizado'));

    const { toggleProductStatus } = await import('@/features/storage/isolatedUpdateAction');

    const result = await toggleProductStatus('prod-1', false, 'test-business');

    expect(result).toEqual({ success: false, error: 'No autorizado' });

    // Should NOT proceed with any DB operations
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
