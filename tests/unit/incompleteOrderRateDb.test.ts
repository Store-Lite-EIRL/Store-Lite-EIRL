// =====================================================
// incompleteOrderRate — DB-layer tests (REAL SQL query paths)
// =====================================================
// Exercises the REAL calculateBusinessIncompleteOrderRate() query-building +
// filtering logic against an in-memory fake store
// (tests/unit/helpers/fakeDrizzle.ts):
//  - 30-day window filter (businessId + createdAt >= windowStart)
//  - status filtering: incomplete statuses counted, completed excluded
//  - rate + threshold computation over the filtered rows
//  - feature-flag guard
// Previously these paths had 0% coverage because callers mocked the whole
// module. No new framework or dependency — uses the repo's vi.mock pattern.
// =====================================================

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FakeDbInstance } from './helpers/fakeDrizzle';

// ── Mocks (hoisted: the fake store is shared between test setup and the
// mocked '@/core/database/client' module) ──────────────────────────────

const state = vi.hoisted<{
  seed: FakeDbInstance['seed'];
  db: FakeDbInstance['db'];
}>(() => ({
  seed: undefined as unknown as FakeDbInstance['seed'],
  db: undefined as unknown as FakeDbInstance['db'],
}));

vi.mock('@/core/database/client', async () => {
  const { createFakeDb } = await import('./helpers/fakeDrizzle');
  const instance = createFakeDb();
  state.seed = instance.seed;
  state.db = instance.db;
  return { db: instance.db };
});

vi.mock('@/core/database/schema', () => ({
  complaintBookRecords: {
    __tableName: 'complaints',
    id: 'id',
    businessId: 'businessId',
    createdAt: 'createdAt',
  },
  payments: {
    __tableName: 'payments',
    id: 'id',
    businessId: 'businessId',
    status: 'status',
    createdAt: 'createdAt',
  },
}));

// The module under test imports the query operators from 'drizzle-orm';
// render them as plain strings so the fake store can evaluate predicates.
vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => `${col}=${val}`,
  and: (...args: unknown[]) => args.join(' AND '),
  gte: (col: unknown, val: unknown) => `${col}>=${val}`,
  lt: (col: unknown, val: unknown) => `${col}<${val}`,
}));

import { calculateBusinessIncompleteOrderRate } from '@/lib/incompleteOrderRate';

// ── Fixtures ─────────────────────────────────────────

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function makeOrder(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `pay-${Math.random().toString(36).slice(2, 8)}`,
    businessId: 'biz-1',
    status: 'pending',
    createdAt: daysAgo(2),
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('calculateBusinessIncompleteOrderRate — DB-layer paths', () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';
    state.seed({});
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  it('returns zeros without touching the DB when the feature flag is off', async () => {
    process.env.ENABLE_AUTO_DEACTIVATION = 'false';
    // Seed orders that WOULD exceed the threshold if the guard didn't short-circuit.
    state.seed({
      payments: [makeOrder({ status: 'pending' }), makeOrder({ status: 'paid' })],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result).toEqual({
      totalOrders: 0,
      incompleteOrders: 0,
      incompleteRate: 0,
      exceedsThreshold: false,
    });
  });

  it('counts only incomplete-status orders and exceeds the 40% threshold', async () => {
    state.seed({
      payments: [
        makeOrder({ status: 'pending' }),
        makeOrder({ status: 'paid' }),
        makeOrder({ status: 'disputed' }),
        makeOrder({ status: 'completed' }),
        makeOrder({ status: 'completed' }),
      ],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result.totalOrders).toBe(5);
    expect(result.incompleteOrders).toBe(3);
    expect(result.incompleteRate).toBe(6000); // 60.00%
    expect(result.exceedsThreshold).toBe(true);
  });

  it('returns 0% when every order in the window is completed', async () => {
    state.seed({
      payments: [
        makeOrder({ status: 'completed' }),
        makeOrder({ status: 'completed' }),
        makeOrder({ status: 'completed' }),
      ],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result).toMatchObject({
      totalOrders: 3,
      incompleteOrders: 0,
      incompleteRate: 0,
      exceedsThreshold: false,
    });
  });

  it('excludes orders outside the 30-day window from the rate', async () => {
    state.seed({
      payments: [
        // 2 incomplete orders aged 40+ days — outside the rolling window
        makeOrder({ status: 'pending', createdAt: daysAgo(40) }),
        makeOrder({ status: 'cancelled', createdAt: daysAgo(45) }),
        // 1 recent completed order — inside the window
        makeOrder({ status: 'completed', createdAt: daysAgo(2) }),
      ],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result.totalOrders).toBe(1);
    expect(result.incompleteOrders).toBe(0);
    expect(result.incompleteRate).toBe(0);
    expect(result.exceedsThreshold).toBe(false);
  });

  it('reports 100% when every in-window order is incomplete', async () => {
    state.seed({
      payments: [makeOrder({ status: 'pending' }), makeOrder({ status: 'failed' })],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result).toMatchObject({
      totalOrders: 2,
      incompleteOrders: 2,
      incompleteRate: 10000, // 100.00%
      exceedsThreshold: true,
    });
  });

  it('returns zeros for a business with no orders in the window', async () => {
    state.seed({ payments: [] });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result).toEqual({
      totalOrders: 0,
      incompleteOrders: 0,
      incompleteRate: 0,
      exceedsThreshold: false,
    });
  });

  it('only counts orders belonging to the requested business', async () => {
    state.seed({
      payments: [
        // another business's incomplete orders must be ignored
        makeOrder({ businessId: 'biz-other', status: 'pending' }),
        makeOrder({ businessId: 'biz-other', status: 'paid' }),
        // this business: 1 of 2 incomplete -> 50%
        makeOrder({ status: 'pending' }),
        makeOrder({ status: 'completed' }),
      ],
    });

    const result = await calculateBusinessIncompleteOrderRate('biz-1');

    expect(result.totalOrders).toBe(2);
    expect(result.incompleteOrders).toBe(1);
    expect(result.incompleteRate).toBe(5000);
    expect(result.exceedsThreshold).toBe(true);
  });
});
