import { describe, expect, it } from 'vitest';

import {
  buildProductDescription,
  buildProductTitle,
  buildStoreDescription,
  buildStoreTitle,
} from '../buildStorefrontMeta';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBusiness(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Mi Tienda',
    slug: 'mi-tienda',
    city: 'Lima',
    description: 'Tu tienda de confianza con los mejores productos del Perú.',
    seoTitle: null,
    seoDescription: null,
    ...overrides,
  } as any;
}

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Zapatillas Nike',
    description: 'Zapatillas deportivas Nike para correr.',
    seoTitle: null,
    seoDescription: null,
    ...overrides,
  } as any;
}

// ── buildStoreTitle ───────────────────────────────────────────────────────────

describe('buildStoreTitle', () => {
  it('generates title from name + city when no seoTitle', () => {
    const title = buildStoreTitle(makeBusiness());
    expect(title).toBe('Mi Tienda — Tienda en Lima');
  });

  it('uses default "Perú" when city is null', () => {
    const title = buildStoreTitle(makeBusiness({ city: null }));
    expect(title).toBe('Mi Tienda — Tienda en Perú');
  });

  it('returns seoTitle verbatim when set', () => {
    const title = buildStoreTitle(
      makeBusiness({ seoTitle: 'Mi Tienda Online - Envíos a Todo Perú' }),
    );
    expect(title).toBe('Mi Tienda Online - Envíos a Todo Perú');
  });

  it('truncates at word boundary when >60 chars', () => {
    const business = makeBusiness({
      seoTitle: 'Una Tienda Increíblemente Larga Con Un Nombre Muy Largo Para Pruebas De Truncado',
    });
    const title = buildStoreTitle(business);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith('…')).toBe(true);
  });

  it('hard-slices when no word boundary exists within 60 chars', () => {
    const business = makeBusiness({
      seoTitle: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkmnopqrstuvwxyz_extra',
    });
    const title = buildStoreTitle(business);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('returns full title when ≤60 chars without truncation', () => {
    const title = buildStoreTitle(makeBusiness());
    expect(title).toBe('Mi Tienda — Tienda en Lima');
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('handles unicode/emoji multi-byte correctly', () => {
    const business = makeBusiness({
      name: 'Tienda 🛍️',
      city: 'Santiago',
    });
    const title = buildStoreTitle(business);
    expect(title).toBe('Tienda 🛍️ — Tienda en Santiago');
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('handles empty name gracefully', () => {
    const title = buildStoreTitle(makeBusiness({ name: '' }));
    expect(title).toBe(' — Tienda en Lima');
  });
});

// ── buildStoreDescription ─────────────────────────────────────────────────────

describe('buildStoreDescription', () => {
  it('uses seoDescription when set (normalized to 150-160 chars)', () => {
    const desc = buildStoreDescription(
      makeBusiness({ seoDescription: 'La mejor tienda online del Perú con productos de calidad.' }),
    );
    expect(desc.length).toBeGreaterThanOrEqual(150);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain('La mejor tienda online del Perú');
  });

  it('uses business description when seoDescription is null (normalized to 150-160 chars)', () => {
    const desc = buildStoreDescription(makeBusiness());
    expect(desc.length).toBeGreaterThanOrEqual(150);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain('Tu tienda de confianza con los mejores productos del Perú');
  });

  it('uses generated fallback when both are null', () => {
    const desc = buildStoreDescription(makeBusiness({ description: null }));
    expect(desc).toContain('Bienvenido a Mi Tienda');
    expect(desc).toContain('Lima');
  });

  it('pads short description to 150 chars minimum', () => {
    const desc = buildStoreDescription(makeBusiness({ description: 'Corta' }));
    expect(desc.length).toBeGreaterThanOrEqual(150);
  });

  it('trims long description to 160 chars maximum', () => {
    const longDesc = 'A'.repeat(200);
    const desc = buildStoreDescription(makeBusiness({ description: longDesc }));
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it('returns 150-160 chars for default fallback', () => {
    const desc = buildStoreDescription(makeBusiness({ description: null }));
    expect(desc.length).toBeGreaterThanOrEqual(150);
    expect(desc.length).toBeLessThanOrEqual(160);
  });
});

// ── buildProductTitle ─────────────────────────────────────────────────────────

describe('buildProductTitle', () => {
  it('generates title from product + business name', () => {
    const title = buildProductTitle(makeProduct(), makeBusiness());
    expect(title).toBe('Zapatillas Nike - Mi Tienda');
  });

  it('returns seoTitle verbatim when set', () => {
    const title = buildProductTitle(
      makeProduct({ seoTitle: 'Zapatillas Nike Edición Premium' }),
      makeBusiness(),
    );
    expect(title).toBe('Zapatillas Nike Edición Premium');
  });

  it('truncates at word boundary when >60 chars', () => {
    const product = makeProduct({
      seoTitle: 'Zapatillas Nike Edición Premium Con Tecnología Air Max Para Correr',
    });
    const title = buildProductTitle(product, makeBusiness());
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith('…')).toBe(true);
  });

  it('hard-slices when no word boundary within 60 chars', () => {
    const product = makeProduct({
      seoTitle: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij',
    });
    const title = buildProductTitle(product, makeBusiness());
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('handles unicode/emoji correctly', () => {
    const product = makeProduct({ title: 'Zapatillas 👟' });
    const title = buildProductTitle(product, makeBusiness());
    expect(title).toBe('Zapatillas 👟 - Mi Tienda');
    expect(title.length).toBeLessThanOrEqual(60);
  });
});

// ── buildProductDescription ───────────────────────────────────────────────────

describe('buildProductDescription', () => {
  it('uses seoDescription when set', () => {
    const desc = buildProductDescription(
      makeProduct({ seoDescription: 'Las mejores zapatillas para deportistas.' }),
      makeBusiness(),
    );
    expect(desc).toBe('Las mejores zapatillas para deportistas.');
  });

  it('uses product description sliced to 160 chars', () => {
    const desc = buildProductDescription(makeProduct(), makeBusiness());
    expect(desc).toBe('Zapatillas deportivas Nike para correr.');
  });

  it('truncates long product description to 160 chars', () => {
    const product = makeProduct({ description: 'A'.repeat(200) });
    const desc = buildProductDescription(product, makeBusiness());
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it('uses fallback when description is null', () => {
    const desc = buildProductDescription(makeProduct({ description: null }), makeBusiness());
    expect(desc).toBe('Compra Zapatillas Nike en Mi Tienda');
  });

  it('returns ≤160 chars for fallback', () => {
    const desc = buildProductDescription(makeProduct({ description: null }), makeBusiness());
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it('handles unicode/emoji correctly', () => {
    const product = makeProduct({ description: 'Zapatillas 🏃‍♂️ para correr.' });
    const desc = buildProductDescription(product, makeBusiness());
    expect(desc).toBe('Zapatillas 🏃‍♂️ para correr.');
    expect(desc.length).toBeLessThanOrEqual(160);
  });
});
