// =====================================================
// POST /api/payment/charge — Unit tests
// =====================================================
// Verifies that buyer identity (antifraud_details) reaches
// the Culqi charge request body for the token flow.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks (must be before module imports — vi.mock is hoisted) ──

const mockBusinessFindFirst = vi.fn();
const mockBusinessSettingsFindFirst = vi.fn();
const mockPaymentsFindFirst = vi.fn();
const mockProductsFindFirst = vi.fn();

const mockTxReturning = vi.fn();
const mockTxValues = vi.fn(() => ({ returning: mockTxReturning }));
const mockTxInsert = vi.fn(() => ({ values: mockTxValues }));
const mockTxSet = vi.fn(() => ({ where: mockTxWhere }));
const mockTxWhere = vi.fn();
const mockTxUpdate = vi.fn(() => ({ set: mockTxSet }));
const mockTransaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
  callback({
    insert: mockTxInsert,
    update: mockTxUpdate,
  }),
);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'buyer-user-id' } }, error: null }),
    },
  })),
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: { findFirst: mockBusinessFindFirst },
      businessSettings: { findFirst: mockBusinessSettingsFindFirst },
      payments: { findFirst: mockPaymentsFindFirst },
      products: { findFirst: mockProductsFindFirst },
    },
    transaction: mockTransaction,
  },
}));

vi.mock('@/core/entitlements/getBusinessEntitlements', () => ({
  getBusinessEntitlements: vi.fn().mockResolvedValue({ hasPaymentGateway: true }),
}));

vi.mock('@/core/payments/idempotency', () => ({
  reserveIdempotencyKey: vi.fn().mockResolvedValue({ type: 'reserved', key: 'idem-1' }),
  completeIdempotencyKey: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/core/payments/rateLimiter', () => ({
  paymentRateLimiter: { check: vi.fn(() => true) },
}));

const mockDecrypt = vi.fn();
vi.mock('@/utils/crypto', () => ({
  decrypt: mockDecrypt,
}));

vi.mock('@/lib/notifications', () => ({
  notifyNewOrder: vi.fn().mockResolvedValue(undefined),
  notifyLowStock: vi.fn().mockResolvedValue(undefined),
  notifyOutOfStock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/twilio/orderSms', () => ({
  sendOrderStatusSms: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/orderEmails', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/core/utils/trackingToken', () => ({
  generateTrackingToken: vi.fn(() => 'tt_test_token'),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ── Helpers ──────────────────────────────────────────

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    token: 'tok_test_abc123',
    amount: 150000, // S/ 1500.00
    email: 'buyer@test.com',
    businessId: '550e8400-e29b-41d4-a716-446655440000',
    productId: '660e8400-e29b-41d4-a716-446655440001',
    ...overrides,
  };
}

function createCulqiChargeResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ch_abc123',
    outcome: { type: 'venta_exitosa', user_message: '', merchant_message: '' },
    reference_code: 'ref_xyz',
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('POST /api/payment/charge', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: business is active and not blocked
    mockBusinessFindFirst.mockResolvedValue({
      ownerId: 'owner-user-id',
      culqiBlocked: false,
      slug: 'test-slug',
      name: 'Test Store',
    });

    // Default mock: business settings have an encrypted key
    mockBusinessSettingsFindFirst.mockResolvedValue({
      culqiSecretKey: 'encrypted_sk_test_xxx',
    });

    // Default mock: decryption succeeds
    mockDecrypt.mockReturnValue('sk_test_abc123');

    // Default mock: Culqi charge succeeds
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => createCulqiChargeResponse(),
    });

    // Default mock: no existing payment (not a replay)
    mockPaymentsFindFirst.mockResolvedValue(null);

    // Default mock: product has stock above threshold (no low-stock alerts)
    mockProductsFindFirst.mockResolvedValue({
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Test Product',
      stock: 10,
    });

    // Default mock: DB insert succeeds
    mockTxReturning.mockResolvedValue([
      { id: 'pay-1', trackingToken: 'tt_test_token', buyerPhone: '999888777' },
    ]);
    mockTxWhere.mockResolvedValue(undefined);

    vi.stubEnv('NODE_ENV', 'development');
  });

  // ============================================================
  // Buyer identity: antifraud_details reaches the Culqi body
  // ============================================================

  test('sends antifraud_details with split customerName, phone_number and real email', async () => {
    const { POST } = await import('@/app/api/payment/charge/route');

    const request = new Request('http://localhost/api/payment/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        createValidPayload({
          customerName: 'Juan Carlos Perez Gomez',
          metadata: {
            shippingInfo: { phone: '999888777', courier: 'recojo' },
          },
        }),
      ),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const culqiFetchCall = mockFetch.mock.calls[0];
    const culqiBody = JSON.parse(culqiFetchCall[1].body as string);
    expect(culqiBody.antifraud_details).toMatchObject({
      email: 'buyer@test.com',
      phone_number: '999888777',
      first_name: 'Juan',
      last_name: 'Carlos Perez Gomez',
    });
    // The top-level email is the real buyer email, not the fallback
    expect(culqiBody.email).toBe('buyer@test.com');
  });

  test('omits first_name/last_name keys when customerName is missing', async () => {
    const { POST } = await import('@/app/api/payment/charge/route');

    const request = new Request('http://localhost/api/payment/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const culqiFetchCall = mockFetch.mock.calls[0];
    const culqiBody = JSON.parse(culqiFetchCall[1].body as string);
    expect(culqiBody.antifraud_details).not.toHaveProperty('first_name');
    expect(culqiBody.antifraud_details).not.toHaveProperty('last_name');
    expect(culqiBody.antifraud_details).not.toHaveProperty('phone_number');
    expect(culqiBody.antifraud_details).toEqual({ email: 'buyer@test.com' });
  });

  test('uses cliente@culqi.com fallback email only when email is truly absent', async () => {
    const { POST } = await import('@/app/api/payment/charge/route');

    const request = new Request('http://localhost/api/payment/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload({ email: '' })),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const culqiFetchCall = mockFetch.mock.calls[0];
    const culqiBody = JSON.parse(culqiFetchCall[1].body as string);
    expect(culqiBody.email).toBe('cliente@culqi.com');
    // antifraud_details.email must NOT be set from the fallback
    expect(culqiBody.antifraud_details).not.toHaveProperty('email');
  });
});
