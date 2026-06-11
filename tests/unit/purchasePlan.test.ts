// =====================================================
// POST /api/billing/purchase-plan — Unit tests
// =====================================================
// Verifies that the route handler correctly omits
// ticketCorrelative from insert values so the DB
// default (sequence) fills it automatically.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// Must be before module imports (vi.mock is hoisted)

const mockSaasIssuerFindFirst = vi.fn();
const mockReturning = vi.fn();
const mockOnConflict = vi.fn();
const mockValues = vi.fn(() => ({
  returning: mockReturning,
  onConflictDoUpdate: mockOnConflict,
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));

vi.mock('@/core/database/client', () => ({
  db: {
    insert: mockInsert,
    query: {
      saasIssuerConfig: { findFirst: mockSaasIssuerFindFirst },
    },
  },
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ── Shared helpers ───────────────────────────────────

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    token: 'ype_test_token_123',
    planType: 'business_pro',
    period: 'monthly',
    businessId: 'biz_123',
    buyerEmail: 'test@example.com',
    buyerFullName: 'Test User',
    buyerDocumentType: 'DNI',
    buyerDocumentNumber: '12345678',
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('POST /api/billing/purchase-plan', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock setup — Culqi charge succeeds
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'charge_abc123',
        outcome: { type: 'venta_exitosa', user_message: '', merchant_message: '' },
        reference_code: 'ref_xyz',
      }),
    });

    // Default mock setup — SaaS issuer exists
    mockSaasIssuerFindFirst.mockResolvedValue({
      id: 'issuer_1',
      businessName: 'Store Lite',
      documentType: 'RUC',
      documentNumber: '20123456789',
    });

    // Default mock setup — DB insert returns a payment
    mockReturning.mockResolvedValue([
      {
        id: 'payment_001',
        ticketSeries: 'B001',
        ticketCorrelative: 42,
      },
    ]);

    // Default mock setup — subscription upsert succeeds
    mockOnConflict.mockResolvedValue(undefined);

    vi.stubEnv('CULQI_SK', 'sk_test_culqi_key');
  });

  // ============================================================
  // RED-GREEN CORE: ticketCorrelative must not be passed to DB
  // ============================================================

  test('omits ticketCorrelative from insert values — DB default fills it', async () => {
    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    const body = await response.json();

    // Endpoint returns 200
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // The values passed to the first insert (planPayments)
    // must NOT contain ticketCorrelative — the DB default
    // (nextval of seq_plan_payment_b001) fills it.
    const planPaymentValues = mockValues.mock.calls[0][0];
    expect(planPaymentValues).not.toHaveProperty('ticketCorrelative');
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  test('returns 400 for invalid plan type', async () => {
    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload({ planType: 'nonexistent' })),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 for free plan (basico)', async () => {
    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload({ planType: 'basico' })),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 500 when saas issuer config is missing', async () => {
    mockSaasIssuerFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 when missing required fields', async () => {
    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns ticketNumber computed from returned correlative', async () => {
    mockReturning.mockResolvedValue([
      {
        id: 'payment_001',
        ticketSeries: 'B001',
        ticketCorrelative: 1,
      },
    ]);

    const { POST } = await import('@/app/api/billing/purchase-plan/route');

    const request = new Request('http://localhost/api/billing/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createValidPayload()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('ticketNumber');
    expect(body.ticketNumber).toMatch(/^B001-/);
  });
});
