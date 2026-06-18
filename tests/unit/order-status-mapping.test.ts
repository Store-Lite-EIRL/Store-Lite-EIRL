import { describe, expect, test } from 'vitest';
import {
  mapToNewStatus,
  mapToLegacyStatus,
  isLegacyStatus,
  getLegacyStatuses,
} from '@/core/orders/order-status-mapping';
import { ORDER_STATUS_V2 } from '@/core/orders/order-status';

// =====================================================
// ORDER STATUS MAPPING — Unit tests
// =====================================================
// Tests MUST match the actual implementation in order-status-mapping.ts.
// This documents the current mapping behavior, including known gaps.

const C = ORDER_STATUS_V2.CREATED;
const P = ORDER_STATUS_V2.PAID;
const PREP = ORDER_STATUS_V2.PREPARING_ORDER;
const WAIT = ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION;
const TRANSIT = ORDER_STATUS_V2.IN_TRANSIT;
const DEL = ORDER_STATUS_V2.DELIVERED;
const COMP = ORDER_STATUS_V2.COMPLETED;
const DISP = ORDER_STATUS_V2.DISPUTE;
const CANC = ORDER_STATUS_V2.CANCELLED;

describe('mapToNewStatus (legacy → V2)', () => {
  test('maps pending to CREATED', () => {
    expect(mapToNewStatus('pending')).toBe(C);
  });

  test('maps paid to PAID', () => {
    expect(mapToNewStatus('paid')).toBe(P);
  });

  test('maps validando to WAITING_CUSTOMER_CONFIRMATION', () => {
    expect(mapToNewStatus('validando')).toBe(WAIT);
  });

  test('maps esperando_confirmacion to WAITING_CUSTOMER_CONFIRMATION', () => {
    expect(mapToNewStatus('esperando_confirmacion')).toBe(WAIT);
  });

  test('maps delivered to PREPARING_ORDER (legacy delivered = seller preparing)', () => {
    expect(mapToNewStatus('delivered')).toBe(PREP);
  });

  test('maps en_reparto to IN_TRANSIT', () => {
    expect(mapToNewStatus('en_reparto')).toBe(TRANSIT);
  });

  test('maps not_delivered to DELIVERED', () => {
    expect(mapToNewStatus('not_delivered')).toBe(DEL);
  });

  test('maps completed to COMPLETED', () => {
    expect(mapToNewStatus('completed')).toBe(COMP);
  });

  test('maps finalizado to undefined (known gap — not in LEGACY_TO_NEW)', () => {
    expect(mapToNewStatus('finalizado')).toBeUndefined();
  });

  test('maps disputed to DISPUTE', () => {
    expect(mapToNewStatus('disputed')).toBe(DISP);
  });

  test('maps failed to PAID (legacy failed = payment retry)', () => {
    expect(mapToNewStatus('failed')).toBe(P);
  });

  test('maps refund_requested to CANCELLED', () => {
    expect(mapToNewStatus('refund_requested')).toBe(CANC);
  });

  test('maps refunded to CANCELLED', () => {
    expect(mapToNewStatus('refunded')).toBe(CANC);
  });

  test('maps rechazado to undefined (known gap — not in LEGACY_TO_NEW)', () => {
    expect(mapToNewStatus('rechazado')).toBeUndefined();
  });

  // ── Pass-through: V2 statuses return as-is ──
  test('passes through CREATED', () => {
    expect(mapToNewStatus('CREATED')).toBe(C);
  });

  test('passes through PAID', () => {
    expect(mapToNewStatus('PAID')).toBe(P);
  });

  // ── Known gaps (not in LEGACY_TO_NEW): return undefined ──
  test.each([
    'processing', 'aceptado', 'shipped', 'analizando',
  ])('maps %s to undefined (known gap — no mapping defined)', (status) => {
    expect(mapToNewStatus(status)).toBeUndefined();
  });

  test('returns undefined for unknown legacy status', () => {
    expect(mapToNewStatus('nonexistent')).toBeUndefined();
  });

  test('returns undefined for empty string', () => {
    expect(mapToNewStatus('')).toBeUndefined();
  });
});

