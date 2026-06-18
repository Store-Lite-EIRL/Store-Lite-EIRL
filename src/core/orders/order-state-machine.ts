// ──────────────────────────────────────────
// Order State Machine
// Static adjacency matrix for all 14 transitions (T1–T14)
// Validates: from → to, actor permissions, preconditions
// ──────────────────────────────────────────

import type { ActorType, OrderStatusV2, TransitionInput } from './order-status';
import { ORDER_STATUS_V2 } from './order-status';

// ─── Error types ───
export class InvalidTransitionError extends Error {
  constructor(from: string, to: string, reason: string) {
    super(`Invalid transition ${from} → ${to}: ${reason}`);
    this.name = 'InvalidTransitionError';
  }
}

export class ForbiddenActorError extends Error {
  constructor(from: string, to: string, actor: string) {
    super(`Actor "${actor}" not allowed for transition ${from} → ${to}`);
    this.name = 'ForbiddenActorError';
  }
}

export class PreconditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreconditionError';
  }
}

// ─── Transition config ───
interface TransitionConfig {
  /** Allowed target statuses */
  to: OrderStatusV2[];
  /** Actors permitted to perform this transition */
  allowedActors: ActorType[];
}

// ─── Adjacency matrix ───
// Each source status lists its allowed transitions
const TRANSITION_MATRIX: Record<OrderStatusV2, TransitionConfig> = {
  [ORDER_STATUS_V2.CREATED]: {
    to: [ORDER_STATUS_V2.PAID, ORDER_STATUS_V2.CANCELLED],
    allowedActors: ['system', 'customer'],
  },
  [ORDER_STATUS_V2.PAID]: {
    to: [
      ORDER_STATUS_V2.PREPARING_ORDER,
      ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
      ORDER_STATUS_V2.CANCELLED,
    ],
    allowedActors: ['system', 'customer', 'seller'],
  },
  [ORDER_STATUS_V2.PREPARING_ORDER]: {
    to: [
      ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
      ORDER_STATUS_V2.DELIVERED,          // migration path: legacy 'aceptado' → finalization
      ORDER_STATUS_V2.SELLER_TIMEOUT,
      ORDER_STATUS_V2.CANCELLED,
    ],
    allowedActors: ['seller', 'system'],
  },
  [ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION]: {
    to: [
      ORDER_STATUS_V2.READY_TO_SHIP,
      ORDER_STATUS_V2.ISSUE_REPORTED,
      ORDER_STATUS_V2.CANCELLED,
    ],
    // READY_TO_SHIP can be customer (confirm) or system (auto-approve timeout)
    // ISSUE_REPORTED can be customer
    allowedActors: ['customer', 'system'],
  },
  [ORDER_STATUS_V2.READY_TO_SHIP]: {
    to: [ORDER_STATUS_V2.IN_TRANSIT, ORDER_STATUS_V2.ISSUE_REPORTED],
    allowedActors: ['seller', 'customer'],
  },
  [ORDER_STATUS_V2.IN_TRANSIT]: {
    to: [ORDER_STATUS_V2.DELIVERED, ORDER_STATUS_V2.ISSUE_REPORTED],
    allowedActors: ['seller', 'customer'],
  },
  [ORDER_STATUS_V2.DELIVERED]: {
    to: [ORDER_STATUS_V2.COMPLETED, ORDER_STATUS_V2.ISSUE_REPORTED],
    allowedActors: ['system', 'customer'],
  },
  [ORDER_STATUS_V2.COMPLETED]: {
    to: [],
    allowedActors: [],
  },
  [ORDER_STATUS_V2.ISSUE_REPORTED]: {
    to: [
      ORDER_STATUS_V2.DISPUTE,
      ORDER_STATUS_V2.READY_TO_SHIP,
      ORDER_STATUS_V2.DELIVERED,
      ORDER_STATUS_V2.CANCELLED,
    ],
    allowedActors: ['customer', 'seller', 'system'],
  },
  [ORDER_STATUS_V2.DISPUTE]: {
    to: [],
    allowedActors: [],
  },
  [ORDER_STATUS_V2.SELLER_TIMEOUT]: {
    to: [],
    allowedActors: [],
  },
  [ORDER_STATUS_V2.CANCELLED]: {
    to: [],
    allowedActors: [],
  },
};

// ─── Validation result ───
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Validation ───

/**
 * Check whether a transition from → to is defined in the matrix.
 */
export function isValidTransition(from: OrderStatusV2, to: OrderStatusV2): boolean {
  const config = TRANSITION_MATRIX[from];
  if (!config) return false;
  return config.to.includes(to);
}

/**
 * Validate transition + actor permission.
 */
export function validateTransition(
  from: OrderStatusV2,
  to: OrderStatusV2,
  actor: ActorType,
): ValidationResult {
  const config = TRANSITION_MATRIX[from];
  if (!config) {
    return { valid: false, error: `Unknown source status: ${from}` };
  }

  if (!config.to.includes(to)) {
    return { valid: false, error: `Transition from ${from} to ${to} is not allowed` };
  }

  if (!config.allowedActors.includes(actor)) {
    return {
      valid: false,
      error: `Actor "${actor}" is not permitted for transition ${from} → ${to}`,
    };
  }

  return { valid: true };
}

/**
 * Full validation including preconditions from TransitionInput.
 */
export function validateTransitionFull(
  from: OrderStatusV2,
  to: OrderStatusV2,
  input: Pick<TransitionInput, 'actor' | 'preconditions'>,
): ValidationResult {
  const base = validateTransition(from, to, input.actor.type);
  if (!base.valid) return base;

  // Actor-specific preconditions
  if (to === ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION && input.actor.type === 'seller') {
    const pre = input.preconditions ?? {};
    if (!pre.courierName && !pre.trackingNumber && !pre.shippingCost) {
      return {
        valid: false,
        error: 'Seller must provide courierName, trackingNumber, and shippingCost',
      };
    }
  }

  return { valid: true };
}

/**
 * Get all allowed transitions for a given status.
 */
export function getAllowedTransitions(
  status: OrderStatusV2,
  actor?: ActorType,
): { to: OrderStatusV2; actor: ActorType }[] {
  const config = TRANSITION_MATRIX[status];
  if (!config) return [];

  return config.to
    .filter((to) => !actor || config.allowedActors.includes(actor))
    .map((to) => ({ to, actor: actor ?? config.allowedActors[0] }));
}
