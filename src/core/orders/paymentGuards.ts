import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

/**
 * Payment statuses that indicate a durable financial commitment.
 * Only these statuses lock business identity / product title / price fields.
 *
 * Reversed or contested transactions (disputed, refund_requested, refunded)
 * and failures (failed) do NOT lock — they never durably materialized.
 */
/**
 * Error message shown when a field is frozen due to payment history.
 * Spanish per repo convention.
 */
export const FROZEN_FIELD_MESSAGE =
  'Este campo está bloqueado porque el negocio/producto tiene pagos registrados.';

export const LOCKING_PAYMENT_STATUSES = [
  'pending',
  'validando',
  'paid',
  'completed',
  'delivered',
  'en_reparto',
  'not_delivered',
] as const;

/**
 * Returns true when at least one payment with a locking status exists
 * for the given business or product.
 *
 * Uses an indexed count query for performance.
 *
 * @example
 * ```ts
 * if (await hasLockingPayments({ businessId })) {
 *   return { error: FROZEN_FIELD_MESSAGE };
 * }
 * ```
 */
export async function hasLockingPayments(input: {
  businessId?: string;
  productId?: string;
}): Promise<boolean> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(
      and(
        input.businessId
          ? eq(payments.businessId, input.businessId)
          : eq(payments.productId, input.productId!),
        inArray(payments.status, [...LOCKING_PAYMENT_STATUSES]),
      ),
    );

  return count > 0;
}
