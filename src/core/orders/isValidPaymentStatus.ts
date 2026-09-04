import { ORDER_STATUS, ORDER_STATUS_INTERNAL, ORDER_STATUS_V2 } from './orderStatus';

const ALL_PAYMENT_STATUSES = new Set<string>([
  ...Object.values(ORDER_STATUS),
  ...Object.values(ORDER_STATUS_INTERNAL),
  ...Object.values(ORDER_STATUS_V2),
]);

/**
 * Check if a string is a recognized payment status (legacy or V2).
 * Pure function — no side effects, never throws.
 */
export function isValidPaymentStatus(status: string): boolean {
  return ALL_PAYMENT_STATUSES.has(status);
}
