import { ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockDb = {
  _selectFrom: vi.fn(),
  _selectWhere: vi.fn(),
  _selectLimit: vi.fn(),
  _updateSet: vi.fn(),
  _updateWhere: vi.fn(),
  _updateReturning: vi.fn(),
  _insertValues: vi.fn(),
  _insertReturning: vi.fn(),
};

vi.mock('@/core/database/client', () => ({
  db: {
    select: vi.fn(() => ({ from: mockDb._selectFrom })),
    update: vi.fn(() => ({ set: mockDb._updateSet })),
    insert: vi.fn(() => ({ values: mockDb._insertValues })),
  },
}));

import { transition } from '@/core/orders/orderService';
import type { TransitionInput } from '@/core/orders/orderStatus';

// ── Helpers ──────────────────────────────────────────

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay_123',
    status: 'paid',
    version: 1,
    amount: '100.00',
    currency: 'PEN',
    productId: 'prod_123',
    businessId: 'biz_123',
    ...overrides,
  };
}

function makeInput(overrides: Partial<TransitionInput> = {}): TransitionInput {
  return {
    paymentId: 'pay_123',
    toStatus: ORDER_STATUS_V2.PREPARING_ORDER,
    actor: { type: 'system' },
    expectedVersion: 1,
    ...overrides,
  } as TransitionInput;
}

// Default mock chain setup
function setupMocks() {
  vi.clearAllMocks();

  // select().from().where().limit(1) → payment
  mockDb._selectFrom.mockReturnValue({ where: mockDb._selectWhere });
  mockDb._selectWhere.mockReturnValue({ limit: mockDb._selectLimit });
  mockDb._selectLimit.mockResolvedValue([makePayment()]);

  // update().set().where().returning() → updated payment
  mockDb._updateSet.mockReturnValue({ where: mockDb._updateWhere });
  mockDb._updateWhere.mockReturnValue({ returning: mockDb._updateReturning });
  mockDb._updateReturning.mockResolvedValue([
    makePayment({ status: ORDER_STATUS_V2.PREPARING_ORDER, version: 2 }),
  ]);

  // insert().values().returning() → event
  mockDb._insertValues.mockReturnValue({ returning: mockDb._insertReturning });
  mockDb._insertReturning.mockResolvedValue([{ id: 'evt_123' }]);
}

// ── Suite ────────────────────────────────────────────

