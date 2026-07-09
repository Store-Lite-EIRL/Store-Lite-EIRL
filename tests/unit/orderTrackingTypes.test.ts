// =====================================================
// Order tracking shared types — Unit tests
// =====================================================
// Strict TDD: RED phase — these tests will fail because
// types.ts doesn't exist yet. They verify the shape of
// CallerProof and GetOrderDetailsResult.

import type { CallerProof, GetOrderDetailsResult } from '@/app/[slug]/order/[token]/types';
import { describe, expect, test } from 'vitest';

describe('CallerProof type shape', () => {
  test('has optional dni field (string)', () => {
    const proof: CallerProof = { dni: '12345678' };
    expect(typeof proof.dni).toBe('string');
  });

  test('has optional authId field (string)', () => {
    const proof: CallerProof = { authId: 'auth-001' };
    expect(typeof proof.authId).toBe('string');
  });

  test('both fields can be present', () => {
    const proof: CallerProof = { dni: '12345678', authId: 'auth-001' };
    expect(proof.dni).toBe('12345678');
    expect(proof.authId).toBe('auth-001');
  });
});

describe('GetOrderDetailsResult shape', () => {
  test('has all required fields', () => {
    const details: GetOrderDetailsResult = {
      buyerDni: '12345678',
      buyerEmail: 'test@example.com',
      buyerPhone: '51999999999',
      amount: 100,
      currency: 'PEN',
    };
    expect(details.buyerDni).toBe('12345678');
    expect(details.buyerEmail).toBe('test@example.com');
    expect(details.buyerPhone).toBe('51999999999');
    expect(details.amount).toBe(100);
    expect(details.currency).toBe('PEN');
  });
});
