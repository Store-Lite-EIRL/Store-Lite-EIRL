// =====================================================
// createProduct — Server Action unit tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

// Auth
const mockRequireAccess = vi.fn();

vi.mock('@/features/storage/actions/authz', () => ({
  requireAccess: mockRequireAccess,
}));

// Entitlements
const mockGetEntitlements = vi.fn();

vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

// Database
const mockQueryProductCategoriesFindFirst = vi.fn();
const mockQueryProductCategoriesFindMany = vi.fn();
const mockQueryProductsFindMany = vi.fn();
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
        findFirst: mockQueryProductCategoriesFindFirst,
        findMany: mockQueryProductCategoriesFindMany,
      },
      products: {
        findMany: mockQueryProductsFindMany,
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
    images: ['https://example.com/img1.jpg'],
    brand: 'TechBrand',
    tags: ['gaming', 'laptop'],
    shippingInfo: 'Envío a todo el país',
    secondPrice: 2499.99,
    saleStatus: 'NORMAL' as const,
    seoTitle: 'Laptop Gamer - TechBrand',
    seoDescription: 'La mejor laptop para gaming',
    metadata: { color: 'negro' },
    ...overrides,
  };
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

const DEFAULT_AUTH = {
  businessId: 'biz-123',
  userId: 'user-456',
  isOwner: true,
};

