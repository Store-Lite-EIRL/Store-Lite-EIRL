// =====================================================
// updateProductGuard — Product guard unit tests
// =====================================================

import { FROZEN_FIELD_MESSAGE } from '@/core/orders/paymentGuards';
import { updateProduct } from '@/features/storage/actions/products';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

// Auth
const mockRequireAccess = vi.hoisted(() => vi.fn());
vi.mock('@/features/storage/actions/authz', () => ({
  requireAccess: mockRequireAccess,
}));

// Entitlements
const mockGetEntitlements = vi.hoisted(() => vi.fn());
vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

// Database
const {
  mockQueryProductsFindFirst,
  mockQueryProductCategoriesFindFirst,
  mockQueryProductCategoriesFindMany,
  mockUpdateSet,
  mockUpdateWhere,
  mockDeleteWhere,
  mockInsert,
  mockInsertValues,
  mockInsertReturning,
  mockSelect,
  mockSelectFrom,
  mockSelectWhere,
} = vi.hoisted(() => {
  const mockQueryProductsFindFirst = vi.fn();
  const mockQueryProductCategoriesFindFirst = vi.fn();
  const mockQueryProductCategoriesFindMany = vi.fn();
  const mockUpdateSet = vi.fn();
  const mockUpdateWhere = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockInsert = vi.fn();
  const mockInsertValues = vi.fn();
  const mockInsertReturning = vi.fn();
  const mockSelect = vi.fn();
  const mockSelectFrom = vi.fn();
  const mockSelectWhere = vi.fn();

  return {
    mockQueryProductsFindFirst,
    mockQueryProductCategoriesFindFirst,
    mockQueryProductCategoriesFindMany,
    mockUpdateSet,
    mockUpdateWhere,
    mockDeleteWhere,
    mockInsert,
    mockInsertValues,
    mockInsertReturning,
    mockSelect,
    mockSelectFrom,
    mockSelectWhere,
  };
});

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      products: {
        findFirst: mockQueryProductsFindFirst,
      },
      productCategories: {
        findFirst: mockQueryProductCategoriesFindFirst,
        findMany: mockQueryProductCategoriesFindMany,
      },
    },
    select: mockSelect,
    update: vi.fn(() => ({ set: mockUpdateSet })),
    delete: vi.fn(() => ({ where: mockDeleteWhere })),
    insert: mockInsert,
  },
}));

