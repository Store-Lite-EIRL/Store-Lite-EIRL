// =====================================================
// useProductItemController — Discount computation
// =====================================================
//
// This test verifies that the controller correctly
// computes discount values from secondPrice.
// Expected: PASS (the controller already works)

import { renderHook } from '@testing-library/react';
import { createContext, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// The hook has a deep import chain that eventually hits
// DB client, so we mock all server-action modules.

const mockStorageValue = {
  product: null,
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  setProduct: vi.fn(),
  saveProduct: vi.fn(),
  refreshProducts: vi.fn(),
  isLoading: false,
  error: null,
};

const mockCartValue = {
  isProductInCart: false,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  cart: [],
  cartCount: 0,
  cartTotal: 0,
};

// ── Mocks ────────────────────────────────────────────
// The hook has a deep import chain that eventually hits
// DB client, so we mock all server-action modules.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ slug: 'test-business' }),
  usePathname: () => '/test-business',
}));

vi.mock('@/app/actions/business', () => ({
  updateBusinessData: vi.fn(),
}));

vi.mock('@/features/storage/isolatedUpdateAction', () => ({
  updateProductIsolated: vi.fn(),
}));

vi.mock('@/features/storage/actions/products', () => ({
  toggleProductStatus: vi.fn(),
}));

vi.mock('@/features/storage/actions/categories', () => ({
  getCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/storage/actions/authz', () => ({
  requireAccess: vi
    .fn()
    .mockResolvedValue({ businessId: 'biz-test-1', userId: 'user-test-1', isOwner: true }),
}));

vi.mock('@/core/database/client', () => ({
  db: {},
}));

vi.mock('@app/[slug]/(app)/actions', () => ({
  getBusinessPath: vi.fn((slug: string, path: string) => `/${slug}${path}`),
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@app/[slug]/(app)/context/BusinessEntitlementsContext', () => ({
  useBusinessEntitlements: () => ({
    culqiPublicKey: null,
  }),
}));

vi.mock('@app/[slug]/(app)/context/PermissionsContext', () => ({
  usePermissions: () => ({}),
}));

// Mock StorageContext — must export StorageContext (React Context) and useStorage
vi.mock('@/features/storage/context/StorageContext', () => ({
  StorageContext: createContext(mockStorageValue),
  useStorage: () => mockStorageValue,
  StorageProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock CartContext — must export CartContext (React Context) and useCart
vi.mock('@/features/storage/context/CartContext', () => ({
  CartContext: createContext(mockCartValue),
  useCart: () => mockCartValue,
  CartProvider: ({ children }: { children: ReactNode }) => children,
}));

// ── Helpers ──────────────────────────────────────────

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-test-1',
    businessId: 'biz-test-1',
    title: 'Laptop Gamer X',
    description: 'Una laptop potente',
    price: '100.00',
    secondPrice: null,
    stock: 10,
    currency: 'PEN',
    isAvailable: true,
    tags: ['gaming'],
    saleStatus: 'NORMAL' as const,
    stars: 0,
    category: null,
    media: [],
    metadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('useProductItemController — discount computation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('sets price to secondPrice and originalPrice to price when secondPrice exists', async () => {
    const { useProductItemController } =
      await import('@/features/products/hooks/useProductItemController');

    const product = buildProduct({ price: '100.00', secondPrice: '80.00' });
    const { result } = renderHook(() => useProductItemController(product, false, false, vi.fn()));

    expect(result.current.price).toBe(80);
    expect(result.current.originalPrice).toBe(100);
    expect(result.current.discount).toBe(20);
  });

  test('uses price as current when secondPrice is null', async () => {
    const { useProductItemController } =
      await import('@/features/products/hooks/useProductItemController');

    const product = buildProduct({ price: '100.00', secondPrice: null });
    const { result } = renderHook(() => useProductItemController(product, false, false, vi.fn()));

    expect(result.current.price).toBe(100);
    expect(result.current.originalPrice).toBeNull();
    expect(result.current.discount).toBeNull();
  });

  test('uses price as current when secondPrice is undefined', async () => {
    const { useProductItemController } =
      await import('@/features/products/hooks/useProductItemController');

    const product = buildProduct({ price: '100.00', secondPrice: undefined });
    const { result } = renderHook(() => useProductItemController(product, false, false, vi.fn()));

    expect(result.current.price).toBe(100);
    expect(result.current.originalPrice).toBeNull();
    expect(result.current.discount).toBeNull();
  });

  test('computes 25% discount correctly', async () => {
    const { useProductItemController } =
      await import('@/features/products/hooks/useProductItemController');

    const product = buildProduct({ price: '200.00', secondPrice: '150.00' });
    const { result } = renderHook(() => useProductItemController(product, false, false, vi.fn()));

    expect(result.current.price).toBe(150);
    expect(result.current.originalPrice).toBe(200);
    expect(result.current.discount).toBe(25);
  });

  test('does not compute discount when secondPrice equals price', async () => {
    const { useProductItemController } =
      await import('@/features/products/hooks/useProductItemController');

    const product = buildProduct({ price: '100.00', secondPrice: '100.00' });
    const { result } = renderHook(() => useProductItemController(product, false, false, vi.fn()));

    expect(result.current.price).toBe(100);
    expect(result.current.originalPrice).toBe(100);
    expect(result.current.discount).toBeNull();
  });
});
