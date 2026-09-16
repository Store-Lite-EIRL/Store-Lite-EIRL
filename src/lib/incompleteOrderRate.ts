// =====================================================
// INCOMPLETE ORDER RATE ENGINE
// =====================================================
// Calculates rolling 30-day incomplete order rate for a business.
// Triggers auto-deactivation if rate > 40%.
// Feature flag: ENABLE_AUTO_DEACTIVATION
// =====================================================

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, eq, gte } from 'drizzle-orm';

import {
  calculateIncompleteRate,
  get30DayWindowStart,
  isIncompleteOrderStatus,
  type OrderRateResult,
} from './incompleteOrderRateCore';

export type { OrderRateResult };

export {
  calculateIncompleteRate,
  COMPLETE_ORDER_STATUSES,
  exceedsIncompleteOrderThreshold,
  get30DayWindowStart,
  INCOMPLETE_ORDER_STATUSES,
  INCOMPLETE_ORDER_THRESHOLD,
  isCompleteOrderStatus,
  isIncompleteOrderStatus,
} from './incompleteOrderRateCore';

/**
 * Calculate incomplete order rate for a business in the last 30 days.
 * Returns rate and whether it exceeds the 40% threshold.
 */
export async function calculateBusinessIncompleteOrderRate(
  businessId: string,
): Promise<OrderRateResult> {
  // Feature flag guard
  if (process.env.ENABLE_AUTO_DEACTIVATION !== 'true') {
    return {
      totalOrders: 0,
      incompleteOrders: 0,
      incompleteRate: 0,
      exceedsThreshold: false,
    };
  }

  const windowStart = get30DayWindowStart();

  // Get all orders for this business in the last 30 days
  const orders = await db
    .select({
      id: payments.id,
      status: payments.status,
    })
    .from(payments)
    .where(and(eq(payments.businessId, businessId), gte(payments.createdAt, windowStart)));

  const totalOrders = orders.length;
  const incompleteOrders = orders.filter((o) => isIncompleteOrderStatus(o.status)).length;

  return calculateIncompleteRate(totalOrders, incompleteOrders);
}

/**
 * Check if business should be deactivated due to incomplete order rate
 */
export async function checkIncompleteOrderDeactivation(
  businessId: string,
): Promise<{ shouldDeactivate: boolean; rate: OrderRateResult }> {
  const rate = await calculateBusinessIncompleteOrderRate(businessId);
  return {
    shouldDeactivate: rate.exceedsThreshold,
    rate,
  };
}
