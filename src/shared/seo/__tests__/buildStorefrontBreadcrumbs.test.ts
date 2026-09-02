import { describe, expect, it } from 'vitest';

import { buildHomeBreadcrumbs, buildProductBreadcrumbs } from '../buildStorefrontBreadcrumbs';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBusiness(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Mi Tienda',
    slug: 'mi-tienda',
    ...overrides,
  } as any;
}

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Zapatillas Nike',
    slug: 'zapatillas-nike',
    id: 'prod-123',
    ...overrides,
  } as any;
}

// ── buildHomeBreadcrumbs ─────────────────────────────────────────────────────

describe('buildHomeBreadcrumbs', () => {
  it('returns BreadcrumbList with 1 item: Inicio', () => {
    const result = buildHomeBreadcrumbs(makeBusiness());
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result.itemListElement).toHaveLength(1);
    expect(result.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: expect.stringContaining('/mi-tienda'),
    });
  });

  it('includes @context schema.org', () => {
    const result = buildHomeBreadcrumbs(makeBusiness());
    expect(result['@context']).toBe('https://schema.org');
  });

  it('positions start at 1', () => {
    const result = buildHomeBreadcrumbs(makeBusiness());
    expect(result.itemListElement[0].position).toBe(1);
  });
});

// ── buildProductBreadcrumbs ───────────────────────────────────────────────────

describe('buildProductBreadcrumbs', () => {
  it('returns BreadcrumbList with 3 items', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    expect(result.itemListElement).toHaveLength(3);
  });

  it('items are Inicio → Business → Product', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    const names = result.itemListElement.map((i) => i.name);
    expect(names).toEqual(['Inicio', 'Mi Tienda', 'Zapatillas Nike']);
  });

  it('positions start at 1 and increment', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    const positions = result.itemListElement.map((i) => i.position);
    expect(positions).toEqual([1, 2, 3]);
  });

  it('uses product slug in URL when available', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    const productItem = result.itemListElement[2];
    expect(productItem.item).toContain('/product/zapatillas-nike');
  });

  it('falls back to product id when slug is null', () => {
    const product = makeProduct({ slug: null });
    const result = buildProductBreadcrumbs(makeBusiness(), product);
    const productItem = result.itemListElement[2];
    expect(productItem.item).toContain('/product/prod-123');
  });

  it('falls back to product id when slug is undefined', () => {
    const product = makeProduct({ slug: undefined });
    const result = buildProductBreadcrumbs(makeBusiness(), product);
    const productItem = result.itemListElement[2];
    expect(productItem.item).toContain('/product/prod-123');
  });

  it('business name in position 2 links to home URL', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    const businessItem = result.itemListElement[1];
    expect(businessItem.item).toContain('/mi-tienda');
  });

  it('includes @context schema.org', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    expect(result['@context']).toBe('https://schema.org');
  });

  it('@type is BreadcrumbList', () => {
    const result = buildProductBreadcrumbs(makeBusiness(), makeProduct());
    expect(result['@type']).toBe('BreadcrumbList');
  });
});
