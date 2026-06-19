// ──────────────────────────────────────────
// Order Status Mapping
// Legacy (current DB) ↔ New (order_status_v2 enum) mapping
// ──────────────────────────────────────────

import type { OrderStatusV2 } from './orderStatus';
import { ORDER_STATUS, ORDER_STATUS_INTERNAL, ORDER_STATUS_V2 } from './orderStatus';

/**
 * Legacy Spanish / current status strings → new OrderStatusV2.
 *
 * Note: 'delivered' in legacy means the CUSTOMER confirmed the ticket/shipping info,
 * which maps to READY_TO_SHIP (not PREPARING_ORDER). Use ORDER_STATUS.VALIDANDO
 * for the WAITING_CUSTOMER_CONFIRMATION equivalent.
 *
 * Internal statuses like 'aceptado' map to PREPARING_ORDER for migration compatibility
 * (the seller accepted the order and is preparing it).
 */
const LEGACY_TO_NEW: Record<string, OrderStatusV2> = {
  [ORDER_STATUS.PENDING]: ORDER_STATUS_V2.CREATED,
  [ORDER_STATUS.PAID]: ORDER_STATUS_V2.PAID,
  [ORDER_STATUS.VALIDANDO]: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
  esperando_confirmacion: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
  // 'delivered' = customer confirmed ticket → READY_TO_SHIP
  [ORDER_STATUS.DELIVERED]: ORDER_STATUS_V2.READY_TO_SHIP,
  [ORDER_STATUS.EN_REPARTO]: ORDER_STATUS_V2.IN_TRANSIT,
  [ORDER_STATUS.NOT_DELIVERED]: ORDER_STATUS_V2.DELIVERED,
  [ORDER_STATUS.COMPLETED]: ORDER_STATUS_V2.COMPLETED,
  [ORDER_STATUS.DISPUTED]: ORDER_STATUS_V2.DISPUTE,
  [ORDER_STATUS.FAILED]: ORDER_STATUS_V2.PAID,
  [ORDER_STATUS.REFUND_REQUESTED]: ORDER_STATUS_V2.CANCELLED,
  [ORDER_STATUS.REFUNDED]: ORDER_STATUS_V2.CANCELLED,
  // Internal statuses for migration compatibility
  [ORDER_STATUS_INTERNAL.ACEPTADO]: ORDER_STATUS_V2.PREPARING_ORDER,
};

/**
 * New OrderStatusV2 → primary legacy mapping (for backwards-compatible reads).
 */
const NEW_TO_LEGACY: Partial<Record<OrderStatusV2, string>> = {
  [ORDER_STATUS_V2.CREATED]: ORDER_STATUS.PENDING,
  [ORDER_STATUS_V2.PAID]: ORDER_STATUS.PAID,
  [ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION]: ORDER_STATUS.VALIDANDO,
  [ORDER_STATUS_V2.PREPARING_ORDER]: ORDER_STATUS_INTERNAL.ACEPTADO,
  [ORDER_STATUS_V2.READY_TO_SHIP]: ORDER_STATUS.DELIVERED,
  [ORDER_STATUS_V2.IN_TRANSIT]: ORDER_STATUS.EN_REPARTO,
  [ORDER_STATUS_V2.DELIVERED]: ORDER_STATUS.NOT_DELIVERED,
  [ORDER_STATUS_V2.COMPLETED]: ORDER_STATUS.COMPLETED,
  [ORDER_STATUS_V2.DISPUTE]: ORDER_STATUS.DISPUTED,
};

/**
 * Map a legacy status string to its new OrderStatusV2 equivalent.
 * Returns undefined if the status is already a V2 value or unknown.
 */
export function mapToNewStatus(legacyStatus: string): OrderStatusV2 | undefined {
  // If it's already a V2 value, return as-is
  const v2Values = Object.values(ORDER_STATUS_V2) as string[];
  if (v2Values.includes(legacyStatus)) {
    return legacyStatus as OrderStatusV2;
  }

  return LEGACY_TO_NEW[legacyStatus];
}

/**
 * Map a new OrderStatusV2 to its primary legacy equivalent for display compatibility.
 */
export function mapToLegacyStatus(newStatus: OrderStatusV2): string | undefined {
  return NEW_TO_LEGACY[newStatus];
}

/**
 * Check if a status string is a legacy (non-V2) value.
 */
export function isLegacyStatus(status: string): boolean {
  const v2Values = new Set(Object.values(ORDER_STATUS_V2) as string[]);
  return !v2Values.has(status);
}

/**
 * Get all known legacy status strings.
 */
export function getLegacyStatuses(): string[] {
  return Object.keys(LEGACY_TO_NEW);
}
