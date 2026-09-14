// =====================================================
// businessDataGuard — Zod + identity guard unit tests
// =====================================================

import { updateBusinessSlug } from '@/app/[slug]/(app)/settings/actions';
import { updateBusinessData } from '@/app/actions/business';
import { FROZEN_FIELD_MESSAGE } from '@/core/orders/paymentGuards';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

// Auth: mock createServerClient so getUser returns a valid user
const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({})),
}));

// Env
vi.mock('@/config/env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceRoleKey: 'test-service-key',
  },
}));

// Database — shared mock for both action files
const {
  mockDbQueryBusinessesFindFirst,
  mockDbQueryBusinessSettingsFindFirst,
  mockDbUpdateSet,
  mockDbUpdateWhere,
  mockDbInsert,
  mockDbInsertValues,
  mockDbInsertOnConflictDoNothing,
  mockDbDeleteWhere,
  mockDbTransaction,
} = vi.hoisted(() => {
  const mockDbQueryBusinessesFindFirst = vi.fn();
  const mockDbQueryBusinessSettingsFindFirst = vi.fn();
  const mockDbUpdateSet = vi.fn();
  const mockDbUpdateWhere = vi.fn();
  const mockDbInsert = vi.fn();
  const mockDbInsertValues = vi.fn();
  const mockDbInsertOnConflictDoNothing = vi.fn();
  const mockDbDeleteWhere = vi.fn();
  const mockDbTransaction = vi.fn();

  return {
    mockDbQueryBusinessesFindFirst,
    mockDbQueryBusinessSettingsFindFirst,
    mockDbUpdateSet,
    mockDbUpdateWhere,
    mockDbInsert,
    mockDbInsertValues,
    mockDbInsertOnConflictDoNothing,
    mockDbDeleteWhere,
    mockDbTransaction,
  };
});

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: {
        findFirst: mockDbQueryBusinessesFindFirst,
      },
      businessSettings: {
        findFirst: mockDbQueryBusinessSettingsFindFirst,
      },
    },
    update: vi.fn(() => ({ set: mockDbUpdateSet })),
    insert: mockDbInsert,
    delete: vi.fn(() => ({ where: mockDbDeleteWhere })),
    transaction: mockDbTransaction,
  },
}));

// Payment guards (mocked to control lock state)
const mockHasLockingPayments = vi.hoisted(() => vi.fn());
vi.mock('@/core/orders/paymentGuards', () => ({
  hasLockingPayments: mockHasLockingPayments,
  FROZEN_FIELD_MESSAGE:
    'Este campo está bloqueado porque el negocio/producto tiene pagos registrados.',
}));

// Settings actions dependencies
const mockRequireAccessOnId = vi.hoisted(() => vi.fn());
vi.mock('@/features/storage/actions/authz', () => ({
  requireAccessOnId: mockRequireAccessOnId,
}));

const mockGetEntitlements = vi.hoisted(() => vi.fn());
vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

vi.mock('@/core/business/slug', () => ({
  isBusinessSlugTaken: vi.fn(async () => false),
}));

