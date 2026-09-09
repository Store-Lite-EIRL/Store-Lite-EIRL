// =====================================================
// buyerName — Shared two-word buyer-name validator
// =====================================================

import { describe, expect, test } from 'vitest';

const BUYER_NAME_ERROR_MESSAGE = 'Ingresá tu nombre y apellido';

describe('isTwoWordName', () => {
  test('accepts a plain two-word name', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('Juan Perez')).toBe(true);
  });

  test('accepts Spanish accents and ñ', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('Ernesto Pérez')).toBe(true);
    expect(isTwoWordName('María José')).toBe(true);
    expect(isTwoWordName('Álvaro Muñoz')).toBe(true);
  });

  test('accepts more than two words', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('Juan Carlos Perez Gomez')).toBe(true);
  });

  test('rejects a single-token name', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('Ernesto')).toBe(false);
  });

  test('rejects empty and whitespace-only input', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('')).toBe(false);
    expect(isTwoWordName('   ')).toBe(false);
  });

  test('rejects names shorter than 3 characters', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('ab')).toBe(false);
  });

  test('rejects names with disallowed characters', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('Juan1 Perez')).toBe(false);
    expect(isTwoWordName('Juan@Perez')).toBe(false);
    expect(isTwoWordName('Juan.Perez')).toBe(false);
  });

  test('trims surrounding whitespace before validating', async () => {
    const { isTwoWordName } = await import('@/shared/payments/buyerName');
    expect(isTwoWordName('  Juan   Perez  ')).toBe(true);
  });
});

describe('validateBuyerName', () => {
  test('returns null for empty input', async () => {
    const { validateBuyerName } = await import('@/shared/payments/buyerName');
    expect(validateBuyerName('')).toBeNull();
  });

  test('returns null for a valid two-word name', async () => {
    const { validateBuyerName } = await import('@/shared/payments/buyerName');
    expect(validateBuyerName('Juan Perez')).toBeNull();
    expect(validateBuyerName('  Ana María  ')).toBeNull();
  });

  test('returns BUYER_NAME_ERROR_MESSAGE for an invalid single-token name', async () => {
    const { validateBuyerName } = await import('@/shared/payments/buyerName');
    expect(validateBuyerName('Ernesto')).toBe(BUYER_NAME_ERROR_MESSAGE);
  });
});

describe('prefillBuyerName', () => {
  test('keeps the current value when it is non-empty (user wins)', async () => {
    const { prefillBuyerName } = await import('@/shared/payments/buyerName');
    expect(prefillBuyerName('  Ana Lopez  ', 'Ernesto Pérez')).toBe('  Ana Lopez  ');
  });

  test('prefills the trimmed fullName when current is empty', async () => {
    const { prefillBuyerName } = await import('@/shared/payments/buyerName');
    expect(prefillBuyerName('', 'Ernesto Pérez')).toBe('Ernesto Pérez');
    expect(prefillBuyerName('', '  Ernesto Pérez  ')).toBe('Ernesto Pérez');
  });

  test('returns empty string when fullName is null or undefined', async () => {
    const { prefillBuyerName } = await import('@/shared/payments/buyerName');
    expect(prefillBuyerName('', null)).toBe('');
    expect(prefillBuyerName('', undefined)).toBe('');
  });

  test('treats whitespace-only current as empty', async () => {
    const { prefillBuyerName } = await import('@/shared/payments/buyerName');
    expect(prefillBuyerName('   ', 'Ernesto Pérez')).toBe('Ernesto Pérez');
  });
});
