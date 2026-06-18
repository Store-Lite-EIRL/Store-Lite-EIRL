import { describe, expect, test } from 'vitest';
import { generatePickupCode } from '@/core/orders/order-pickup';

// =====================================================
// ORDER PICKUP CODE — Unit tests
// =====================================================
// Tests SL-XXXX-XXXX generation

// randomBytes(4).toString('hex') → 8 hex chars, uppercased
const CODE_PATTERN = /^SL-[A-F0-9]{8}-[A-F0-9]{8}$/;

describe('generatePickupCode', () => {
  test('generates a code matching SL-XXXX-XXXX pattern', () => {
    const code = generatePickupCode();
    expect(code).toMatch(CODE_PATTERN);
  });

  test('generates unique codes across multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generatePickupCode());
    }
    expect(codes.size).toBe(100);
  });

  test('first segment is always SL', () => {
    const code = generatePickupCode();
    expect(code.startsWith('SL-')).toBe(true);
  });

  test('second segment is 8 hex characters (randomBytes(4) → hex → 8 chars)', () => {
    const code = generatePickupCode();
    const [, segment2] = code.split('-');
    expect(segment2).toMatch(/^[A-F0-9]{8}$/);
  });

  test('third segment is 8 hex characters', () => {
    const code = generatePickupCode();
    const segments = code.split('-');
    expect(segments[2]).toMatch(/^[A-F0-9]{8}$/);
  });

  test('uses uppercase hex characters (no lowercase)', () => {
    const code = generatePickupCode();
    expect(code).toEqual(code.toUpperCase());
  });

  test('produces no special characters or spaces', () => {
    const code = generatePickupCode();
    expect(code).toMatch(/^[A-Z0-9-]+$/);
  });

  test('length is exactly 20 characters (SL-XXXXXXXX-XXXXXXXX)', () => {
    const code = generatePickupCode();
    expect(code.length).toBe(20);
  });
});
