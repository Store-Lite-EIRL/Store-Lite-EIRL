// =====================================================
// URBANO_STATUS_MAP / OrderItem — Unit tests
// =====================================================
// Verifies the shared types and constants file exports
// correctly and contains the superset status map.

import type { OrderItem } from '@/lib/types/orderStatus';
import { DB_STATUS_FILTERS, URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { describe, expect, test } from 'vitest';

describe('URBANO_STATUS_MAP', () => {
  test('is a non-empty record', () => {
    const keys = Object.keys(URBANO_STATUS_MAP);
    expect(keys.length).toBeGreaterThan(20);
  });

  test('contains legacy V1 status "pending"', () => {
    expect(URBANO_STATUS_MAP.pending).toBeDefined();
  });

  test('contains legacy V1 status "expired"', () => {
    expect(URBANO_STATUS_MAP.expired).toBeDefined();
  });

  test('contains V2 status "CREATED"', () => {
    expect(URBANO_STATUS_MAP.CREATED).toBeDefined();
  });

  test('contains V2 status "CANCELLED"', () => {
    expect(URBANO_STATUS_MAP.CANCELLED).toBeDefined();
  });

  test('each entry has correct UrbanoStatusInfo shape', () => {
    for (const entry of Object.values(URBANO_STATUS_MAP)) {
      expect(typeof entry.label).toBe('string');
      expect(typeof entry.className).toBe('string');
      expect(typeof entry.progress).toBe('number');
      expect(entry.progress).toBeGreaterThanOrEqual(0);
      expect(entry.progress).toBeLessThanOrEqual(100);
      expect(typeof entry.icon).toBe('string');
      expect(typeof entry.lucideIcon).toMatch(/^(function|object)$/);
    }
  });

  test('all DB_STATUS_FILTERS keys exist in the map', () => {
    for (const key of DB_STATUS_FILTERS) {
      expect(URBANO_STATUS_MAP[key]).toBeDefined();
    }
  });

  test('progress values are correct for known statuses', () => {
    expect(URBANO_STATUS_MAP.pending.progress).toBe(5);
    expect(URBANO_STATUS_MAP.completed.progress).toBe(100);
    expect(URBANO_STATUS_MAP.failed.progress).toBe(0);
  });
});

describe('DB_STATUS_FILTERS', () => {
  test('is a non-empty array', () => {
    expect(DB_STATUS_FILTERS.length).toBeGreaterThan(0);
  });

  test('contains expected filter values', () => {
    expect(DB_STATUS_FILTERS).toContain('pending');
    expect(DB_STATUS_FILTERS).toContain('paid');
    expect(DB_STATUS_FILTERS).toContain('completed');
    expect(DB_STATUS_FILTERS).toContain('delivered');
    expect(DB_STATUS_FILTERS).toContain('refunded');
  });
});

describe('OrderItem type', () => {
  test('type can be referenced (compile-time check via variable)', () => {
    // This is a compile-time verification that the type exports exist.
    // The actual type check happens during pnpm type-check.
    const item: OrderItem = {
      id: 'test-id',
      orderNumber: 'ORD-001',
      productId: 'prod-1',
      productTitle: 'Test',
      productSlug: 'test',
      productImage: null,
      amount: '100',
      currency: 'PEN',
      paymentMethod: 'card',
      status: 'paid',
      shippingAddress: null,
      shippingDistrict: null,
      shippingProvince: null,
      shippingDepartment: null,
      shippingType: null,
      shippingAgency: null,
      shippingReference: null,
      shippingPhone: null,
      buyerEmail: null,
      maskedDni: '12345678',
      ticketImageUrl: null,
      finalizationDeadline: null,
      completedAt: null,
      courierName: null,
      trackingNumber: null,
      pickupCode: null,
      trackingToken: null,
      sellerNote: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      businessId: 'biz-1',
    };
    expect(item.id).toBe('test-id');
    expect(item.orderNumber).toBe('ORD-001');
  });
});
