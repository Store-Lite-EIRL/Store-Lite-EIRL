import { beforeEach, describe, expect, test, vi } from 'vitest';

// Use vi.hoisted for ALL mocks that are referenced inside vi.mock factories
const mocks = vi.hoisted(() => ({
  selectWhere: vi.fn(() => {
    const data = mocks.queryResults.shift() ?? [];
    return Object.assign(Promise.resolve(data), { limit: () => Promise.resolve(data) });
  }),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  transition: vi.fn(),
  checkIncompleteOrderDeactivation: vi.fn(),
  processOrderCompletion: vi.fn(),
  queryResults: [] as any[][],
}));

vi.mock('@/core/database/client', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: mocks.selectWhere })) })),
    insert: vi.fn(() => ({ values: mocks.insertValues })),
    update: vi.fn(() => ({ set: mocks.updateSet })),
  },
}));

vi.mock('@/core/orders/orderService', () => ({
  transition: mocks.transition,
}));

vi.mock('@/lib/incompleteOrderRate', () => ({
  checkIncompleteOrderDeactivation: mocks.checkIncompleteOrderDeactivation,
}));

vi.mock('@/lib/deactivation', () => ({
  processOrderCompletion: mocks.processOrderCompletion,
}));

import { processTimeouts } from '@/core/orders/orderTimeouts';

function resetMocks() {
  mocks.selectWhere.mockReset();
  mocks.insertValues.mockReset();
  mocks.insertReturning.mockReset();
  mocks.updateSet.mockReset();
  mocks.updateWhere.mockReset();
  mocks.transition.mockReset();
  mocks.checkIncompleteOrderDeactivation.mockReset();
  mocks.processOrderCompletion.mockReset();
  mocks.queryResults.length = 0;
}

// ── Suite ──────────────────────────────────────────

