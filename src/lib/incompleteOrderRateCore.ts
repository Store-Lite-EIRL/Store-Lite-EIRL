// =====================================================
// INCOMPLETE ORDER RATE - PURE LOGIC (No DB Dependencies)
// =====================================================
// Calculates rolling 30-day incomplete order rate for a business.
// Feature flag: ENABLE_AUTO_DEACTIVATION
// =====================================================

export const INCOMPLETE_ORDER_THRESHOLD = 40; // percentage (40%)

export interface OrderRateResult {
  totalOrders: number;
  incompleteOrders: number;
  incompleteRate: number; // percentage * 100 (e.g., 4000 = 40.00%)
  exceedsThreshold: boolean;
}

/**
 * Calculate incomplete order rate from order counts (pure function)
 */
export function calculateIncompleteRate(
  totalOrders: number,
  incompleteOrders: number,
): OrderRateResult {
  if (totalOrders === 0) {
    return {
      totalOrders: 0,
      incompleteOrders: 0,
      incompleteRate: 0,
      exceedsThreshold: false,
    };
  }

  // Rate as integer percentage * 100 for precision (e.g., 40.00% = 4000)
  const incompleteRate = Math.round((incompleteOrders / totalOrders) * 10000);

  return {
    totalOrders,
    incompleteOrders,
    incompleteRate,
    exceedsThreshold: incompleteRate > INCOMPLETE_ORDER_THRESHOLD * 100,
  };
}

/**
 * Check if rate exceeds threshold
 */
export function exceedsIncompleteOrderThreshold(incompleteRate: number): boolean {
  return incompleteRate > INCOMPLETE_ORDER_THRESHOLD * 100;
}

/**
 * Get 30-day window start date
 */
export function get30DayWindowStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

/**
 * Order statuses considered "incomplete" for deactivation purposes
 * These are orders that were not successfully completed
 */
export const INCOMPLETE_ORDER_STATUSES = [
  'pending',
  'paid',
  'validando',
  'not_delivered',
  'delivered',
  'en_reparto',
  'esperando_confirmacion',
  'disputed',
  'refund_requested',
  'refunded',
  'failed',
  'cancelled',
] as const;

export type IncompleteOrderStatus = (typeof INCOMPLETE_ORDER_STATUSES)[number];

/**
 * Order statuses considered "complete" (successfully finished)
 */
export const COMPLETE_ORDER_STATUSES = ['completed'] as const;

export type CompleteOrderStatus = (typeof COMPLETE_ORDER_STATUSES)[number];

/**
 * Check if an order status is incomplete
 */
export function isIncompleteOrderStatus(status: string): boolean {
  return INCOMPLETE_ORDER_STATUSES.includes(status as IncompleteOrderStatus);
}

/**
 * Check if an order status is complete
 */
export function isCompleteOrderStatus(status: string): boolean {
  return COMPLETE_ORDER_STATUSES.includes(status as CompleteOrderStatus);
}
