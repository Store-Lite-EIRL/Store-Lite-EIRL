import {
  getAllowedTransitions,
  isValidTransition,
  validateTransition,
  validateTransitionFull,
} from '@/core/orders/orderStateMachine';
import { ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { describe, expect, test } from 'vitest';

// =====================================================
// ORDER STATE MACHINE — Unit tests
// =====================================================
// Tests the adjacency matrix: all 14 transitions, actors, preconditions

const ALL_STATUSES = Object.values(ORDER_STATUS_V2) as string[];
const CANCELLED = ORDER_STATUS_V2.CANCELLED;
const CREATED = ORDER_STATUS_V2.CREATED;
const PAID = ORDER_STATUS_V2.PAID;
const PREPARING = ORDER_STATUS_V2.PREPARING_ORDER;
const WAITING = ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION;
const READY = ORDER_STATUS_V2.READY_TO_SHIP;
const TRANSIT = ORDER_STATUS_V2.IN_TRANSIT;
const DELIVERED = ORDER_STATUS_V2.DELIVERED;
const COMPLETED = ORDER_STATUS_V2.COMPLETED;
const ISSUE = ORDER_STATUS_V2.ISSUE_REPORTED;
const DISPUTE = ORDER_STATUS_V2.DISPUTE;
const TIMEOUT = ORDER_STATUS_V2.SELLER_TIMEOUT;

describe('isValidTransition', () => {
  // ── Valid transitions ──
  test('CREATED → PAID is valid', () => {
    expect(isValidTransition(CREATED, PAID)).toBe(true);
  });

  test('CREATED → CANCELLED is valid', () => {
    expect(isValidTransition(CREATED, CANCELLED)).toBe(true);
  });

  test('PAID → PREPARING_ORDER is valid', () => {
    expect(isValidTransition(PAID, PREPARING)).toBe(true);
  });

  test('PAID → WAITING_CUSTOMER_CONFIRMATION is valid (uploadTicket V2 path)', () => {
    expect(isValidTransition(PAID, WAITING)).toBe(true);
  });

  test('PAID → CANCELLED is valid', () => {
    expect(isValidTransition(PAID, CANCELLED)).toBe(true);
  });

  test('PREPARING_ORDER → WAITING_CUSTOMER_CONFIRMATION is valid', () => {
    expect(isValidTransition(PREPARING, WAITING)).toBe(true);
  });

  test('PREPARING_ORDER → DELIVERED is valid (migration path: requestFinalization)', () => {
    expect(isValidTransition(PREPARING, DELIVERED)).toBe(true);
  });

  test('PREPARING_ORDER → SELLER_TIMEOUT is valid', () => {
    expect(isValidTransition(PREPARING, TIMEOUT)).toBe(true);
  });

  test('PREPARING_ORDER → CANCELLED is valid', () => {
    expect(isValidTransition(PREPARING, CANCELLED)).toBe(true);
  });

  test('WAITING_CUSTOMER_CONFIRMATION → READY_TO_SHIP is valid', () => {
    expect(isValidTransition(WAITING, READY)).toBe(true);
  });

  test('WAITING_CUSTOMER_CONFIRMATION → ISSUE_REPORTED is valid', () => {
    expect(isValidTransition(WAITING, ISSUE)).toBe(true);
  });

  test('WAITING_CUSTOMER_CONFIRMATION → CANCELLED is valid', () => {
    expect(isValidTransition(WAITING, CANCELLED)).toBe(true);
  });

  test('READY_TO_SHIP → IN_TRANSIT is valid', () => {
    expect(isValidTransition(READY, TRANSIT)).toBe(true);
  });

  test('READY_TO_SHIP → ISSUE_REPORTED is valid', () => {
    expect(isValidTransition(READY, ISSUE)).toBe(true);
  });

  test('IN_TRANSIT → DELIVERED is valid', () => {
    expect(isValidTransition(TRANSIT, DELIVERED)).toBe(true);
  });

  test('IN_TRANSIT → ISSUE_REPORTED is valid', () => {
    expect(isValidTransition(TRANSIT, ISSUE)).toBe(true);
  });

  test('DELIVERED → COMPLETED is valid', () => {
    expect(isValidTransition(DELIVERED, COMPLETED)).toBe(true);
  });

  test('DELIVERED → ISSUE_REPORTED is valid', () => {
    expect(isValidTransition(DELIVERED, ISSUE)).toBe(true);
  });

  test('ISSUE_REPORTED → DISPUTE is valid', () => {
    expect(isValidTransition(ISSUE, DISPUTE)).toBe(true);
  });

  test('ISSUE_REPORTED → READY_TO_SHIP is valid', () => {
    expect(isValidTransition(ISSUE, READY)).toBe(true);
  });

  test('ISSUE_REPORTED → DELIVERED is valid', () => {
    expect(isValidTransition(ISSUE, DELIVERED)).toBe(true);
  });

  test('ISSUE_REPORTED → CANCELLED is valid', () => {
    expect(isValidTransition(ISSUE, CANCELLED)).toBe(true);
  });

  // ── Terminal states ──
  test.each([COMPLETED, DISPUTE, TIMEOUT, CANCELLED])(
    '%s has no outgoing transitions',
    (terminal) => {
      for (const target of ALL_STATUSES) {
        expect(isValidTransition(terminal as any, target as any)).toBe(false);
      }
    },
  );

  // ── Invalid transitions ──
  test.each([
    [CREATED, PREPARING],
    [CREATED, READY],
    [CREATED, COMPLETED],
    [PAID, READY],
    [PAID, COMPLETED],
    [PREPARING, COMPLETED],
    [READY, COMPLETED],
    [READY, CANCELLED],
    [TRANSIT, COMPLETED],
    [TRANSIT, CANCELLED],
  ])('%s → %s is invalid', (from, to) => {
    expect(isValidTransition(from as any, to as any)).toBe(false);
  });
});

describe('validateTransition (with actor)', () => {
  test('allows seller for PREPARING_ORDER → WAITING_CUSTOMER_CONFIRMATION', () => {
    const result = validateTransition(PREPARING, WAITING, 'seller');
    expect(result.valid).toBe(true);
  });

  test('allows system for PREPARING_ORDER → SELLER_TIMEOUT', () => {
    const result = validateTransition(PREPARING, TIMEOUT, 'system');
    expect(result.valid).toBe(true);
  });

  test('rejects customer for PREPARING_ORDER → WAITING_CUSTOMER_CONFIRMATION', () => {
    const result = validateTransition(PREPARING, WAITING, 'customer');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not permitted');
  });

  test('rejects seller for CREATED → PAID', () => {
    const result = validateTransition(CREATED, PAID, 'seller');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not permitted');
  });

  test('allows seller for PAID → WAITING_CUSTOMER_CONFIRMATION (uploadTicket)', () => {
    const result = validateTransition(PAID, WAITING, 'seller');
    expect(result.valid).toBe(true);
  });

  test('allows seller for PREPARING_ORDER → DELIVERED (requestFinalization)', () => {
    const result = validateTransition(PREPARING, DELIVERED, 'seller');
    expect(result.valid).toBe(true);
  });

  test('allows customer for WAITING → READY_TO_SHIP (confirm)', () => {
    const result = validateTransition(WAITING, READY, 'customer');
    expect(result.valid).toBe(true);
  });

  test('allows system for WAITING → READY_TO_SHIP (auto-approve)', () => {
    const result = validateTransition(WAITING, READY, 'system');
    expect(result.valid).toBe(true);
  });

  test('allows customer for ISSUE_REPORTED (any src)', () => {
    const result = validateTransition(TRANSIT, ISSUE, 'customer');
    expect(result.valid).toBe(true);
  });

  test('allows seller for IN_TRANSIT → DELIVERED', () => {
    const result = validateTransition(TRANSIT, DELIVERED, 'seller');
    expect(result.valid).toBe(true);
  });

  test('rejects seller for DELIVERED → COMPLETED', () => {
    const result = validateTransition(DELIVERED, COMPLETED, 'seller');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not permitted');
  });

  test('allows system for DELIVERED → COMPLETED', () => {
    const result = validateTransition(DELIVERED, COMPLETED, 'system');
    expect(result.valid).toBe(true);
  });

  test('returns error for unknown source status', () => {
    const result = validateTransition('UNKNOWN' as any, PAID, 'system');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unknown source status');
  });
});

describe('validateTransitionFull (with preconditions)', () => {
  test('seller must provide courier info for WAITING_CUSTOMER_CONFIRMATION', () => {
    const result = validateTransitionFull(PREPARING, WAITING, {
      actor: { type: 'seller' },
      preconditions: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must provide');
  });

  test('seller with courierName passes precondition check', () => {
    const result = validateTransitionFull(PREPARING, WAITING, {
      actor: { type: 'seller' },
      preconditions: { courierName: 'Transportes Rápidos' },
    });
    expect(result.valid).toBe(true);
  });

  test('seller with trackingNumber passes precondition check', () => {
    const result = validateTransitionFull(PREPARING, WAITING, {
      actor: { type: 'seller' },
      preconditions: { trackingNumber: 'TRACK-123' },
    });
    expect(result.valid).toBe(true);
  });

  test('seller with shippingCost passes precondition check', () => {
    const result = validateTransitionFull(PREPARING, WAITING, {
      actor: { type: 'seller' },
      preconditions: { shippingCost: '15.00' },
    });
    expect(result.valid).toBe(true);
  });

  test('system bypasses precondition check', () => {
    const result = validateTransitionFull(PREPARING, WAITING, {
      actor: { type: 'system' },
      preconditions: {},
    });
    expect(result.valid).toBe(true);
  });

  test('invalid base transition still fails', () => {
    const result = validateTransitionFull(PREPARING, COMPLETED, {
      actor: { type: 'system' },
      preconditions: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});

describe('getAllowedTransitions', () => {
  test('CREATED returns PAID and CANCELLED', () => {
    const result = getAllowedTransitions(CREATED);
    expect(result.map((r) => r.to)).toEqual([PAID, CANCELLED]);
  });

  test('filter by actor: customer can only do CREATED transitions', () => {
    const result = getAllowedTransitions(CREATED, 'customer');
    expect(result.map((r) => r.to)).toEqual([PAID, CANCELLED]);
  });

  test('filter by actor: seller not allowed for CREATED', () => {
    const result = getAllowedTransitions(CREATED, 'seller');
    expect(result).toEqual([]);
  });

  test('PAID returns PREPARING_ORDER, WAITING_CUSTOMER_CONFIRMATION, CANCELLED', () => {
    const result = getAllowedTransitions(PAID);
    expect(result.map((r) => r.to)).toEqual([PREPARING, WAITING, CANCELLED]);
  });

  test('filter by actor: seller allowed for PAID (uploadTicket V2 path)', () => {
    const result = getAllowedTransitions(PAID, 'seller');
    expect(result.map((r) => r.to)).toEqual([PREPARING, WAITING, CANCELLED]);
  });

  test('PREPARING_ORDER returns WAITING, DELIVERED, SELLER_TIMEOUT, CANCELLED', () => {
    const result = getAllowedTransitions(PREPARING);
    expect(result.map((r) => r.to)).toEqual([WAITING, DELIVERED, TIMEOUT, CANCELLED]);
  });

  test('READY_TO_SHIP returns IN_TRANSIT and ISSUE_REPORTED', () => {
    const result = getAllowedTransitions(READY);
    expect(result.map((r) => r.to)).toEqual([TRANSIT, ISSUE]);
  });

  test('terminal states return empty', () => {
    expect(getAllowedTransitions(COMPLETED)).toEqual([]);
    expect(getAllowedTransitions(DISPUTE)).toEqual([]);
    expect(getAllowedTransitions(TIMEOUT)).toEqual([]);
    expect(getAllowedTransitions(CANCELLED)).toEqual([]);
  });
});
