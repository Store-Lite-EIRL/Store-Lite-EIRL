import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────
// Helper: creates a thenable query result that works for BOTH:
//   - await where(...)           (processTimeouts loop — no .limit() call)
//   - await where(...).limit(1)  (handlePenalty inner queries)
function queryResult<T>(data: T[]): Promise<T[]> & { limit: (n: number) => Promise<T[]> } {
  const promise = Promise.resolve(data);
  return Object.assign(promise, { limit: () => promise });
}

// ── Mocks ──────────────────────────────────────────
// processTimeouts calls:
//   1. db.select({...}).from(payments).where(...) — for expired lookup (NO .limit())
//   2. transition(...) or handlePenalty(...) — for each expired order
//
// There are now 6 TIME RULES (2 penalty + 4 transition):
//   penalty-a, penalty-b, customer-auto-approve, auto-complete,
//   pickup-auto-complete, picked-up-auto-complete
//
// Penalty rules additionally call:
//   - db.select(...).from(penalties).where(...).limit(1) — idempotency check
//   - db.select(...).from(businesses).where(...).limit(1) — business guard
//   - db.insert(penalties).values({...}).returning({id}) — create penalty
//   - db.update(businesses).set({...}).where(...) — update business

const queryResults: any[][] = [];

const mockDb = {
  selectWhere: vi.fn(() => {
    const data = queryResults.shift() ?? [];
    return queryResult(data);
  }),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
};

vi.mock('@/core/database/client', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: mockDb.selectWhere })) })),
    insert: vi.fn(() => ({ values: mockDb.insertValues })),
    update: vi.fn(() => ({ set: mockDb.updateSet })),
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
    queryResults.length = 0;
    // Chain: insert().values() returns { returning: insertReturning }
    mockDb.insertValues.mockReturnValue({ returning: mockDb.insertReturning });
    // Chain: update().set() returns { where: updateWhere }
    mockDb.updateSet.mockReturnValue({ where: mockDb.updateWhere });
  });

  test('processes no orders when none are expired', async () => {
    // Each of the 6 rules gets a query — all return empty
    for (let i = 0; i < 6; i++) queryResults.push([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockDb.selectWhere).toHaveBeenCalledTimes(6); // one query per rule
    expect(transition).not.toHaveBeenCalled();
  });

  test('processes a penalty-a timeout (PREPARING_ORDER → penalty record)', async () => {
    // handlePenalty runs INSIDE the rule loop iteration for penalty-a,
    // BEFORE penalty-b's outer query. Queue order must be interleaved:
    queryResults.push([
      {
        id: 'pay_seller',
        version: 2,
        businessId: 'biz_123',
        amount: '100.00',
        orderNumber: 'ORD-001',
      },
    ]); // penalty-a outer query
    queryResults.push([]); // handlePenalty: existing penalty check
    queryResults.push([{ id: 'biz_123' }]); // handlePenalty: business exists check
    queryResults.push([]); // penalty-b outer query
    queryResults.push([]); // customer-auto-approve outer query
    queryResults.push([]); // auto-complete outer query
    queryResults.push([]); // pickup-auto-complete outer query
    queryResults.push([]); // picked-up-auto-complete outer query

    // Insert penalty returns the new penalty id
    mockDb.insertReturning.mockResolvedValue([{ id: 'penalty_001' }]);

    const result = await processTimeouts();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    // Penalty rules do NOT call transition()
    expect(transition).not.toHaveBeenCalled();
  });

  test('processes customer-auto-approve timeout (validando → READY_TO_SHIP)', async () => {
    queryResults.push([]); // penalty-a
    queryResults.push([]); // penalty-b
    queryResults.push([{ id: 'pay_approve', version: 1 }]); // customer-auto-approve
    queryResults.push([]); // auto-complete
    queryResults.push([]); // pickup-auto-complete
    queryResults.push([]); // picked-up-auto-complete

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
    queryResults.push([]); // penalty-a
    queryResults.push([]); // penalty-b
    queryResults.push([]); // customer-auto-approve
    queryResults.push([{ id: 'pay_complete', version: 3 }]); // auto-complete
    queryResults.push([]); // pickup-auto-complete
    queryResults.push([]); // picked-up-auto-complete

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
    // handlePenalty runs INSIDE the loop, interleaved with outer queries
    queryResults.push([
      { id: 'pay_001', version: 1, businessId: 'biz_001', amount: '50.00' },
      { id: 'pay_002', version: 1, businessId: 'biz_002', amount: '75.00' },
    ]); // penalty-a outer query — 2 orders found
    queryResults.push([]); // handlePenalty: pay_001 — existing penalty check
    queryResults.push([{ id: 'biz_001' }]); // handlePenalty: pay_001 — business exists
    queryResults.push([]); // handlePenalty: pay_002 — existing penalty check
    queryResults.push([{ id: 'biz_002' }]); // handlePenalty: pay_002 — business exists
    queryResults.push([]); // penalty-b outer query
    queryResults.push([]); // customer-auto-approve outer query
    queryResults.push([]); // auto-complete outer query
    queryResults.push([]); // pickup-auto-complete outer query
    queryResults.push([]); // picked-up-auto-complete outer query

    mockDb.insertReturning
      .mockResolvedValueOnce([{ id: 'penalty_001' }])
      .mockResolvedValueOnce([{ id: 'penalty_002' }]);

    vi.mocked(transition).mockResolvedValue({
      success: true,
      payment: {} as never,
      eventId: 'evt_001',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
    expect(transition).not.toHaveBeenCalled(); // penalty rules use handlePenalty, not transition
  });

  test('counts errors when transition fails', async () => {
    // Only match expired orders in the customer-auto-approve (transition) rule
    queryResults.push([]); // penalty-a
    queryResults.push([]); // penalty-b
    queryResults.push([{ id: 'pay_fail', version: 1 }]); // customer-auto-approve — transition rule
    queryResults.push([]); // auto-complete
    queryResults.push([]); // pickup-auto-complete
    queryResults.push([]); // picked-up-auto-complete

    vi.mocked(transition).mockResolvedValue({
      success: false,
      error: 'Version conflict',
    } as never);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  test('handles DB query errors gracefully', async () => {
    // For the "query fails" test, we need mockDb.selectWhere to throw
    // Override the default mockImplementation for this test
    mockDb.selectWhere
      .mockImplementationOnce(() => {
        throw new Error('DB connection timeout');
      }) // penalty-a — throw
      .mockImplementation(() => {
        const data = queryResults.shift() ?? [];
        return queryResult(data);
      });
    // Remaining rules return empty
    for (let i = 0; i < 5; i++) queryResults.push([]);

    const result = await processTimeouts();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  // ── Pickup timeout rules ──

  test('processes pickup-auto-complete timeout (READY_FOR_PICKUP → COMPLETED)', async () => {
    queryResults.push([]); // penalty-a
    queryResults.push([]); // penalty-b
    queryResults.push([]); // customer-auto-approve
    queryResults.push([]); // auto-complete
    queryResults.push([{ id: 'pay_pickup', version: 4 }]); // pickup-auto-complete
    queryResults.push([]); // picked-up-auto-complete

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
    queryResults.push([]); // penalty-a
    queryResults.push([]); // penalty-b
    queryResults.push([]); // customer-auto-approve
    queryResults.push([]); // auto-complete
    queryResults.push([]); // pickup-auto-complete
    queryResults.push([{ id: 'pay_picked', version: 5 }]); // picked-up-auto-complete

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
