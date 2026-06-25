import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────
// processTimeouts calls:
//   1. db.select({id, version}).from(payments).where(...) — for expired lookup
//   2. transition(...) from order-service — for each expired order

const mockDb = {
  selectWhere: vi.fn(),
};

vi.mock('@/core/database/client', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: mockDb.selectWhere })) })),
  },
}));

// transition mock — vi.fn() factory avoids TDZ, import gives us the mock handle
vi.mock('@/core/orders/orderService', () => ({
  transition: vi.fn(),
}));

import { transition } from '@/core/orders/orderService';
import { processTimeouts } from '@/core/orders/orderTimeouts';

// ── Suite ──────────────────────────────────────────

describe('processTimeouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('processes no orders when none are expired', async () => {
    // Each of the 5 rules gets a query — all return empty
    mockDb.selectWhere.mockResolvedValue([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockDb.selectWhere).toHaveBeenCalledTimes(5); // one query per rule
    expect(transition).not.toHaveBeenCalled();
  });

  test('processes a seller-inactivity timeout (delivered → SELLER_TIMEOUT)', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([{ id: 'pay_seller', version: 2 }]) // seller-inactivity rule
      .mockResolvedValueOnce([]) // customer-auto-approve
      .mockResolvedValueOnce([]) // auto-complete
      .mockResolvedValueOnce([]) // pickup-auto-complete
      .mockResolvedValueOnce([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: { id: 'pay_seller', status: 'SELLER_TIMEOUT' },
      eventId: 'evt_001',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_seller',
        toStatus: 'SELLER_TIMEOUT',
        actor: { type: 'system' },
      }),
    );
  });

  test('processes customer-auto-approve timeout (validando → READY_TO_SHIP)', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([]) // seller-inactivity
      .mockResolvedValueOnce([{ id: 'pay_approve', version: 1 }]) // customer-auto-approve
      .mockResolvedValueOnce([]) // auto-complete
      .mockResolvedValueOnce([]) // pickup-auto-complete
      .mockResolvedValueOnce([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: { id: 'pay_approve', status: 'READY_TO_SHIP' },
      eventId: 'evt_002',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_approve',
        toStatus: 'READY_TO_SHIP',
      }),
    );
  });

  test('processes auto-complete timeout (not_delivered → COMPLETED)', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([]) // seller-inactivity
      .mockResolvedValueOnce([]) // customer-auto-approve
      .mockResolvedValueOnce([{ id: 'pay_complete', version: 3 }]) // auto-complete
      .mockResolvedValueOnce([]) // pickup-auto-complete
      .mockResolvedValueOnce([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: { id: 'pay_complete', status: 'COMPLETED' },
      eventId: 'evt_003',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_complete',
        toStatus: 'COMPLETED',
      }),
    );
  });

  test('handles multiple expired orders in the same rule', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([
        { id: 'pay_001', version: 1 },
        { id: 'pay_002', version: 1 },
      ]) // seller-inactivity: 2 orders
      .mockResolvedValueOnce([]) // customer-auto-approve
      .mockResolvedValueOnce([]) // auto-complete
      .mockResolvedValueOnce([]) // pickup-auto-complete
      .mockResolvedValueOnce([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: {} as never,
      eventId: 'evt_001',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(2);
    expect(transition).toHaveBeenCalledTimes(2);
  });

  test('counts errors when transition fails', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([{ id: 'pay_fail', version: 1 }]) // seller-inactivity
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(transition).mockResolvedValue({
      success: false,
      error: 'Version conflict',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  test('handles DB query errors gracefully', async () => {
    mockDb.selectWhere
      .mockRejectedValueOnce(new Error('DB connection timeout'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  // ── Pickup timeout rules ──

  test('processes pickup-auto-complete timeout (READY_FOR_PICKUP → COMPLETED)', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([]) // seller-inactivity
      .mockResolvedValueOnce([]) // customer-auto-approve
      .mockResolvedValueOnce([]) // auto-complete
      .mockResolvedValueOnce([{ id: 'pay_pickup', version: 4 }]) // pickup-auto-complete
      .mockResolvedValueOnce([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: { id: 'pay_pickup', status: 'COMPLETED' },
      eventId: 'evt_004',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_pickup',
        toStatus: 'COMPLETED',
        actor: { type: 'system' },
      }),
    );
  });

  test('processes picked-up-auto-complete timeout (PICKED_UP → COMPLETED)', async () => {
    mockDb.selectWhere
      .mockResolvedValueOnce([]) // seller-inactivity
      .mockResolvedValueOnce([]) // customer-auto-approve
      .mockResolvedValueOnce([]) // auto-complete
      .mockResolvedValueOnce([]) // pickup-auto-complete
      .mockResolvedValueOnce([{ id: 'pay_picked', version: 5 }]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: { id: 'pay_picked', status: 'COMPLETED' },
      eventId: 'evt_005',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_picked',
        toStatus: 'COMPLETED',
        actor: { type: 'system' },
      }),
    );
  });
});