describe('processTimeouts', () => {
  beforeEach(() => {
    resetMocks();
    mocks.insertValues.mockReturnValue({ returning: mocks.insertReturning });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.transition.mockResolvedValue({
      success: true,
      payment: {},
      eventId: 'evt',
    });
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  test('processes no orders when none are expired', async () => {
    for (let i = 0; i < 6; i++) mocks.queryResults.push([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
    expect(mocks.selectWhere).toHaveBeenCalledTimes(6);
    expect(mocks.transition).not.toHaveBeenCalled();
  });

  test('processes a penalty-a timeout (PREPARING_ORDER → penalty record)', async () => {
    mocks.queryResults.push([
      {
        id: 'pay_seller',
        version: 2,
        businessId: 'biz_123',
        amount: '100.00',
        orderNumber: 'ORD-001',
      },
    ]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'biz_123' }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);

    mocks.insertReturning.mockResolvedValue([{ id: 'penalty_001' }]);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(mocks.transition).not.toHaveBeenCalled();
  });

  test('processes customer-auto-approve timeout (validando → READY_TO_SHIP)', async () => {
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'pay_approve', version: 1 }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);

    mocks.transition.mockResolvedValue({
      success: true,
      payment: { id: 'pay_approve', status: 'READY_TO_SHIP' },
      eventId: 'evt_002',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(mocks.transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_approve',
        toStatus: 'READY_TO_SHIP',
      }),
    );
  });

  test('processes auto-complete timeout (not_delivered → COMPLETED)', async () => {
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'pay_complete', version: 3 }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);

    mocks.transition.mockResolvedValue({
      success: true,
      payment: { id: 'pay_complete', status: 'COMPLETED' },
      eventId: 'evt_003',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(mocks.transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_complete',
        toStatus: 'COMPLETED',
      }),
    );
  });

  test('handles multiple expired orders in the same rule', async () => {
    mocks.queryResults.push([
      { id: 'pay_001', version: 1, businessId: 'biz_001', amount: '50.00' },
      { id: 'pay_002', version: 1, businessId: 'biz_002', amount: '75.00' },
    ]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'biz_001' }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'biz_002' }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);

    mocks.insertReturning
      .mockResolvedValueOnce([{ id: 'penalty_001' }])
      .mockResolvedValueOnce([{ id: 'penalty_002' }]);

    mocks.transition.mockResolvedValue({
      success: true,
      payment: {} as never,
      eventId: 'evt_001',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
    expect(mocks.transition).not.toHaveBeenCalled();
  });

  test('counts errors when transition fails', async () => {
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'pay_fail', version: 1 }]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);

    mocks.transition.mockResolvedValue({
      success: false,
      error: 'Version conflict',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  test('handles DB query errors gracefully', async () => {
    mocks.selectWhere
      .mockImplementationOnce(() => {
        throw new Error('DB connection timeout');
      })
      .mockImplementation(() => {
        const data = mocks.queryResults.shift() ?? [];
        return Object.assign(Promise.resolve(data), { limit: () => Promise.resolve(data) });
      });
    for (let i = 0; i < 5; i++) mocks.queryResults.push([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  test('processes pickup-auto-complete timeout (READY_FOR_PICKUP → COMPLETED)', async () => {
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'pay_pickup', version: 4 }]);
    mocks.queryResults.push([]);

    mocks.transition.mockResolvedValue({
      success: true,
      payment: { id: 'pay_pickup', status: 'COMPLETED' },
      eventId: 'evt_004',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(mocks.transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_pickup',
        toStatus: 'COMPLETED',
        actor: { type: 'system' },
      }),
    );
  });

  test('processes picked-up-auto-complete timeout (PICKED_UP → COMPLETED)', async () => {
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([]);
    mocks.queryResults.push([{ id: 'pay_picked', version: 5 }]);

    mocks.transition.mockResolvedValue({
      success: true,
      payment: { id: 'pay_picked', status: 'COMPLETED' },
      eventId: 'evt_005',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(mocks.transition).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay_picked',
        toStatus: 'COMPLETED',
        actor: { type: 'system' },
      }),
    );
  });

  describe('incomplete order rate integration in handlePenalty', () => {
    beforeEach(() => {
      resetMocks();
      mocks.insertValues.mockReturnValue({ returning: mocks.insertReturning });
      mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
      mocks.transition.mockResolvedValue({
        success: true,
        payment: {},
        eventId: 'evt',
      });
      process.env.ENABLE_AUTO_DEACTIVATION = 'true';
    });

    afterEach(() => {
      delete process.env.ENABLE_AUTO_DEACTIVATION;
    });

    it('calls checkIncompleteOrderDeactivation after penalty-a is created', async () => {
      mocks.checkIncompleteOrderDeactivation.mockResolvedValue({
        shouldDeactivate: false,
        rate: {
          exceedsThreshold: false,
          incompleteRate: 2000,
          totalOrders: 10,
          incompleteOrders: 2,
        },
      });
      mocks.processOrderCompletion.mockResolvedValue(undefined);
      mocks.insertReturning.mockResolvedValue([{ id: 'penalty_001' }]);

      mocks.queryResults.push([
        {
          id: 'pay_seller',
          version: 2,
          businessId: 'biz_123',
          amount: '100.00',
          orderNumber: 'ORD-001',
        },
      ]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([{ id: 'biz_123' }]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);

      const result = await processTimeouts();

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
      expect(mocks.checkIncompleteOrderDeactivation).toHaveBeenCalledWith('biz_123');
      expect(mocks.processOrderCompletion).not.toHaveBeenCalled();
    });

    it('triggers deactivation when incomplete order rate exceeds threshold after penalty', async () => {
      mocks.checkIncompleteOrderDeactivation.mockResolvedValue({
        shouldDeactivate: true,
        rate: {
          exceedsThreshold: true,
          incompleteRate: 5000,
          totalOrders: 10,
          incompleteOrders: 5,
        },
      });
      mocks.processOrderCompletion.mockResolvedValue(undefined);
      mocks.insertReturning.mockResolvedValue([{ id: 'penalty_001' }]);

      mocks.queryResults.push([
        {
          id: 'pay_seller',
          version: 2,
          businessId: 'biz_123',
          amount: '100.00',
          orderNumber: 'ORD-001',
        },
      ]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([{ id: 'biz_123' }]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);

      const result = await processTimeouts();

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
      expect(mocks.checkIncompleteOrderDeactivation).toHaveBeenCalledWith('biz_123');
      expect(mocks.processOrderCompletion).toHaveBeenCalledWith('biz_123');
    });

    it('does not call checkIncompleteOrderDeactivation when feature flag disabled', async () => {
      process.env.ENABLE_AUTO_DEACTIVATION = 'false';
      mocks.checkIncompleteOrderDeactivation.mockResolvedValue({
        shouldDeactivate: true,
        rate: { exceedsThreshold: true },
      });
      mocks.processOrderCompletion.mockResolvedValue(undefined);
      mocks.insertReturning.mockResolvedValue([{ id: 'penalty_001' }]);

      mocks.queryResults.push([
        {
          id: 'pay_seller',
          version: 2,
          businessId: 'biz_123',
          amount: '100.00',
          orderNumber: 'ORD-001',
        },
      ]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([{ id: 'biz_123' }]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);
      mocks.queryResults.push([]);

      const result = await processTimeouts();

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
      expect(mocks.checkIncompleteOrderDeactivation).not.toHaveBeenCalled();
      expect(mocks.processOrderCompletion).not.toHaveBeenCalled();
    });
  });
});
