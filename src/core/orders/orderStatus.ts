// ──────────────────────────────────────────
// Order Status — typed constants
// Current legacy statuses used across the codebase.
// Will be expanded in Batch 1 with new OrderStatus enum.
// ──────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  VALIDANDO: 'validando',
  DELIVERED: 'delivered',
  NOT_DELIVERED: 'not_delivered',
  EN_REPARTO: 'en_reparto',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  FAILED: 'failed',
  REFUND_REQUESTED: 'refund_requested',
  REFUNDED: 'refunded',
} as const satisfies Record<string, string>;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// ─── Internal / transitional statuses ───
export const ORDER_STATUS_INTERNAL = {
  ACEPTADO: 'aceptado',
  RECHAZADO: 'rechazado',
} as const satisfies Record<string, string>;

// ─── Display/return labels ───
export const ORDER_STATUS_LABELS = {
  ESPERANDO_CONFIRMACION: 'esperando_confirmacion',
  FINALIZADO: 'finalizado',
  REPORTE: 'reporte',
} as const satisfies Record<string, string>;

// ──────────────────────────────────────────
// Order Status V2 — new 12-state lifecycle (from flow-order.md)
// ──────────────────────────────────────────

export const ORDER_STATUS_V2 = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  PREPARING_ORDER: 'PREPARING_ORDER',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  WAITING_CUSTOMER_CONFIRMATION: 'WAITING_CUSTOMER_CONFIRMATION',
  READY_TO_SHIP: 'READY_TO_SHIP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  ISSUE_REPORTED: 'ISSUE_REPORTED',
  DISPUTE: 'DISPUTE',
  SELLER_TIMEOUT: 'SELLER_TIMEOUT',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<string, string>;

export type OrderStatusV2 = (typeof ORDER_STATUS_V2)[keyof typeof ORDER_STATUS_V2];

// ─── Actor types ───
export type ActorType = 'customer' | 'seller' | 'system';

// ─── Transition input ───
export interface TransitionInput {
  paymentId: string;
  toStatus: OrderStatusV2;
  actor: { type: ActorType; id?: string };
  expectedVersion: number;
  metadata?: Record<string, unknown>;
  preconditions?: Record<string, unknown>;
  /** Extra fields to write on the payment row alongside the status update (e.g. ticketImageUrl) */
  extraFields?: Record<string, unknown>;
}

// ─── Status groups ───

/** Statuses where the customer can confirm delivery */
export const CONFIRMABLE_STATUSES: readonly string[] = [
  ORDER_STATUS.NOT_DELIVERED,
  ORDER_STATUS.EN_REPARTO,
  ORDER_STATUS_V2.DELIVERED,
];

/** Statuses where the seller can upload a ticket */
export const TICKET_UPLOADABLE_STATUSES: readonly string[] = [
  ORDER_STATUS.VALIDANDO,
  ORDER_STATUS.DISPUTED,
];
