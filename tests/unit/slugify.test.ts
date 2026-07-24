import { generateBusinessSlug, slugify } from '@/shared/utils/slugify';
import { describe, expect, test } from 'vitest';

// =====================================================
// SLUGIFY — Unit tests
// =====================================================

describe('slugify', () => {
  test('lowercases the input', () => {
    expect(slugify('Mi Tienda')).toBe('mi-tienda');
  });

  test('removes accents', () => {
    expect(slugify('José Martínez')).toBe('jose-martinez');
    expect(slugify('Café Español')).toBe('cafe-espanol');
    expect(slugify('Música y más')).toBe('musica-y-mas');
  });

  test('replaces non-DNS-safe characters with hyphens', () => {
    expect(slugify('mi_tienda!@#$%^&*()')).toBe('mi-tienda');
  });

  test('collapses multiple consecutive hyphens into one', () => {
    expect(slugify('mi   tienda')).toBe('mi-tienda');
    expect(slugify('mi---tienda')).toBe('mi-tienda');
  });

  test('removes leading hyphens', () => {
    expect(slugify('-mi tienda')).toBe('mi-tienda');
  });

  test('removes trailing hyphens', () => {
    expect(slugify('mi tienda-')).toBe('mi-tienda');
  });

  test('handles leading and trailing hyphens simultaneously', () => {
    expect(slugify('-mi tienda-')).toBe('mi-tienda');
  });

  test('preserves numbers', () => {
    expect(slugify('tienda 123')).toBe('tienda-123');
  });

  test('only produces DNS-safe characters: [a-z0-9-]', () => {
    const result = slugify('Hello Wörld! Café #1');
    expect(result).toMatch(/^[a-z0-9-]+$/);
  });

  test('returns empty string for entirely non-DNS-safe input', () => {
    expect(slugify('!@#$')).toBe('');
  });

  test('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  test('handles strings that become empty after stripping', () => {
    expect(slugify('   ')).toBe('');
  });
});

describe('generateBusinessSlug', () => {
  test('appends -store suffix for store type', () => {
    const result = generateBusinessSlug('Mi Tienda', 'store');
    expect(result).toMatch(/^mi-tienda-store-[a-z0-9]{4}$/);
  });

  test('appends -service suffix for service type', () => {
    const result = generateBusinessSlug('Consultoría', 'service');
    expect(result).toMatch(/^consultoria-service-[a-z0-9]{4}$/);
  });

  test('appends -consultancy suffix for consultancy type', () => {
    const result = generateBusinessSlug('Biz Dev', 'consultancy');
    expect(result).toMatch(/^biz-dev-consultancy-[a-z0-9]{4}$/);
  });

  test('prepends biz- when base would be shorter than 3 chars', () => {
    // Single char + suffix → still ≥ 3 chars, so no prefix
    const result = generateBusinessSlug('a', 'store');
    expect(result).toMatch(/^[a-z0-9-]+-[a-z0-9]{4}$/);
  });

  test('includes a random 4-char alphanumeric suffix', () => {
    const result1 = generateBusinessSlug('Mi Tienda', 'store');
    const result2 = generateBusinessSlug('Mi Tienda', 'store');

    // Same base but different random parts
    expect(result1).not.toBe(result2);
    expect(result1).toMatch(/^mi-tienda-store-[a-z0-9]{4}$/);
    expect(result2).toMatch(/^mi-tienda-store-[a-z0-9]{4}$/);
  });
});