// Payment guards
const mockHasLockingPayments = vi.hoisted(() => vi.fn());
vi.mock('@/core/orders/paymentGuards', () => ({
  hasLockingPayments: mockHasLockingPayments,
  FROZEN_FIELD_MESSAGE:
    'Este campo está bloqueado porque el negocio/producto tiene pagos registrados.',
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

// Analytics
vi.mock('@/lib/analytics/capture', () => ({
  captureEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/analytics/taxonomy', () => ({
  AnalyticsEvents: { PRODUCT_CREATED: 'product_created' },
}));

vi.mock('@/lib/sentryContext', () => ({
  setSentryContext: vi.fn(),
}));

vi.mock('@/shared/utils/categorySlug', () => ({
  getUniqueCategorySlug: vi.fn(() => 'test-category-slug'),
}));

vi.mock('@/shared/utils/productSlug', () => ({
  getUniqueProductSlug: vi.fn(() => 'test-product-slug'),
}));

// ── Fixtures ─────────────────────────────────────────

const BUSINESS_SLUG = 'mi-negocio';
const BUSINESS_ID = 'biz-123';
const PRODUCT_ID = 'prod-456';

const DEFAULT_AUTH = {
  businessId: BUSINESS_ID,
  userId: 'user-456',
  isOwner: true,
};

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

const DB_PRODUCT = {
  id: PRODUCT_ID,
  stock: 10,
  title: 'Laptop Gamer',
  isAvailable: true,
  price: '2999.99',
  secondPrice: '2499.99',
};

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

// ── Suite ────────────────────────────────────────────

describe('updateProduct — payment lock guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated as owner
    mockRequireAccess.mockResolvedValue(DEFAULT_AUTH);

    // Default: unlimited plan
    mockGetEntitlements.mockResolvedValue(DEFAULT_ENTITLEMENTS);

    // Default: existing product found
    mockQueryProductsFindFirst.mockResolvedValue(DB_PRODUCT);

    // Default: category exists
    mockQueryProductCategoriesFindFirst.mockResolvedValue({ id: 'cat-electronics' });

    // Default: no sibling products (for slug generation)
    mockQueryProductCategoriesFindMany.mockResolvedValue([]);

    // Default: business is unlocked
    mockHasLockingPayments.mockResolvedValue(false);

    // Default: DB update chain
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockResolvedValue(undefined);

    // Default: delete chain (for media)
    mockDeleteWhere.mockResolvedValue(undefined);

    // Default: insert chain (for media)
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
    mockInsertReturning.mockResolvedValue([]);

    // Default: select chain (for plan limit checks)
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectWhere.mockResolvedValue([{ count: 0 }]);
  });

  // ── Unlocked product ────────────────────────────────

  describe('unlocked product', () => {
    test('accepts title change when unlocked', async () => {
      mockHasLockingPayments.mockResolvedValue(false);

      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({ name: 'Nuevo Nombre' }),
      );

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });

    test('accepts price change when unlocked', async () => {
      mockHasLockingPayments.mockResolvedValue(false);

      const result = await updateProduct(BUSINESS_SLUG, PRODUCT_ID, validInput({ price: 1999.99 }));

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });
  });

  // ── Locked product — frozen fields ──────────────────

  describe('locked product — frozen fields', () => {
    beforeEach(() => {
      mockHasLockingPayments.mockResolvedValue(true);
    });

    test('rejects title change when locked', async () => {
      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({ name: 'Nuevo Nombre' }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects price change when locked', async () => {
      const result = await updateProduct(BUSINESS_SLUG, PRODUCT_ID, validInput({ price: 1999.99 }));

      expect(result.success).toBe(false);
      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects secondPrice change when locked', async () => {
      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({ secondPrice: 1499.99 }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects title + price change simultaneously when locked', async () => {
      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({
          name: 'Nuevo Nombre',
          price: 1999.99,
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockUpdateWhere).not.toHaveBeenCalled();
    });
  });

  // ── Locked product — editable fields ────────────────

  describe('locked product — editable fields', () => {
    beforeEach(() => {
      mockHasLockingPayments.mockResolvedValue(true);
    });

    test('accepts stock change when locked', async () => {
      const result = await updateProduct(BUSINESS_SLUG, PRODUCT_ID, validInput({ stock: 50 }));

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });

    test('accepts description change when locked', async () => {
      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({
          description: 'Nueva descripcion',
        }),
      );

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });

    test('accepts availability change when locked', async () => {
      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({ status: 'INACTIVO' }),
      );

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });
  });

  // ── Title unchanged (same as DB) ────────────────────

  describe('title unchanged', () => {
    test('allows update when title matches DB value (locked)', async () => {
      mockHasLockingPayments.mockResolvedValue(true);

      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({
          name: 'Laptop Gamer', // same as DB_PRODUCT.title
          stock: 20,
        }),
      );

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });
  });

  // ── Price unchanged (same as DB) ────────────────────

  describe('price unchanged', () => {
    test('allows update when price matches DB value (locked)', async () => {
      mockHasLockingPayments.mockResolvedValue(true);

      const result = await updateProduct(
        BUSINESS_SLUG,
        PRODUCT_ID,
        validInput({
          price: 2999.99, // same as DB_PRODUCT.price
          stock: 20,
        }),
      );

      expect(result.success).toBe(true);
      expect(mockUpdateWhere).toHaveBeenCalled();
    });
  });
});
