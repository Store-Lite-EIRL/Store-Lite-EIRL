// =====================================================
// ProductCard — Discount display verification
// =====================================================
//
// This test verifies that ProductCard shows the discount
// badge when a product has secondPrice set.
//
// Expected initial result: 2 FAIL, 2 PASS (bug — ProductCard
// uses metadata.originalPrice instead of secondPrice).
// After the fix: 4 PASS.

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ProductCard from '@app/(main)/home/components/ProductCard';

// ── Mock Checkout ────────────────────────────────────
vi.mock('@app/[slug]/(app)/components/Checkout', () => ({
  default: () => null,
}));

// ── Helpers ──────────────────────────────────────────

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-test-1',
    businessId: 'biz-test-1',
    title: 'Laptop Gamer X',
    description: 'Una laptop potente',
    price: '100.00',
    secondPrice: null,
    stock: 10,
    currency: 'PEN',
    isAvailable: true,
    tags: ['gaming'],
    saleStatus: 'NORMAL' as const,
    stars: 0,
    metadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('ProductCard — discount display', () => {
  test('SHOWS discount badge and originalPrice when secondPrice is set', () => {
    const product = buildProduct({
      price: '100.00',
      secondPrice: '80.00',
    });

    render(<ProductCard product={product} />);

    // Should show discount badge with -20%
    // BUG: Currently reads from metadata.originalPrice, not secondPrice
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  test('does NOT show discount badge when secondPrice is null', () => {
    const product = buildProduct({
      price: '100.00',
      secondPrice: null,
    });

    render(<ProductCard product={product} />);

    // Should NOT show any discount badge
    expect(screen.queryByText(/-?\d+%/)).not.toBeInTheDocument();
  });

  test('computes discount percentage correctly (25%)', () => {
    const product = buildProduct({
      price: '200.00',
      secondPrice: '150.00',
    });

    render(<ProductCard product={product} />);

    // 25% discount: (200 - 150) / 200 * 100 = 25
    // BUG: Currently reads from metadata.originalPrice, not secondPrice
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  test('does NOT show discount badge when secondPrice equals price', () => {
    const product = buildProduct({
      price: '100.00',
      secondPrice: '100.00',
    });

    render(<ProductCard product={product} />);

    // When prices are equal, discount should NOT show (price < originalPrice guard)
    expect(screen.queryByText(/-?\d+%/)).not.toBeInTheDocument();
  });
});
