// =====================================================
// importProductsBatch — Server Action unit tests
// =====================================================
// Tests for T6: Product limit check on batch import
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

// Auth
const mockRequireOwnedBusinessBySlug = vi.fn();

vi.mock('@/features/storage/actions/authz', () => ({
  requireOwnedBusinessBySlug: mockRequireOwnedBusinessBySlug,
}));

// Entitlements
const mockGetEntitlements = vi.fn();

vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

// Database
const mockQueryProductCategoriesFindMany = vi.fn();
const mockSelect = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelectWhere = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      productCategories: {
        findMany: mockQueryProductCategoriesFindMany,
      },
    },
    select: mockSelect,
    insert: mockInsert,
  },
}));

// Notifications
vi.mock('@/lib/notifications', () => ({
  notifyLowStock: vi.fn().mockResolvedValue(undefined),
  notifyOutOfStock: vi.fn().mockResolvedValue(undefined),
}));

// Cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Error logging
vi.mock('@/lib/errorHandling', () => ({
  logError: vi.fn(),
}));

// ── Chain helpers ────────────────────────────────────

function setupSelectChains() {
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
}

function setupInsertChains() {
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
}

// ── Helpers ──────────────────────────────────────────

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Laptop Gamer',
    description: 'Una laptop potente para gaming',
    price: 2999.99,
    stock: 10,
    category: 'Electrónicos',
    status: 'ACTIVO',
    imageUrl: 'https://example.com/img.jpg',
    brand: 'TechBrand',
    metadata: { color: 'negro' },
    ...overrides,
  };
}

function buildProductList(count: number, overrides?: Record<string, unknown>) {
  return Array.from({ length: count }, (_, i) =>
    validInput({ name: `Product ${i + 1}`, ...overrides }),
  );
}

const DEFAULT_ENTITLEMENTS = {
  plan: 'emprendedor' as const,
  isActive: true,
  hasPaymentGateway: true,
  isPaymentConfigured: true,
  maxProducts: -1,
  maxCategories: -1,
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

describe('importProductsBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSelectChains();
    setupInsertChains();

    // Default: auth succeeds
    mockRequireOwnedBusinessBySlug.mockResolvedValue({ businessId: 'biz-123' });

    // Default: unlimited plan
    mockGetEntitlements.mockResolvedValue(DEFAULT_ENTITLEMENTS);

    // Default: category already exists
    mockQueryProductCategoriesFindMany.mockResolvedValue([
      { id: 'cat-electronics', name: 'Electrónicos', slug: 'electronicos' },
    ]);

    // Default: product insert succeeds
    mockInsertReturning.mockResolvedValue([{ id: 'prod-1' }]);
  });

  // ============================================================
  // PLAN LIMITS (T6)
  // ============================================================

  test('imports products when under the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxProducts: 10,
    });

    // 5 existing active products + 3 incoming = 8 ≤ 10
    mockSelectWhere.mockResolvedValue([{ count: 5 }]);
    mockInsertReturning.mockResolvedValue([{ id: 'prod-1' }, { id: 'prod-2' }, { id: 'prod-3' }]);

    const { importProductsBatch } = await import('@/features/storage/actions/imports');

    const result = await importProductsBatch('test-business', buildProductList(3));

    expect(result).toEqual({ success: true });
  });

  test('imports products when exactly at the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxProducts: 10,
    });

    // 8 existing active products + 2 incoming = 10 = maxProducts → NOT over limit
    mockSelectWhere.mockResolvedValue([{ count: 8 }]);
    mockInsertReturning.mockResolvedValue([{ id: 'prod-1' }, { id: 'prod-2' }]);

    const { importProductsBatch } = await import('@/features/storage/actions/imports');

    const result = await importProductsBatch('test-business', buildProductList(2));

    expect(result).toEqual({ success: true });
  });

  test('rejects import when it would exceed the plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxProducts: 10,
    });

    // 9 existing active products + 2 incoming = 11 > 10
    mockSelectWhere.mockResolvedValue([{ count: 9 }]);

    const { importProductsBatch } = await import('@/features/storage/actions/imports');

    const result = await importProductsBatch('test-business', buildProductList(2));

    expect(result).toEqual({
      success: false,
      error:
        'No puedes importar 2 producto(s). Tu plan actual permite hasta 10 productos activos y ya tienes 9. Reduce la cantidad a importar o mejora tu plan.',
    });

    // Should NOT have proceeded with categories or insert
    expect(mockQueryProductCategoriesFindMany).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('skips limit check when plan has unlimited products', async () => {
    // maxProducts: -1 by default — no check needed
    mockInsertReturning.mockResolvedValue([{ id: 'prod-1' }]);

    const { importProductsBatch } = await import('@/features/storage/actions/imports');

    const result = await importProductsBatch('test-business', buildProductList(50));

    expect(result).toEqual({ success: true });

    // Should NOT have checked product count
    expect(mockSelectWhere).not.toHaveBeenCalled();
  });

  test('handles empty import list trivially', async () => {
    const { importProductsBatch } = await import('@/features/storage/actions/imports');

    const result = await importProductsBatch('test-business', []);

    expect(result).toEqual({ success: true });

    // No categories query needed (no unique category names from empty list)
    expect(mockQueryProductCategoriesFindMany).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockSelectWhere).not.toHaveBeenCalled();
  });
});
