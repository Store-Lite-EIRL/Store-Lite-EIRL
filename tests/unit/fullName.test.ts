// =====================================================
// splitFullName — Unit tests
// =====================================================

import { describe, expect, test } from 'vitest';

describe('splitFullName', () => {
  test('splits "Juan Perez" on first space', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName('Juan Perez')).toEqual({
      first_name: 'Juan',
      last_name: 'Perez',
    });
  });

  test('single word "Juan" returns only first_name', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName('Juan')).toEqual({ first_name: 'Juan' });
  });

  test('empty string returns empty object', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName('')).toEqual({});
  });

  test('undefined/null return empty object', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName(undefined)).toEqual({});
    expect(splitFullName(null)).toEqual({});
  });

  test('multi-word "Juan Carlos Perez Gomez" keeps remainder as last_name', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName('Juan Carlos Perez Gomez')).toEqual({
      first_name: 'Juan',
      last_name: 'Carlos Perez Gomez',
    });
  });

  test('trims surrounding whitespace', async () => {
    const { splitFullName } = await import('@/shared/payments/fullName');
    expect(splitFullName('  Ana  Maria  ')).toEqual({
      first_name: 'Ana',
      last_name: 'Maria',
    });
  });
});
