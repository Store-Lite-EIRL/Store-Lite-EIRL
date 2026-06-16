// =====================================================
// processPayment — Server Action unit tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

// Business slug resolution
const mockResolveBusinessSlug = vi.fn();

vi.mock('@/core/business/slug', () => ({
  resolveBusinessSlug: mockResolveBusinessSlug,
}));

// Entitlements
const mockGetEntitlements = vi.fn();

vi.mock('@/core/entitlements/getBusinessEntitlements', () => ({
  getBusinessEntitlements: mockGetEntitlements,
}));

// Supabase (imported at module level but unused by processPayment)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Database
const mockQueryProductsFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      products: {
        findFirst: mockQueryProductsFindFirst,
      },
    },
    update: mockUpdate,
    insert: mockInsert,
  },
}));

// Tracking token
const mockGenerateTrackingToken = vi.fn();

vi.mock('@/core/utils/trackingToken', () => ({
  generateTrackingToken: mockGenerateTrackingToken,
}));

// Cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Global fetch for Culqi API
const mockFetch = vi.fn();

// ── Chain helpers ────────────────────────────────────

function setupUpdateChains() {
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
}

function setupInsertChains() {
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
}

// ── Helpers ──────────────────────────────────────────

const VALID_INPUT = {
  tokenId: 'tok_test_abc123',
  productId: 'prod-1',
  businessSlug: 'test-business',
  paymentMethod: 'card' as const,
  buyerEmail: 'buyer@example.com',
  buyerPhone: '999888777',
  buyerDni: '12345678',
  amountSoles: 50,
};

const DEFAULT_PRODUCT = {
  id: 'prod-1',
  title: 'Test Product',
  price: '50.00',
  stock: 10,
  currency: 'PEN',
};

const DEFAULT_BUSINESS = {
  id: 'biz-1',
  ownerId: 'user-owner',
  slug: 'test-business',
  isActive: true,
  name: 'Test Business',
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

function successfulCulqiResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      id: 'charge_culqi_abc123',
      object: 'charge',
      reference_code: 'REF001',
      outcome: { type: 'authorized' },
      ...overrides,
    }),
  };
}

// ── Suite ────────────────────────────────────────────

