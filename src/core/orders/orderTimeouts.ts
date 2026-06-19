// ──────────────────────────────────────────
// Order Timeouts
// Auto-transitions for orders past their timeout threshold.
// Called by Vercel Cron (T16) or on-demand.
// ──────────────────────────────────────────

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, lt, or, sql } from 'drizzle-orm';

import { transition } from './orderService';
import type { OrderStatusV2 } from './orderStatus';
import { ORDER_STATUS, ORDER_STATUS_V2 } from './orderStatus';

// ─── Timeout config ───

interface TimeoutRule {
  /** Human-readable label for logging */
  label: string;
  /** Legacy DB status (if migration not applied) */
  legacyStatus: string;
  /** V2 DB status (if migration applied) */
  v2Status: OrderStatusV2;
  /** Target V2 status for the auto-transition */
  toStatus: OrderStatusV2;
  /** Hours since updatedAt after which this timeout applies */
  hours: number;
}

const TIMEOUT_RULES: TimeoutRule[] = [
  {
    label: 'seller-inactivity',
    legacyStatus: ORDER_STATUS.DELIVERED,
    v2Status: ORDER_STATUS_V2.PREPARING_ORDER,
    toStatus: ORDER_STATUS_V2.SELLER_TIMEOUT,
    hours: 48,
  },
  {
    label: 'customer-auto-approve',
    legacyStatus: ORDER_STATUS.VALIDANDO,
    v2Status: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
    toStatus: ORDER_STATUS_V2.READY_TO_SHIP,
    hours: 48,
  },
  {
    label: 'auto-complete',
    legacyStatus: ORDER_STATUS.NOT_DELIVERED,
    v2Status: ORDER_STATUS_V2.DELIVERED,
    toStatus: ORDER_STATUS_V2.COMPLETED,
    hours: 72,
  },
];

// ─── Processor ───

/**
 * Find orders past their timeout threshold and auto-transition them.
 * Matches BOTH legacy and V2 status values for safety.
 *
 * Idempotency: version-locked updates prevent double-processing.
 * If an order was already transitioned, the version mismatch is caught
 * and counted as a non-fatal error.
 */
export async function processTimeouts(): Promise<{
  processed: number;
  errors: number;
}> {
  let processed = 0;
  let errors = 0;

  for (const rule of TIMEOUT_RULES) {
    try {
      const cutoff = new Date(Date.now() - rule.hours * 60 * 60 * 1000);

      // Query orders past threshold — match EITHER legacy or V2 status
      const expired = await db
        .select({ id: payments.id, version: payments.version })
        .from(payments)
        .where(
          and(
            or(
              sql`${payments.status} = ${rule.legacyStatus}`,
              sql`${payments.status} = ${rule.v2Status}`,
            ),
            lt(payments.updatedAt, cutoff),
          ),
        );

      for (const order of expired) {
        try {
          const result = await transition({
            paymentId: order.id,
            toStatus: rule.toStatus,
            actor: { type: 'system' },
            expectedVersion: order.version ?? 0,
            metadata: { timeoutRule: rule.label },
          });

          if (result.success) {
            processed++;
            console.log(`[Timeouts] ${rule.label}: ${order.id} → ${rule.toStatus}`);
          } else {
            errors++;
            console.error(`[Timeouts] ${rule.label}: ${order.id} failed — ${result.error}`);
          }
        } catch (err) {
          errors++;
          console.error(
            `[Timeouts] ${rule.label}: ${order.id} threw — ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch (err) {
      errors++;
      console.error(
        `[Timeouts] Rule "${rule.label}" query failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { processed, errors };
}
