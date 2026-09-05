// =====================================================
// validateAmount — unit tests
// =====================================================
// Verifies the authoritative server-side price computation
// for the amount revalidation (fix-price-tampering).
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

mockFrom.mockReturnValue({ where: mockWhere });
mockSelect.mockReturnValue({ from: mockFrom });

vi.mock('@/core/database/client', () => ({
  db: {
    select: mockSelect,
  },
}));

// ── Helpers ──────────────────────────────────────────

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '660e8400-e29b-41d4-a716-446655440001',
    price: '50.00',
    secondPrice: null,
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('validateAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  // Scenario 1 — single product, no sale price, amounts match
  test('valid single product (no secondPrice) matches client amount', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([productRow()]);

    const result = await validateAmount({
      productId: '660e8400-e29b-41d4-a716-446655440001',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 5000, // 50.00 * 100
    });

    expect(result).toEqual({ ok: true, serverAmount: 5000 });
  });

  // Scenario 2 — single product WITH secondPrice (sale price)
  test('uses secondPrice when present', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([productRow({ price: '80.00', secondPrice: '50.00' })]);

    const result = await validateAmount({
      productId: '660e8400-e29b-41d4-a716-446655440001',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 5000, // 50.00 * 100
    });

    expect(result).toEqual({ ok: true, serverAmount: 5000 });
  });

  // Scenario 3 — cart with multiple items, sum computed correctly
  test('computes cart total across multiple items', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([
      productRow({ id: 'prod-A', price: '30.00', secondPrice: null }),
      productRow({ id: 'prod-B', price: '25.00', secondPrice: '20.00' }),
    ]);

    const result = await validateAmount({
      productId: 'prod-A',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 8000, // (30*2 + 20*1) * 100
      cartItems: [
        { id: 'prod-A', quantity: 2 },
        { id: 'prod-B', quantity: 1 },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.serverAmount).toBe(8000);
  });

  // Scenario 4 — amount mismatch (tampering detected)
  test('returns ok:false when client amount mismatches server amount', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([productRow({ price: '50.00', secondPrice: null })]);

    const result = await validateAmount({
      productId: '660e8400-e29b-41d4-a716-446655440001',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 1000, // tampered lower amount
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('El monto no coincide con el precio del producto');
  });

  // Scenario 6 — product not found
  test('returns ok:false when product not found', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([]);

    const result = await validateAmount({
      productId: 'does-not-exist',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 5000,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Producto no encontrado');
  });

  // Scenario 7 — zero price (defensive check)
  test('returns ok:false when price is zero or negative', async () => {
    const { validateAmount } = await import('@/features/billing/validateAmount');
    mockWhere.mockResolvedValue([
      productRow({ id: 'prod-zero', price: '0.00', secondPrice: null }),
    ]);

    const result = await validateAmount({
      productId: 'prod-zero',
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      clientAmount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Precio de producto inválido');
  });
});
