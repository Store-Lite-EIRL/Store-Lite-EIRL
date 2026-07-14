// =====================================================
// enforceProductLimit — Unit tests
// =====================================================
// Verifies T1: enforceProductLimit() disables oldest
// excess products when business exceeds plan limit.
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

vi.mock('@/core/database/client', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
  },
}));

// ── Helper ───────────────────────────────────────────

/**
 * Creates a Promise that resolves to `value` and also has a
 * chainable `.orderBy()` method (mimicking Drizzle's query builder).
 */
function thenableWithOrderBy<T>(value: T): Promise<T> & { orderBy: typeof mockOrderBy } {
  return Object.assign(Promise.resolve(value), { orderBy: mockOrderBy });
}

// ── Suite ────────────────────────────────────────────

describe('enforceProductLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('no-op when under limit', async () => {
    mockSelectWhere.mockImplementation(() => thenableWithOrderBy([{ count: 3 }]));

    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const result = await enforceProductLimit('biz_1', 50);

    expect(result).toBe(0);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('no-op when at exact limit', async () => {
    mockSelectWhere.mockImplementation(() => thenableWithOrderBy([{ count: 50 }]));

    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const result = await enforceProductLimit('biz_1', 50);

    expect(result).toBe(0);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('no-op when unlimited', async () => {
    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const result = await enforceProductLimit('biz_1', -1);

    expect(result).toBe(0);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('disables oldest excess products', async () => {
    const oldestProducts = [
      { id: 'prod_1' },
      { id: 'prod_2' },
      { id: 'prod_3' },
      { id: 'prod_4' },
      { id: 'prod_5' },
    ];

    mockSelectWhere
      .mockImplementationOnce(() => thenableWithOrderBy([{ count: 55 }]))
      .mockImplementationOnce(() => thenableWithOrderBy(oldestProducts));

    mockLimit.mockResolvedValue(oldestProducts);
    mockUpdateWhere.mockResolvedValue(undefined);

    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const result = await enforceProductLimit('biz_1', 50);

    expect(result).toBe(5);
    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith({
      isAvailable: false,
      updatedAt: expect.any(Date),
    });
  });

  test('idempotent — second call disables nothing more', async () => {
    // First call: counts 55 active → disables 5
    const oldestProducts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }];

    mockSelectWhere
      .mockImplementationOnce(() => thenableWithOrderBy([{ count: 55 }]))
      .mockImplementationOnce(() => thenableWithOrderBy(oldestProducts));

    mockLimit.mockResolvedValue(oldestProducts);
    mockUpdateWhere.mockResolvedValue(undefined);

    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const firstResult = await enforceProductLimit('biz_1', 50);
    expect(firstResult).toBe(5);

    // ── Second call: 50 products active — at exact limit ──
    vi.clearAllMocks();

    mockSelectWhere.mockImplementation(() => thenableWithOrderBy([{ count: 50 }]));

    const secondResult = await enforceProductLimit('biz_1', 50);
    expect(secondResult).toBe(0);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('different businesses do not interfere', async () => {
    // Biz A: 55 products — exceeds limit by 5
    const bizAProducts = [
      { id: 'a_1' },
      { id: 'a_2' },
      { id: 'a_3' },
      { id: 'a_4' },
      { id: 'a_5' },
    ];

    mockSelectWhere
      .mockImplementationOnce(() => thenableWithOrderBy([{ count: 55 }]))
      .mockImplementationOnce(() => thenableWithOrderBy(bizAProducts));

    mockLimit.mockResolvedValue(bizAProducts);
    mockUpdateWhere.mockResolvedValue(undefined);

    const { enforceProductLimit } = await import('@/core/entitlements/enforceProductLimit');

    const resultA = await enforceProductLimit('biz_a', 50);
    expect(resultA).toBe(5);
    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    // ── Biz B: only 3 products — well under limit ──
    vi.clearAllMocks();

    mockSelectWhere.mockImplementation(() => thenableWithOrderBy([{ count: 3 }]));

    const resultB = await enforceProductLimit('biz_b', 50);
    expect(resultB).toBe(0);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
