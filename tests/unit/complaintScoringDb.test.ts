// =====================================================
// complaintScoring — DB-layer tests (REAL SQL query paths)
// =====================================================
// Exercises the REAL calculateComplaintScore() query-building + filtering
// logic against an in-memory fake store (tests/unit/helpers/fakeDrizzle.ts):
//  - KYC/chargeback lookup on the linked payment row
//  - 30-day pattern query (same business + claimType, in-window, prior rows)
//  - SLA deadline (15 business days) expiry
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
    linkedOrderId: 'linkedOrderId',
    createdAt: 'createdAt',
    status: 'status',
    claimType: 'claimType',
  },
  payments: {
    __tableName: 'payments',
    id: 'id',
    businessId: 'businessId',
    buyerDni: 'buyerDni',
    culqiChargeId: 'culqiChargeId',
    status: 'status',
    createdAt: 'createdAt',
  },
}));

// The modules under test import the query operators from 'drizzle-orm';
// render them as plain strings so the fake store can evaluate predicates
// (e.g. `businessId=biz-1 AND createdAt>=<date>`).
vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => `${col}=${val}`,
  and: (...args: unknown[]) => args.join(' AND '),
  gte: (col: unknown, val: unknown) => `${col}>=${val}`,
  lt: (col: unknown, val: unknown) => `${col}<${val}`,
}));

import { calculateComplaintScore } from '@/lib/complaintScoring';

// ── Fixtures ─────────────────────────────────────────

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function makeComplaint(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'c1',
    businessId: 'biz-1',
    linkedOrderId: null,
    createdAt: daysAgo(5),
    status: 'acknowledged',
    claimType: 'reclamo',
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: 'pay-1', buyerDni: null, culqiChargeId: null, ...overrides };
}

// ── Suite ────────────────────────────────────────────

describe('calculateComplaintScore — DB-layer paths', () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_DEACTIVATION = 'true';
    state.seed({});
  });

  afterEach(() => {
    delete process.env.ENABLE_AUTO_DEACTIVATION;
  });

  it('returns zeros without touching the DB when the feature flag is off', async () => {
    process.env.ENABLE_AUTO_DEACTIVATION = 'false';
    // Seed data that WOULD score if the guard didn't short-circuit.
    state.seed({
      complaints: [makeComplaint({ linkedOrderId: 'pay-1' })],
      payments: [makePayment({ buyerDni: '12345678', culqiChargeId: 'chr_1' })],
    });

    const result = await calculateComplaintScore('c1', 'biz-1');

    expect(result).toEqual({
      score: 0,
      tier: 'rejected',
      breakdown: {
        linkedToOrder: false,
        buyerKycVerified: false,
        culqiChargeback: false,
        slaExpired: false,
        patternSimilar: false,
      },
    });
  });

  it('looks up the linked order and credits KYC (+25) and chargeback (+40)', async () => {
    state.seed({
      complaints: [makeComplaint({ linkedOrderId: 'pay-1' })],
      payments: [makePayment({ buyerDni: '12345678', culqiChargeId: 'chr_abc' })],
    });

    const result = await calculateComplaintScore('c1', 'biz-1');

    expect(result.score).toBe(95); // 30 linked + 25 KYC + 40 chargeback
    expect(result.tier).toBe('verified');
    expect(result.breakdown).toMatchObject({
      linkedToOrder: true,
      buyerKycVerified: true,
      culqiChargeback: true,
    });
  });

  it('does NOT credit KYC/chargeback when the linked order has neither DNI nor charge id', async () => {
    state.seed({
      complaints: [makeComplaint({ linkedOrderId: 'pay-1' })],
      payments: [makePayment()], // no buyerDni, no culqiChargeId
    });

    const result = await calculateComplaintScore('c1', 'biz-1');

    expect(result.score).toBe(30); // only linkedToOrder
    expect(result.tier).toBe('under_review');
    expect(result.breakdown).toMatchObject({
      linkedToOrder: true,
      buyerKycVerified: false,
      culqiChargeback: false,
    });
  });

  it('credits the pattern factor (+20) when >=3 similar complaints exist inside the 30d window', async () => {
    state.seed({
      complaints: [
        makeComplaint({ id: 'c-new', linkedOrderId: 'pay-1', createdAt: daysAgo(5) }),
        // 3 prior, same business, same claimType, inside window, BEFORE c-new
        makeComplaint({ id: 'p1', createdAt: daysAgo(10) }),
        makeComplaint({ id: 'p2', createdAt: daysAgo(9) }),
        makeComplaint({ id: 'p3', createdAt: daysAgo(8) }),
      ],
      payments: [makePayment()],
    });

    const result = await calculateComplaintScore('c-new', 'biz-1');

    expect(result.score).toBe(50); // 30 linked + 20 pattern
    expect(result.tier).toBe('under_review');
    expect(result.breakdown.patternSimilar).toBe(true);
  });

  it('excludes out-of-window, different-claimType, and other-business complaints from the pattern', async () => {
    state.seed({
      complaints: [
        makeComplaint({ id: 'c-new', linkedOrderId: 'pay-1', createdAt: daysAgo(5) }),
        // 3 matches but OUTSIDE the 30d window (40 days ago) — must not count
        makeComplaint({ id: 'old1', createdAt: daysAgo(40) }),
        makeComplaint({ id: 'old2', createdAt: daysAgo(41) }),
        makeComplaint({ id: 'old3', createdAt: daysAgo(42) }),
        // inside window but different claimType — must not count
        makeComplaint({ id: 'queja1', claimType: 'queja', createdAt: daysAgo(6) }),
        // inside window, same type, but another business — must not count
        makeComplaint({
          id: 'other-biz',
          businessId: 'biz-other',
          createdAt: daysAgo(6),
        }),
      ],
      payments: [makePayment()],
    });

    const result = await calculateComplaintScore('c-new', 'biz-1');

    expect(result.score).toBe(30); // only linkedToOrder — pattern must NOT trigger
    expect(result.breakdown.patternSimilar).toBe(false);
  });

  it('credits the SLA factor (+15) when the complaint stayed pending past 15 business days', async () => {
    state.seed({
      complaints: [
        makeComplaint({
          id: 'c1',
          linkedOrderId: null,
          createdAt: daysAgo(60), // long past the 15-business-day SLA
          status: 'pending',
        }),
      ],
    });

    const result = await calculateComplaintScore('c1', 'biz-1');

    expect(result.score).toBe(15);
    expect(result.tier).toBe('rejected');
    expect(result.breakdown.slaExpired).toBe(true);
  });

  it('throws when the complaint row does not exist', async () => {
    state.seed({ complaints: [] });

    await expect(calculateComplaintScore('missing', 'biz-1')).rejects.toThrow(
      'Complaint not found or business mismatch',
    );
  });

  it('throws on business mismatch for an existing complaint', async () => {
    state.seed({
      complaints: [makeComplaint({ businessId: 'biz-other' })],
    });

    await expect(calculateComplaintScore('c1', 'biz-1')).rejects.toThrow(
      'Complaint not found or business mismatch',
    );
  });
});