describe('mapToLegacyStatus (V2 → legacy)', () => {
  test('maps CREATED to pending', () => {
    expect(mapToLegacyStatus(C)).toBe('pending');
  });

  test('maps PAID to paid', () => {
    expect(mapToLegacyStatus(P)).toBe('paid');
  });

  test('maps WAITING_CUSTOMER_CONFIRMATION to validando', () => {
    expect(mapToLegacyStatus(WAIT)).toBe('validando');
  });

  test('maps PREPARING_ORDER to delivered (V2 preparing = legacy delivered)', () => {
    expect(mapToLegacyStatus(PREP)).toBe('delivered');
  });

  test('maps IN_TRANSIT to en_reparto', () => {
    expect(mapToLegacyStatus(TRANSIT)).toBe('en_reparto');
  });

  test('maps DELIVERED to not_delivered', () => {
    expect(mapToLegacyStatus(DEL)).toBe('not_delivered');
  });

  test('maps COMPLETED to completed', () => {
    expect(mapToLegacyStatus(COMP)).toBe('completed');
  });

  test('maps DISPUTE to disputed', () => {
    expect(mapToLegacyStatus(DISP)).toBe('disputed');
  });

  // ── V2 statuses with no legacy mapping ──
  test.each([
    ['READY_TO_SHIP', ORDER_STATUS_V2.READY_TO_SHIP],
    ['ISSUE_REPORTED', ORDER_STATUS_V2.ISSUE_REPORTED],
    ['SELLER_TIMEOUT', ORDER_STATUS_V2.SELLER_TIMEOUT],
    ['CANCELLED', CANC],
  ])('maps %s to undefined (no legacy equivalent)', (_label, status) => {
    expect(mapToLegacyStatus(status)).toBeUndefined();
  });

  // ── Round-trip: only bidirectional mappings survive ──
  test('round-trip: paid → PAID → paid', () => {
    expect(mapToLegacyStatus(mapToNewStatus('paid')!)).toBe('paid');
  });

  test('round-trip: pending → CREATED → pending', () => {
    expect(mapToLegacyStatus(mapToNewStatus('pending')!)).toBe('pending');
  });

  test('round-trip: not_delivered → DELIVERED → not_delivered', () => {
    expect(mapToLegacyStatus(mapToNewStatus('not_delivered')!)).toBe('not_delivered');
  });
});

describe('isLegacyStatus', () => {
  test('returns true for "pending"', () => {
    expect(isLegacyStatus('pending')).toBe(true);
  });

  test('returns true for "paid"', () => {
    expect(isLegacyStatus('paid')).toBe(true);
  });

  test('returns true for "validando"', () => {
    expect(isLegacyStatus('validando')).toBe(true);
  });

  test('returns true for unknown string (not a V2 value)', () => {
    expect(isLegacyStatus('nonexistent')).toBe(true);
  });

  test('returns true for empty string', () => {
    expect(isLegacyStatus('')).toBe(true);
  });

  test('returns false for V2 status "CREATED"', () => {
    expect(isLegacyStatus('CREATED')).toBe(false);
  });

  test('returns false for V2 status "PAID"', () => {
    expect(isLegacyStatus('PAID')).toBe(false);
  });

  test('returns false for V2 status "CANCELLED"', () => {
    expect(isLegacyStatus('CANCELLED')).toBe(false);
  });
});

describe('getLegacyStatuses', () => {
  test('returns all keys from LEGACY_TO_NEW map', () => {
    const statuses = getLegacyStatuses();
    expect(statuses).toContain('pending');
    expect(statuses).toContain('paid');
    expect(statuses).toContain('validando');
    expect(statuses).toContain('esperando_confirmacion');
    expect(statuses).toContain('delivered');
    expect(statuses).toContain('en_reparto');
    expect(statuses).toContain('not_delivered');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('disputed');
    expect(statuses).toContain('failed');
    expect(statuses).toContain('refund_requested');
    expect(statuses).toContain('refunded');
    expect(statuses.length).toBe(12);
  });

  test('every returned status passes isLegacyStatus', () => {
    for (const s of getLegacyStatuses()) {
      expect(isLegacyStatus(s)).toBe(true);
    }
  });
});
