// =====================================================
// Webhook order.status.changed — Unit tests
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    update: mockUpdate,
  },
}));

// ── Helpers ──────────────────────────────────────────

let eventCounter = 0;

function createOrderStatusEvent(overrides: Record<string, unknown> = {}) {
  eventCounter += 1;
  const { data: dataOverrides, ...topLevelOverrides } = overrides;
  return {
    id: `test-event-${eventCounter}`,
    type: 'order.status.changed',
    data: {
      id: 'ord_culqi_abc123',
      status: 'paid',
      ...((dataOverrides as Record<string, unknown>) || {}),
    },
    ...topLevelOverrides,
  };
}

function createWebhookRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/webhooks/culqi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Culqi: 'ignored' },
    body: JSON.stringify(body),
  });
}

// ── Suite ────────────────────────────────────────────

describe('POST /api/webhooks/culqi — order.status.changed', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock db.update().set().where() chain
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });

    // Default: update succeeds
    mockWhere.mockResolvedValue({ rowCount: 1 });

    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CULQI_WEBHOOK_SECRET', '');
  });

  // ============================================================
  // RED: Order paid → payment_orders updated to 'paid'
  // ============================================================

  test('updates payment_orders to paid when paid status received', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(createWebhookRequest(createOrderStatusEvent()));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    // Verify the update call was made with the correct status
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  });

  // ============================================================
  // RED: Order expired → payment_orders updated to 'expired'
  // ============================================================

  test('updates payment_orders to expired when expired status received', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest(
        createOrderStatusEvent({
          data: { status: 'expired' },
        }),
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'expired' }));
  });

  // ============================================================
  // RED: Order cancelled → payment_orders updated to 'cancelled'
  // ============================================================

  test('updates payment_orders to cancelled when cancelled status received', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest(
        createOrderStatusEvent({
          data: { status: 'cancelled' },
        }),
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });

  // ============================================================
  // RED: Unknown culqiOrderId → logs warning, returns received
  // ============================================================

  test('logs warning and returns received when culqiOrderId not found in DB', async () => {
    // Simulate no matching row in payment_orders
    mockWhere.mockResolvedValue({ rowCount: 0 });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest(
        createOrderStatusEvent({
          data: { id: 'ord_unknown_999', status: 'paid' },
        }),
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    // Must log a warning about order not found
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Order not found'));

    warnSpy.mockRestore();
  });

  // ============================================================
  // RED: Missing status → no crash, logs warning
  // ============================================================

  test('warns and continues when status is missing in payload', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest({
        id: 'test-event-missing-status',
        type: 'order.status.changed',
        data: { id: 'ord_culqi_xyz' }, // no status field
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    // Must log a warning about missing status
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing order'));

    // Must NOT attempt DB update since status is unknown
    expect(mockSet).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // ============================================================
  // RED: Unknown status string → warns, no crash
  // ============================================================

  test('warns and continues when unknown status string received', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest(
        createOrderStatusEvent({
          data: { status: 'unknown_status_value' },
        }),
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    // Must log a warning about unknown status
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown order status'));

    // Must NOT attempt DB update
    expect(mockSet).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // ============================================================
  // GREEN: refund.creation.succeeded → payments AND plan_payments refunded
  // ============================================================

  test('marks payments and plan_payments as refunded on refund.creation.succeeded', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest({
        id: 'test-event-refund-success',
        type: 'refund.creation.succeeded',
        data: {
          id: 'ref_culqi_abc123',
          charge_id: 'chr_charge_xyz',
          amount: 5900,
          reason: 'solicitud_comprador',
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    // applyRefundStatus updates BOTH tables with status 'refunded'
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));
    // Two WHERE lookups happen (payments + plan_payments); the exact SQL object
    // from drizzle eq() is opaque, but both must exist.
    expect(mockWhere).toHaveBeenCalledTimes(2);
  });

  // ============================================================
  // GREEN: legacy alias refund.created → still refunds both tables
  // ============================================================

  test('handles legacy refund.created alias with charge_id lookup', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest({
        id: 'test-event-refund-legacy',
        type: 'refund.created',
        data: {
          id: 'ref_culqi_legacy',
          charge_id: 'chr_charge_legacy',
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));
    expect(mockWhere).toHaveBeenCalledTimes(2);
  });

  // ============================================================
  // GREEN: refund.creation.failed → both tables status failed
  // ============================================================

  test('marks both tables as failed on refund.creation.failed', async () => {
    const { POST } = await import('@/app/api/webhooks/culqi/route');

    const response = await POST(
      createWebhookRequest({
        id: 'test-event-refund-failed',
        type: 'refund.creation.failed',
        data: {
          id: 'ref_culqi_failed',
          charge_id: 'chr_charge_failed',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    expect(mockWhere).toHaveBeenCalledTimes(2);
  });
});