describe('OrderService.transition', () => {
  beforeEach(() => {
    setupMocks();
  });

  test('transitions from legacy status paid → PREPARING_ORDER successfully', async () => {
    const result = await transition(makeInput());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.eventId).toBe('evt_123');
    }
  });

  test('updates status to V2 value and increments version', async () => {
    await transition(makeInput());

    expect(mockDb._updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ORDER_STATUS_V2.PREPARING_ORDER,
        version: 2,
      }),
    );
  });

  test('records a timeline event after successful update', async () => {
    await transition(makeInput());

    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'pay_123',
        eventType: 'ORDER_PREPARING',
        actorType: 'system',
      }),
    );
  });

  test('returns VersionConflictError when version does not match', async () => {
    mockDb._updateReturning.mockResolvedValue([]); // no rows = version mismatch

    const result = await transition(makeInput({ expectedVersion: 2 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('conflict');
    }
  });

  test('returns InvalidTransitionError for invalid transitions', async () => {
    const result = await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.COMPLETED, // can't go from paid → completed
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not allowed');
    }
  });

  test('returns error when payment not found', async () => {
    mockDb._selectLimit.mockResolvedValue([]);

    const result = await transition(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('no encontrado');
    }
  });

  test('generates pickup code when transitioning to IN_TRANSIT', async () => {
    // READY_TO_SHIP is a V2 value that passes through mapToNewStatus as-is
    mockDb._selectLimit.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.READY_TO_SHIP, version: 1 }),
    ]);
    mockDb._updateReturning.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.IN_TRANSIT, version: 2, pickupCode: 'SL-TEST' }),
    ]);

    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.IN_TRANSIT,
        actor: { type: 'seller' },
      }),
    );

    expect(mockDb._updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ORDER_STATUS_V2.IN_TRANSIT,
        version: 2,
        pickupCode: expect.stringMatching(/^SL-/),
      }),
    );
  });

  test('sets courier/tracking fields when transitioning to WAITING_CUSTOMER_CONFIRMATION', async () => {
    // 'aceptado' maps to PREPARING_ORDER → WAITING_CUSTOMER_CONFIRMATION is valid for seller
    mockDb._selectLimit.mockResolvedValue([makePayment({ status: 'aceptado', version: 1 })]);

    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
        actor: { type: 'seller' },
        preconditions: {
          courierName: 'Transportes Rápidos',
          trackingNumber: 'TRK-001',
          shippingCost: '15.00',
          sellerNote: 'Entregar antes de las 6pm',
        },
      }),
    );

    expect(mockDb._updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        courierName: 'Transportes Rápidos',
        trackingNumber: 'TRK-001',
        sellerNote: 'Entregar antes de las 6pm',
      }),
    );
  });

  test('handles ForbiddenActorError', async () => {
    // 'delivered' maps to PREPARING_ORDER; PREPARING_ORDER → WAITING_CUSTOMER_CONFIRMATION
    // requires seller or system — customer is NOT permitted
    mockDb._selectLimit.mockResolvedValue([makePayment({ status: 'delivered', version: 1 })]);

    const result = await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
        actor: { type: 'customer' },
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      // ForbiddenActorError message: Actor "customer" not allowed for transition ...
      expect(result.error).toMatch(/not (permitted|allowed)/);
    }
  });

  test('handles legacy status mapping (pending → CREATED → PAID)', async () => {
    mockDb._selectLimit.mockResolvedValue([makePayment({ status: 'pending', version: 1 })]);

    const result = await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.PAID,
        actor: { type: 'system' },
      }),
    );

    expect(result.success).toBe(true);
  });

  test('returns error for unknown legacy status', async () => {
    mockDb._selectLimit.mockResolvedValue([makePayment({ status: 'nonexistent', version: 1 })]);

    const result = await transition(
      makeInput({ toStatus: ORDER_STATUS_V2.PAID, actor: { type: 'system' } }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('desconocido');
    }
  });

  test('handles cancellation via customer', async () => {
    const result = await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.CANCELLED,
        actor: { type: 'customer' },
      }),
    );

    expect(result.success).toBe(true);
  });

  test('tracks fromStatus and toStatus in timeline metadata', async () => {
    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.PREPARING_ORDER,
        actor: { type: 'system' },
        metadata: { reason: 'payment confirmed' },
      }),
    );

    expect(mockDb._insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          fromStatus: ORDER_STATUS_V2.PAID,
          toStatus: ORDER_STATUS_V2.PREPARING_ORDER,
          reason: 'payment confirmed',
        }),
      }),
    );
  });

  // ── Pickup flow — pickup code generation ──

  test('generates pickup code on PREPARING_ORDER → READY_FOR_PICKUP for recojo orders', async () => {
    mockDb._selectLimit.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.PREPARING_ORDER, version: 1, shippingType: 'recojo' }),
    ]);
    mockDb._updateReturning.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.READY_FOR_PICKUP, version: 2, pickupCode: 'SL-TEST' }),
    ]);

    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.READY_FOR_PICKUP,
        actor: { type: 'seller' },
      }),
    );

    expect(mockDb._updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ORDER_STATUS_V2.READY_FOR_PICKUP,
        pickupCode: expect.stringMatching(/^SL-/),
      }),
    );
  });

  test('does NOT generate pickup code on IN_TRANSIT for recojo orders', async () => {
    mockDb._selectLimit.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.READY_TO_SHIP, version: 1, shippingType: 'recojo' }),
    ]);
    mockDb._updateReturning.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.IN_TRANSIT, version: 2 }),
    ]);

    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.IN_TRANSIT,
        actor: { type: 'seller' },
      }),
    );

    // For recojo orders, pickupCode should NOT be set on IN_TRANSIT
    const callArg = mockDb._updateSet.mock.calls[0][0];
    expect(callArg.status).toBe(ORDER_STATUS_V2.IN_TRANSIT);
    expect(callArg.pickupCode).toBeUndefined();
  });

  test('still generates pickup code on IN_TRANSIT for delivery orders', async () => {
    mockDb._selectLimit.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.READY_TO_SHIP, version: 1, shippingType: 'domicilio' }),
    ]);
    mockDb._updateReturning.mockResolvedValue([
      makePayment({ status: ORDER_STATUS_V2.IN_TRANSIT, version: 2, pickupCode: 'SL-DLV' }),
    ]);

    await transition(
      makeInput({
        toStatus: ORDER_STATUS_V2.IN_TRANSIT,
        actor: { type: 'seller' },
      }),
    );

    expect(mockDb._updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ORDER_STATUS_V2.IN_TRANSIT,
        pickupCode: expect.stringMatching(/^SL-/),
      }),
    );
  });
});