// ── Suite ────────────────────────────────────────────

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSelectChains();
    setupInsertChains();

    // Default: authenticated as owner
    mockRequireAccess.mockResolvedValue(DEFAULT_AUTH);

    // Default: unlimited plan
    mockGetEntitlements.mockResolvedValue(DEFAULT_ENTITLEMENTS);

    // Default: category already exists
    mockQueryProductCategoriesFindFirst.mockResolvedValue({ id: 'cat-electronics' });

    // Default: no sibling products
    mockQueryProductsFindMany.mockResolvedValue([]);

    // Default: product insert succeeds
    mockInsertReturning.mockResolvedValue([{ id: 'prod-new-1' }]);
  });

  // ============================================================
  // SUCCESS CASES
  // ============================================================

  test('creates product with existing category', async () => {
    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: true,
      productId: 'prod-new-1',
      error: null,
    });

    // Should have checked access with products.create permission
    expect(mockRequireAccess).toHaveBeenCalledWith('test-business', 'products.create');

    // Should NOT have checked product count (maxProducts === -1)
    expect(mockSelectWhere).not.toHaveBeenCalled();
  });

  test('creates product with new category when category does not exist', async () => {
    // No existing category found
    mockQueryProductCategoriesFindFirst.mockResolvedValue(undefined);
    mockQueryProductCategoriesFindMany.mockResolvedValue([]);

    mockInsertReturning
      .mockResolvedValueOnce([{ id: 'cat-new-1' }]) // category insert
      .mockResolvedValueOnce([{ id: 'prod-new-1' }]); // product insert

    const { createProduct } = await import('@/features/storage/actions/products');

    // Use input without images to keep it simple (category + product = 2 inserts)
    const result = await createProduct('test-business', validInput({ images: [] }));

    expect(result).toEqual({
      success: true,
      productId: 'prod-new-1',
      error: null,
    });

    // Verify category was inserted (category + product = 2 inserts)
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  test('creates product without category', async () => {
    const input = validInput({ category: '' });

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', input);

    expect(result).toEqual({
      success: true,
      productId: 'prod-new-1',
      error: null,
    });

    // Should NOT have queried categories (empty category)
    expect(mockQueryProductCategoriesFindFirst).not.toHaveBeenCalled();
  });

  test('inserts product media when images are provided', async () => {
    const input = validInput({
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    // Verify media was inserted with correct order
    expect(mockInsert).toHaveBeenCalledTimes(2); // product, media (no new category)
    // The 2nd call (media insert) should have values with 2 entries
    const valuesCall = mockInsertValues.mock.calls.find(
      ([vals]: [unknown]) => Array.isArray(vals) && vals.length === 2,
    );
    expect(valuesCall).toBeDefined();
  });

  test('does NOT insert media when no images provided', async () => {
    const input = validInput({ images: [] });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    // Only product insert, no media insert (category already exists)
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // AUTH FAILURES
  // ============================================================

  test('returns error when unauthenticated (requireAccess throws)', async () => {
    mockRequireAccess.mockRejectedValue(new Error('No autorizado'));

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error: 'No autorizado',
    });
  });

  test('returns error when user lacks permission (requireAccess throws)', async () => {
    mockRequireAccess.mockRejectedValue(new Error('No tienes permiso para realizar esta acción'));

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error: 'No tienes permiso para realizar esta acción',
    });
  });

  // ============================================================
  // PLAN LIMITS
  // ============================================================

  test('returns error when product count exceeds plan limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxProducts: 10,
    });

    // Current count is already at the limit
    mockSelectWhere.mockResolvedValue([{ count: 10 }]);

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error: 'Has alcanzado el límite de productos de tu plan (10).',
    });

    // Should NOT proceed with insert
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('allows product creation when under the limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxProducts: 10,
    });

    // Current count is under the limit
    mockSelectWhere.mockResolvedValue([{ count: 5 }]);

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: true,
      productId: 'prod-new-1',
      error: null,
    });
  });

  test('returns error when new category would exceed category limit', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      maxCategories: 5,
    });

    // Category does not exist
    mockQueryProductCategoriesFindFirst.mockResolvedValue(undefined);

    // Category count is at the limit (maxProducts: -1, so no product count check)
    mockSelectWhere.mockResolvedValue([{ count: 5 }]);

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error:
        'Has alcanzado el límite de categorías de tu plan (5). No pudimos crear la categoría "Electrónicos".',
    });

    // Should NOT proceed with inserts
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // ============================================================
  // STOCK NOTIFICATIONS
  // ============================================================

  test('triggers notifyOutOfStock when stock is 0', async () => {
    const { notifyOutOfStock } = await import('@/lib/notifications');
    const input = validInput({ stock: 0 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(notifyOutOfStock).toHaveBeenCalledWith('biz-123', {
      productId: 'prod-new-1',
      productName: 'Laptop Gamer',
    });

    // Low stock should NOT be called
    const { notifyLowStock } = await import('@/lib/notifications');
    expect(notifyLowStock).not.toHaveBeenCalled();
  });

  test('triggers notifyLowStock when stock is below threshold', async () => {
    const { notifyLowStock } = await import('@/lib/notifications');
    const input = validInput({ stock: 3 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(notifyLowStock).toHaveBeenCalledWith('biz-123', {
      productId: 'prod-new-1',
      productName: 'Laptop Gamer',
      currentStock: 3,
      minStock: 5,
    });
  });

  test('does NOT trigger any notification when stock is sufficient', async () => {
    const { notifyLowStock, notifyOutOfStock } = await import('@/lib/notifications');
    const input = validInput({ stock: 20 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(notifyLowStock).not.toHaveBeenCalled();
    expect(notifyOutOfStock).not.toHaveBeenCalled();
  });

  // ============================================================
  // INPUT NORMALIZATION
  // ============================================================

  test('clamps negative price to 0', async () => {
    const input = validInput({ price: -100 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    // Price should be clamped to 0 and stored as "0"
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ price: '0' }));
  });

  test('clamps negative stock to 0', async () => {
    const input = validInput({ stock: -5 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ stock: 0 }));
  });

  test('trims whitespace from name, description, category, and brand', async () => {
    const input = validInput({
      name: '  Laptop Gamer  ',
      description: '  Great laptop  ',
      category: '  Electrónicos  ',
      brand: '  TechBrand  ',
    });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Laptop Gamer',
        description: 'Great laptop',
        brand: 'TechBrand',
      }),
    );
  });

  test('handles missing optional fields as null/empty', async () => {
    const input = validInput({
      description: undefined,
      brand: undefined,
      tags: undefined,
      shippingInfo: undefined,
      secondPrice: undefined,
      seoTitle: undefined,
      seoDescription: undefined,
      metadata: undefined,
    });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    // Verify the product insert values use Drizzle defaults:
    // optional chaining fields (brand, shippingInfo, tags) are undefined → Drizzle omits them
    // secondPrice is explicitly set to null because the check passes null for undefined
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
        secondPrice: null,
        seoTitle: null,
        seoDescription: null,
      }),
    );
    // metadata should be {} when undefined
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ metadata: {} }));
  });

  test('converts secondPrice to string when present', async () => {
    const input = validInput({ secondPrice: 1999.99 });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ secondPrice: '1999.99' }),
    );
  });

  test('sets secondPrice to null when explicitly null', async () => {
    const input = validInput({ secondPrice: null });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ secondPrice: null }));
  });

  test('defaults saleStatus to NORMAL when not provided', async () => {
    const input = validInput({ saleStatus: undefined });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ saleStatus: 'NORMAL' }),
    );
  });

  test('converts ACTIVE status to isAvailable true', async () => {
    const input = validInput({ status: 'ACTIVO' });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: true }));
  });

  test('converts non-ACTIVE status to isAvailable false', async () => {
    const input = validInput({ status: 'INACTIVO' });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: false }));
  });

  test('handles empty tags array', async () => {
    const input = validInput({ tags: [] });

    const { createProduct } = await import('@/features/storage/actions/products');

    await createProduct('test-business', input);

    // Empty tags after filter(Boolean) result in [] which is passed to Drizzle
    // First mockInsertValues call is always the product insert
    const productValues = mockInsertValues.mock.calls[0] as unknown as Record<string, unknown>[];
    const vals = productValues[0] as Record<string, unknown>;
    expect(vals).toHaveProperty('tags');
    expect(Array.isArray(vals.tags)).toBe(true);
    expect((vals.tags as unknown[]).length).toBe(0);
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  test('returns generic error message for non-Error throws', async () => {
    mockRequireAccess.mockRejectedValue('Some string error');

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error: 'Error al crear producto',
    });
  });

  test('returns original error message when requireAccess throws Error', async () => {
    mockRequireAccess.mockRejectedValue(new Error('Negocio no encontrado'));

    const { createProduct } = await import('@/features/storage/actions/products');

    const result = await createProduct('test-business', validInput());

    expect(result).toEqual({
      success: false,
      productId: null,
      error: 'Negocio no encontrado',
    });
  });
});
