// =====================================================
// POST /api/payment/create-order — Integration tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockBusinessSettingsFindFirst = vi.fn();
const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockSelectCulqiBlocked = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    insert: mockInsert,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: mockSelectCulqiBlocked,
        })),
      })),
    })),
    query: {
      businessSettings: { findFirst: mockBusinessSettingsFindFirst },
    },
  },
}));

const mockDecrypt = vi.fn();
vi.mock('@/utils/crypto', () => ({
  decrypt: mockDecrypt,
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ── Helpers ──────────────────────────────────────────

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    amount: 5000,
    email: 'buyer@test.com',
    businessId: '550e8400-e29b-41d4-a716-446655440000',
    ...overrides,
  };
}

function createCulqiOrderResponse(overrides: Record<string, unknown> = {}) {
  return {
    object: 'order',
    id: 'ord_culqi_abc123',
    amount: 5000,
    currency_code: 'PEN',
    payment_method: 'pago_efectivo',
    order_number: 'ORD-test1234',
    client_details: { email: 'buyer@test.com' },
    expiration_date: Math.floor(Date.now() / 1000) + 259200,
    status: 'pending',
    cip_code: '1234567890',
    cip_cc_agent: 'BCP',
    cip_cc_user: '12345678',
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('POST /api/payment/create-order', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: culqiBlocked check — business is NOT blocked
    mockSelectCulqiBlocked.mockResolvedValue([{ culqiBlocked: false }]);

    // Default mock: business settings found
    mockBusinessSettingsFindFirst.mockResolvedValue({
      culqiSecretKey: 'encrypted_sk_test_xxx',
    });

    // Default mock: decryption succeeds
    mockDecrypt.mockReturnValue('sk_test_abc123');

    // Default mock: Culqi API succeeds — PagoEfectivo
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => createCulqiOrderResponse(),
    });

    // Default mock: DB insert succeeds
    mockReturning.mockResolvedValue([
      {
        id: 'order-payment-uuid',
        culqiOrderId: 'ord_culqi_abc123',
        status: 'pending',
        paymentCode: null,
        qrUrl: null,
        expirationDate: new Date(Date.now() + 259200000),
      },
    ]);

    vi.stubEnv('NODE_ENV', 'development');
  });

  // ============================================================
  // RED-GREEN: Invalid input returns 400
  // ============================================================

  test('returns 400 for missing businessId', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5000, email: 'buyer@test.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 for invalid email', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload({ email: 'not-an-email' })),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 for amount less than 100', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload({ amount: 50 })),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // ============================================================
  // Business settings errors
  // ============================================================

  test('returns 400 when business has no culqi secret key', async () => {
    mockBusinessSettingsFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/payment/create-order/route');

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 when key environment mismatches (dev with sk_live)', async () => {
    mockDecrypt.mockReturnValue('sk_live_real_key');

    const { POST } = await import('@/app/api/payment/create-order/route');

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // ============================================================
  // Successful order creation
  // ============================================================

  test('returns success with culqiOrderId, paymentCode, qrUrl for PagoEfectivo', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createCulqiOrderResponse({
          id: 'ord_abc123',
          cip_code: '9876543210',
        }),
    });

    mockReturning.mockResolvedValue([
      {
        id: 'order-uuid-1',
        culqiOrderId: 'ord_abc123',
        status: 'pending',
        paymentCode: '9876543210',
        qrUrl: null,
        expirationDate: new Date(Date.now() + 259200000),
      },
    ]);

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.culqiOrderId).toBe('ord_abc123');
    expect(body.paymentCode).toBe('9876543210');
    expect(body.qrUrl).toBeNull();
    expect(body).toHaveProperty('expirationDate');
  });

  test('returns qrUrl for Billetera Móvil', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        createCulqiOrderResponse({
          payment_method: 'billetera_movil',
          cip_code: undefined,
          action: { qr: { image_url: 'https://culqi.com/qr/abc123' } },
        }),
    });

    mockReturning.mockResolvedValue([
      {
        id: 'order-uuid-2',
        culqiOrderId: 'ord_culqi_abc123',
        status: 'pending',
        paymentCode: null,
        qrUrl: 'https://culqi.com/qr/abc123',
        expirationDate: new Date(Date.now() + 259200000),
      },
    ]);

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.qrUrl).toBe('https://culqi.com/qr/abc123');
    expect(body.paymentCode).toBeNull();
  });

  // ============================================================
  // Culqi API failure
  // ============================================================

  test('returns Culqi error and does NOT insert when Culqi API fails', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        user_message: 'Monto inválido',
        merchant_message: 'Invalid amount',
      }),
    });

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('details');

    // MUST NOT persist any row
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('handles Culqi network timeout (AbortError)', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    // Network timeout should return 504
    expect(response.status).toBe(504);

    const body = await response.json();
    expect(body).toHaveProperty('error');

    // MUST NOT persist any row
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('handles generic network error', async () => {
    const { POST } = await import('@/app/api/payment/create-order/route');

    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const request = new Request('http://localhost/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body).toHaveProperty('error');

    // MUST NOT persist any row
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
