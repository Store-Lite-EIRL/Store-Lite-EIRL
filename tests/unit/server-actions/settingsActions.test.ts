// =====================================================
// settingsActions — Plan enforcement unit tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockRequireAccessOnId = vi.fn();

vi.mock('@/features/storage/actions/authz', () => ({
  requireAccessOnId: mockRequireAccessOnId,
}));

const mockGetEntitlements = vi.fn();

vi.mock('@/core/entitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

// Each action may call these; we mock them minimally
const mockDbQueryBusinessesFindFirst = vi.fn();
const mockDbQueryBusinessSettingsFindFirst = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbUpdateSet = vi.fn();
const mockDbUpdateWhere = vi.fn();
const mockDbTransaction = vi.fn();
const mockDbInsert = vi.fn();
const mockDbInsertValues = vi.fn();
const mockDbInsertOnConflictDoNothing = vi.fn();
const mockDbDelete = vi.fn();
const mockDbDeleteWhere = vi.fn();

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
    update: mockDbUpdate,
    insert: mockDbInsert,
    transaction: mockDbTransaction,
    delete: mockDbDelete,
  },
}));

vi.mock('@/core/business/slug', () => ({
  isBusinessSlugTaken: vi.fn().mockResolvedValue(false),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/posthogServer', () => ({
  getPostHogClient: vi.fn(() => ({
    capture: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Storefront helpers
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

// ── Fixtures ─────────────────────────────────────────

const BUSINESS_ID = 'biz-test-123';

const BASICO_ENTITLEMENTS = {
  plan: 'basico' as const,
  isActive: true,
  hasPaymentGateway: false,
  isPaymentConfigured: false,
  maxProducts: 50,
  maxCategories: 7,
  canImportProducts: false,
  canCustomizeStorefront: false,
  chatEnabled: true,
  dashboardEnabled: false,
  seoEnabled: false,
  canUseAIAssistant: false,
  maxTeamMembers: 1,
  culqiPublicKey: undefined as string | undefined,
  planEndDate: null as string | null,
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

describe('settings actions — plan enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: requireAccessOnId resolves successfully
    mockRequireAccessOnId.mockResolvedValue({
      businessId: BUSINESS_ID,
      userId: 'user-1',
      isOwner: true,
    });

    // Chain update → set → where
    mockDbUpdate.mockReturnValue({ set: mockDbUpdateSet });
    mockDbUpdateSet.mockReturnValue({ where: mockDbUpdateWhere });
    mockDbUpdateWhere.mockResolvedValue(undefined);

    // Chain insert → values → onConflictDoNothing
    mockDbInsert.mockReturnValue({ values: mockDbInsertValues });
    mockDbInsertValues.mockReturnValue({ onConflictDoNothing: mockDbInsertOnConflictDoNothing });
    mockDbInsertOnConflictDoNothing.mockResolvedValue(undefined);

    // Chain delete → where
    mockDbDelete.mockReturnValue({ where: mockDbDeleteWhere });
    mockDbDeleteWhere.mockResolvedValue(undefined);

    // Transaction mock: calls the callback with the transaction object
    mockDbTransaction.mockImplementation(
      async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          insert: mockDbInsert,
          update: mockDbUpdate,
          delete: mockDbDelete,
        };
        return await cb(tx);
      },
    );
  });

  // ============================================================
  // PLAN ENFORCEMENT — basico returns error for all 7 actions
  // ============================================================

  describe('updateBusinessSlug', () => {
    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { updateBusinessSlug } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateBusinessSlug(BUSINESS_ID, 'new-slug-valid');

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes superiores.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
      // Should NOT proceed to DB operations
      expect(mockDbQueryBusinessesFindFirst).not.toHaveBeenCalled();
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessesFindFirst.mockResolvedValue({
        id: BUSINESS_ID,
        slug: 'old-slug',
      });

      const { updateBusinessSlug } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateBusinessSlug(BUSINESS_ID, 'new-slug-valid');

      // Should not return a plan error
      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('toggleBusinessActive', () => {
    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { toggleBusinessActive } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await toggleBusinessActive(BUSINESS_ID, true);

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes superiores.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);

      const { toggleBusinessActive } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await toggleBusinessActive(BUSINESS_ID, true);

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('updateBusinessSEO', () => {
    const seoData = {
      seoTitle: 'Test Title',
      seoDescription: 'Test description',
    };

    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { updateBusinessSEO } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateBusinessSEO(BUSINESS_ID, seoData);

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes superiores.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);

      const { updateBusinessSEO } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateBusinessSEO(BUSINESS_ID, seoData);

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('updateStorefrontLayout', () => {
    const layout = { type: 'grid' };

    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { updateStorefrontLayout } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontLayout(BUSINESS_ID, 'test-slug', layout);

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('returns error when plan is emprendedor', async () => {
      mockGetEntitlements.mockResolvedValue({
        ...BASICO_ENTITLEMENTS,
        plan: 'emprendedor' as const,
        hasPaymentGateway: true,
        seoEnabled: true,
        dashboardEnabled: true,
        canImportProducts: true,
        maxProducts: 150,
        maxTeamMembers: 3,
      });

      const { updateStorefrontLayout } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontLayout(BUSINESS_ID, 'test-slug', layout);

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessSettingsFindFirst.mockResolvedValue(null);

      const { updateStorefrontLayout } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontLayout(BUSINESS_ID, 'test-slug', layout);

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('updateStorefrontTheme', () => {
    const theme = { colors: { primary: '#ff0000' } };

    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { updateStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontTheme(BUSINESS_ID, 'test-slug', theme, 'light');

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('returns error when plan is emprendedor', async () => {
      mockGetEntitlements.mockResolvedValue({
        ...BASICO_ENTITLEMENTS,
        plan: 'emprendedor' as const,
        hasPaymentGateway: true,
        seoEnabled: true,
        dashboardEnabled: true,
        canImportProducts: true,
        maxProducts: 150,
        maxTeamMembers: 3,
      });

      const { updateStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontTheme(BUSINESS_ID, 'test-slug', theme, 'light');

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessSettingsFindFirst.mockResolvedValue(null);

      const { updateStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateStorefrontTheme(BUSINESS_ID, 'test-slug', theme, 'light');

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('clearStorefrontTheme', () => {
    test('returns error when plan is basico', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { clearStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await clearStorefrontTheme(BUSINESS_ID, 'test-slug');

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('returns error when plan is emprendedor', async () => {
      mockGetEntitlements.mockResolvedValue({
        ...BASICO_ENTITLEMENTS,
        plan: 'emprendedor' as const,
        hasPaymentGateway: true,
        seoEnabled: true,
        dashboardEnabled: true,
        canImportProducts: true,
        maxProducts: 150,
        maxTeamMembers: 3,
      });

      const { clearStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await clearStorefrontTheme(BUSINESS_ID, 'test-slug');

      expect(result).toEqual({
        success: false,
        error: 'Funcion disponible solo para planes con personalizacion de storefront.',
      });
    });

    test('proceeds when plan is business_pro', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessSettingsFindFirst.mockResolvedValue(null);

      const { clearStorefrontTheme } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await clearStorefrontTheme(BUSINESS_ID, 'test-slug');

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('updateCulqiCredentials — hasPaymentGateway semantic check', () => {
    const publicKey = 'pk_test_abc123';
    const secretKey = 'sk_test_xyz789';

    test('returns error when plan is basico (hasPaymentGateway=false)', async () => {
      mockGetEntitlements.mockResolvedValue(BASICO_ENTITLEMENTS);

      const { updateCulqiCredentials } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateCulqiCredentials(BUSINESS_ID, publicKey, secretKey);

      expect(result).toEqual({
        success: false,
        error: 'La configuracion de pagos solo esta disponible en planes premium.',
      });

      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });

    test('returns error when plan is emprendedor (hasPaymentGateway=false)', async () => {
      mockGetEntitlements.mockResolvedValue({
        ...BASICO_ENTITLEMENTS,
        plan: 'emprendedor' as const,
        hasPaymentGateway: false,
        seoEnabled: true,
        dashboardEnabled: true,
        canImportProducts: true,
        maxProducts: 150,
        maxTeamMembers: 3,
      });

      const { updateCulqiCredentials } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateCulqiCredentials(BUSINESS_ID, publicKey, secretKey);

      expect(result).toEqual({
        success: false,
        error: 'La configuracion de pagos solo esta disponible en planes premium.',
      });
    });

    test('proceeds when plan is business_pro (hasPaymentGateway=true)', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessSettingsFindFirst.mockResolvedValue({ id: 'settings-1' });

      const { updateCulqiCredentials } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateCulqiCredentials(BUSINESS_ID, publicKey, secretKey);

      expect(result.success).toBe(true);
      expect(mockGetEntitlements).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  // ============================================================
  // NO PLAN PARAM — Actions no longer accept plan argument
  // ============================================================

  describe('calling without plan parameter', () => {
    test('updateBusinessSlug works without plan param', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessesFindFirst.mockResolvedValue({
        id: BUSINESS_ID,
        slug: 'old-slug',
      });

      const { updateBusinessSlug } = await import('@/app/[slug]/(app)/settings/actions');

      // Call with only 2 args (no plan)
      const result = await updateBusinessSlug(BUSINESS_ID, 'new-slug-valid');

      expect(result.success).toBe(true);
    });

    test('toggleBusinessActive works without plan param', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);

      const { toggleBusinessActive } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await toggleBusinessActive(BUSINESS_ID, false);

      expect(result.success).toBe(true);
    });

    test('updateCulqiCredentials works without plan param', async () => {
      mockGetEntitlements.mockResolvedValue(PREMIUM_ENTITLEMENTS);
      mockDbQueryBusinessSettingsFindFirst.mockResolvedValue({ id: 'settings-1' });

      const { updateCulqiCredentials } = await import('@/app/[slug]/(app)/settings/actions');

      const result = await updateCulqiCredentials(BUSINESS_ID, 'pk_test_abc', 'sk_test_xyz');

      expect(result.success).toBe(true);
    });
  });
});