vi.mock('@/lib/posthogServer', () => ({
  getPostHogClient: vi.fn(() => ({
    capture: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Storefront helpers (needed by settings actions)
vi.mock('@/core/storefront', () => ({
  normalizeStorefrontLayout: vi.fn((l: unknown) => l),
  normalizeStorefrontTheme: vi.fn((t: unknown) => t),
  mergeStorefrontLayoutIntoPreferences: vi.fn((prefs: unknown, layout: unknown) => ({
    ...(prefs as object),
    layout,
  })),
  mergeStorefrontThemeIntoPreferences: vi.fn((prefs: unknown, theme: unknown) => ({
    ...(prefs as object),
    theme,
  })),
  clearStorefrontThemeFromPreferences: vi.fn((prefs: unknown) => prefs),
  createDefaultStorefrontLayout: vi.fn(() => ({ type: 'default' })),
  createDefaultStorefrontTheme: vi.fn(() => ({ colors: { primary: '#000' } })),
}));

vi.mock('@/utils/crypto', () => ({
  encrypt: vi.fn((s: string) => `encrypted:${s}`),
}));

// Cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ── Fixtures ─────────────────────────────────────────

const BUSINESS_ID = 'biz-test-123';
const USER_ID = 'user-123';
const SLUG = 'mi-negocio';

const DB_BUSINESS = {
  id: BUSINESS_ID,
  ownerId: USER_ID,
  name: 'Mi Negocio',
  taxId: '20601234567',
  legalRepName: 'Juan Perez',
  legalRepRole: 'Gerente',
  legalRepPhone: '+51987654321',
  legalRepEmail: 'juan@example.com',
  address: 'Av. Principal 123',
  city: 'Lima',
  description: 'Tienda de prueba',
  storeType: 'tienda',
  whatsappNumber: '+51987654321',
  email: 'negocio@example.com',
};

const PREMIUM_ENTITLEMENTS = {
  plan: 'business_pro' as const,
  isActive: true,
  hasPaymentGateway: true,
  isPaymentConfigured: true,
  maxProducts: 300,
  maxCategories: 7,
  canImportProducts: true,
  canCustomizeStorefront: true,
  chatEnabled: true,
  dashboardEnabled: true,
  seoEnabled: true,
  canUseAIAssistant: true,
  maxTeamMembers: 2,
  culqiPublicKey: 'pk_test_123',
  planEndDate: null as string | null,
};

// ── Suite ────────────────────────────────────────────

describe('updateBusinessData — zod + identity guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });

    // Default: ownership check passes (returns full identity fields)
    mockDbQueryBusinessesFindFirst.mockResolvedValue(DB_BUSINESS);

    // Default: business is unlocked
    mockHasLockingPayments.mockResolvedValue(false);

    // Default: DB update chain — update().set().where()
    mockDbUpdateSet.mockReturnValue({ where: mockDbUpdateWhere });
    mockDbUpdateWhere.mockResolvedValue(undefined);
  });

  // ── Zod validation ──────────────────────────────────

  describe('zod validation', () => {
    test('rejects malformed taxId and performs no DB write', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        taxId: 'invalid',
      });

      expect(result.error).toBeDefined();
      // DB update should NOT have been called
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('accepts valid payload with all fields', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        name: 'Nuevo Nombre',
        taxId: '20609876543',
        address: 'Av. Secundaria 456',
        city: 'Cusco',
        email: 'nuevo@example.com',
        description: 'Tienda actualizada',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });

    test('accepts empty payload (no fields changed)', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {});

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });
  });

  // ── Identity guard ──────────────────────────────────

  describe('identity guard — unlocked', () => {
    test('accepts identity field changes when unlocked', async () => {
      mockHasLockingPayments.mockResolvedValue(false);

      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        name: 'Nuevo Nombre',
        taxId: '20609876543',
        legalRepName: 'Nuevo Rep',
        address: 'Nueva Direccion 789',
        city: 'Arequipa',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });
  });

  // ── Identity guard — locked ─────────────────────────

  describe('identity guard — locked', () => {
    beforeEach(() => {
      mockHasLockingPayments.mockResolvedValue(true);
    });

    test('rejects name change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        name: 'Nuevo Nombre',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects taxId change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        taxId: '20609876543',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects legalRepName change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        legalRepName: 'Otro Rep',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects legalRepRole change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        legalRepRole: 'Director',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects legalRepPhone change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        legalRepPhone: '+51911222333',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects legalRepEmail change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        legalRepEmail: 'otro@example.com',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects address change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        address: 'Nueva Direccion 789',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects city change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        city: 'Trujillo',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });

    test('rejects multiple identity changes when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        name: 'Nuevo Nombre',
        taxId: '20609876543',
        city: 'Trujillo',
      });

      expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
      expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });
  });

  // ── Cosmetic guard — locked ─────────────────────────

  describe('cosmetic fields — locked', () => {
    beforeEach(() => {
      mockHasLockingPayments.mockResolvedValue(true);
    });

    test('accepts description change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        description: 'Nueva descripcion del negocio',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });

    test('accepts storeType change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        storeType: 'restaurante',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });

    test('accepts whatsappNumber change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        whatsappNumber: '987654321',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });

    test('accepts email change when locked', async () => {
      const result = await updateBusinessData(BUSINESS_ID, SLUG, {
        email: 'nuevo-contacto@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockDbUpdateWhere).toHaveBeenCalled();
    });
  });
});

// =====================================================
// updateBusinessSlug — payment lock guard tests
// =====================================================

describe('updateBusinessSlug — payment lock guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated as owner
    mockRequireAccessOnId.mockResolvedValue({
      businessId: BUSINESS_ID,
      userId: USER_ID,
      isOwner: true,
    });

    // Default: premium plan (passes plan gate)
    mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);

    // Default: business exists with old slug
    mockDbQueryBusinessesFindFirst.mockResolvedValue({
      id: BUSINESS_ID,
      slug: 'old-slug-valid',
    });

    // Default: business is unlocked
    mockHasLockingPayments.mockResolvedValue(false);

    // Default: slug not taken (mocked via vi.mock above)

    // Default: DB transaction succeeds
    mockDbTransaction.mockImplementation(
      async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await cb(tx);
      },
    );
  });

  test('allows slug change when unlocked', async () => {
    mockHasLockingPayments.mockResolvedValue(false);

    const result = await updateBusinessSlug(BUSINESS_ID, 'new-slug-valid-123');

    // Should not return a lock error
    expect(result.error).not.toBe(FROZEN_FIELD_MESSAGE);
  });

  test('rejects slug change when locked', async () => {
    mockHasLockingPayments.mockResolvedValue(true);

    const result = await updateBusinessSlug(BUSINESS_ID, 'new-slug-valid-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe(FROZEN_FIELD_MESSAGE);
  });
});
