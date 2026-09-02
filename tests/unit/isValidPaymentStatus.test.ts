// =====================================================
// isValidPaymentStatus — Unit tests
// =====================================================
// Verifies the pure guard used by the dashboard URL status
// filter accepts every recognized payment status and rejects
// unrecognized / empty / 'all' values.

import { isValidPaymentStatus } from '@/core/orders/isValidPaymentStatus';
import { ORDER_STATUS, ORDER_STATUS_INTERNAL, ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { describe, expect, test } from 'vitest';

describe('isValidPaymentStatus', () => {
  test('returns true for all legacy ORDER_STATUS values', () => {
    for (const value of Object.values(ORDER_STATUS)) {
      expect(isValidPaymentStatus(value)).toBe(true);
    }
  });

  test('returns true for all ORDER_STATUS_INTERNAL values', () => {
    for (const value of Object.values(ORDER_STATUS_INTERNAL)) {
      expect(isValidPaymentStatus(value)).toBe(true);
    }
  });

  test('returns true for all ORDER_STATUS_V2 values', () => {
    for (const value of Object.values(ORDER_STATUS_V2)) {
      expect(isValidPaymentStatus(value)).toBe(true);
    }
  });

  test('returns false for an empty string', () => {
    expect(isValidPaymentStatus('')).toBe(false);
  });

  test('returns false for an unrecognized string', () => {
    expect(isValidPaymentStatus('invalid_xyz')).toBe(false);
    expect(isValidPaymentStatus('ALL')).toBe(false);
  });

  test("returns false for 'all'", () => {
    expect(isValidPaymentStatus('all')).toBe(false);
  });
});