describe('processPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CULQI_SK', 'sk_test_abc123');
    vi.stubEnv('NODE_ENV', 'development');

    globalThis.fetch = mockFetch;
    setupUpdateChains();
    setupInsertChains();

    // Default: business found and active
    mockResolveBusinessSlug.mockResolvedValue({
      business: { ...DEFAULT_BUSINESS },
      canonicalSlug: 'test-business',
      requestedSlug: 'test-business',
      matchedAlias: false,
    });

    // Default: entitlements with payment gateway
    mockGetEntitlements.mockResolvedValue(DEFAULT_ENTITLEMENTS);

    // Default: product found with valid price
    mockQueryProductsFindFirst.mockResolvedValue({ ...DEFAULT_PRODUCT });

    // Default: stock reservation succeeds
    mockUpdateReturning.mockResolvedValue([{ id: 'prod-1' }]);

    // Default: Culqi API succeeds
    mockFetch.mockResolvedValue(successfulCulqiResponse());

    // Default: tracking token
    mockGenerateTrackingToken.mockReturnValue('TRK8A2X7');

    // Default: payment insert succeeds
    mockInsertReturning.mockResolvedValue([{ id: 'pay-new-1' }]);
  });

  // ============================================================
  // SUCCESS CASES
  // ============================================================

  test('processes payment successfully with card', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: true,
      paymentId: 'pay-new-1',
      deliveryCode: expect.any(String),
      culqiChargeId: 'charge_culqi_abc123',
    });

    // Verify business was resolved
    expect(mockResolveBusinessSlug).toHaveBeenCalledWith('test-business');

    // Verify product stock was decremented
    expect(mockUpdate).toHaveBeenCalled();

    // Verify Culqi API was called with correct data
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.culqi.com/v2/charges',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test_abc123',
        }),
        body: expect.stringContaining('"amount":5000'),
      }),
    );

    // Verify payment record was inserted
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertReturning).toHaveBeenCalled();
  });

  test('processes payment with Yape', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment({
      ...VALID_INPUT,
      paymentMethod: 'yape',
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('pay-new-1');
    expect(result.culqiChargeId).toBe('charge_culqi_abc123');
  });

  test('generates a 5-digit delivery code', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    // randomBytes(5) → 5 digits (each byte mod 10)
    expect(result.deliveryCode).toMatch(/^\d{5}$/);
  });

  test('passes buyer phone and DNI to payment record metadata', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    await processPayment(VALID_INPUT);

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerEmail: 'buyer@example.com',
        buyerPhone: '999888777',
        buyerDni: '12345678',
      }),
    );
  });

  test('uses product price as authoritative amount', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    // Product price is 50.00, but user sends 40.00 (possibly tampered)
    await processPayment({ ...VALID_INPUT, amountSoles: 40 });

    // Culqi should receive the authoritative amount (5000 cents = 50 soles)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"amount":5000'),
      }),
    );
  });

  // ============================================================
  // CONFIGURATION FAILURES
  // ============================================================

  test('returns error when CULQI_SK is not set', async () => {
    vi.stubEnv('CULQI_SK', '');

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Payment gateway not configured (missing CULQI_SK).',
    });
  });

  // ============================================================
  // BUSINESS VERIFICATION FAILURES
  // ============================================================

  test('returns error when business is not found', async () => {
    mockResolveBusinessSlug.mockResolvedValue(null);

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Negocio no encontrado.',
    });
  });

  test('returns error when business is inactive', async () => {
    mockResolveBusinessSlug.mockResolvedValue({
      business: { ...DEFAULT_BUSINESS, isActive: false },
      canonicalSlug: 'test-business',
      requestedSlug: 'test-business',
      matchedAlias: false,
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Este negocio no esta disponible para cobros en este momento.',
    });
  });

  test('returns error when business lacks payment gateway entitlement', async () => {
    mockGetEntitlements.mockResolvedValue({
      ...DEFAULT_ENTITLEMENTS,
      hasPaymentGateway: false,
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'La pasarela de pago no está habilitada para este negocio.',
    });
  });

  // ============================================================
  // PRODUCT VERIFICATION FAILURES
  // ============================================================

  test('returns error when product is not found', async () => {
    mockQueryProductsFindFirst.mockResolvedValue(null);

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Producto no encontrado.',
    });

    // Should NOT attempt stock reservation
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('returns error when product price is zero', async () => {
    mockQueryProductsFindFirst.mockResolvedValue({
      ...DEFAULT_PRODUCT,
      price: '0',
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Monto invalido para el producto seleccionado.',
    });
  });

  test('returns error when product price is negative', async () => {
    mockQueryProductsFindFirst.mockResolvedValue({
      ...DEFAULT_PRODUCT,
      price: '-10',
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Monto invalido para el producto seleccionado.',
    });
  });

  // ============================================================
  // STOCK FAILURES
  // ============================================================

  test('returns error when product is out of stock', async () => {
    // Stock reservation returns empty (no stock available)
    mockUpdateReturning.mockResolvedValue([]);

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'El producto esta agotado.',
    });
  });

  // ============================================================
  // CULQI API FAILURES
  // ============================================================

  test('returns Culqi error message when API returns 4xx', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        object: 'error',
        user_message: 'Tarjeta rechazada',
        merchant_message: 'Card declined',
      }),
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Tarjeta rechazada',
    });
  });

  test('falls back to merchant_message when user_message is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        object: 'error',
        merchant_message: 'Invalid amount',
      }),
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Invalid amount',
    });
  });

  test('returns generic error when Culqi responds with error object but no messages', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'error',
      }),
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'El pago fue rechazado. Verifica tus datos e intenta de nuevo.',
    });
  });

  test('handles network error and restores stock', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Error de conexion al procesar el pago. Intenta de nuevo.',
    });

    // Stock should be restored (+1)
    // First update call: decrement stock, second: restore
    expect(mockUpdateSet).toHaveBeenCalledTimes(2);
  });

  test('handles Culqi JSON parse error and restores stock', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: 'Error inesperado en la pasarela de pago.',
    });

    // Stock should be restored
    expect(mockUpdateSet).toHaveBeenCalledTimes(2);
  });

  // ============================================================
  // DB FAILURE AFTER CULQI SUCCESS (partial failure)
  // ============================================================

  test('returns culqiChargeId when DB insert fails after successful charge', async () => {
    // Culqi succeeded, but DB insert throws
    mockInsertReturning.mockRejectedValue(new Error('DB connection error'));

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result).toEqual({
      success: true,
      culqiChargeId: 'charge_culqi_abc123',
      error:
        'Pago procesado pero hubo un error al crear el registro. Guarda tu ID de cargo: charge_culqi_abc123',
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  test('handles missing optional buyer fields gracefully', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    await processPayment({
      ...VALID_INPUT,
      buyerPhone: undefined,
      buyerDni: undefined,
    });

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerPhone: null,
        buyerDni: null,
      }),
    );
  });

  test('handles missing reference_code in Culqi response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'charge_no_ref',
        object: 'charge',
        outcome: { type: 'authorized' },
        // no reference_code
      }),
    });

    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    const result = await processPayment(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(result.culqiChargeId).toBe('charge_no_ref');
  });

  test('handles special characters in buyer email', async () => {
    const { processPayment } = await import('@/features/payment/actions/paymentActions');

    await processPayment({
      ...VALID_INPUT,
      buyerEmail: 'test+tag@example.com',
    });

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerEmail: 'test+tag@example.com',
      }),
    );
  });
});
