// ──────────────────────────────────────────
// OrderService — facade for order status transitions
// Orchestrates: state machine validation → version-locked update → timeline recording
// Handles legacy→V2 status mapping for backward compatibility
// ──────────────────────────────────────────

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, eq } from 'drizzle-orm';

import type { OrderStatusV2, TransitionInput } from './order-status';
import { ORDER_STATUS_V2 } from './order-status';
import {
  InvalidTransitionError,
  ForbiddenActorError,
  validateTransitionFull,
} from './order-state-machine';
import { recordEvent } from './order-timeline';
import { generatePickupCode } from './order-pickup';
import { mapToNewStatus } from './order-status-mapping';
import type { OrderTimelineEventType } from './order-types';

// ─── Error types ───
export class VersionConflictError extends Error {
  constructor(paymentId: string) {
    super(`Version conflict for payment ${paymentId}`);
    this.name = 'VersionConflictError';
  }
}

// ─── Result type ───
export interface TransitionResult {
  success: true;
  payment: typeof payments.$inferSelect;
  eventId: string;
}

export interface TransitionError {
  success: false;
  error: string;
}

// ─── OrderService ───

/**
 * Execute a status transition with full validation and timeline recording.
 *
 * The service reads the current payment from the DB, maps its legacy status
 * to V2 (if needed), validates the transition via the state machine,
 * performs a version-locked update, and records a timeline event.
 *
 * @param input - Transition input with paymentId, toStatus (V2), actor info, etc.
 * @returns TransitionResult on success, TransitionError on failure
 */
export async function transition(
  input: TransitionInput,
): Promise<TransitionResult | TransitionError> {
  try {
    // 1. Read current payment
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);

    if (!payment) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    // 2. Map legacy status to V2 if needed
    const fromStatus = mapToNewStatus(payment.status as string);
    if (!fromStatus) {
      return {
        success: false,
        error: `Estado actual desconocido: ${payment.status}`,
      };
    }

    // 3. Validate transition via state machine
    const validation = validateTransitionFull(
      fromStatus,
      input.toStatus,
      { actor: input.actor, preconditions: input.preconditions },
    );

    if (!validation.valid) {
      if (validation.error?.includes('not permitted') || validation.error?.includes('not allowed')) {
        throw new ForbiddenActorError(fromStatus, input.toStatus, input.actor.type);
      }
      throw new InvalidTransitionError(fromStatus, input.toStatus, validation.error ?? 'Error de validación');
    }

    // 4. Pre-hooks
    const metadata: Record<string, unknown> = { ...input.metadata };
    const updateData: Record<string, unknown> = {
      status: input.toStatus,
      version: (payment.version ?? 0) + 1,
      updatedAt: new Date(),
      ...input.extraFields, // merge caller-provided extra fields (e.g. ticketImageUrl)
    };

    // Pre-hook: generate pickup code when transitioning to IN_TRANSIT
    if (input.toStatus === ORDER_STATUS_V2.IN_TRANSIT) {
      const code = generatePickupCode();
      updateData.pickupCode = code;
      metadata.pickupCode = code;
    }

    // Pre-hook: set courier/tracking info when transitioning to WAITING_CUSTOMER_CONFIRMATION
    if (input.toStatus === ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION) {
      const pre = input.preconditions ?? {};
      if (pre.courierName) updateData.courierName = pre.courierName;
      if (pre.trackingNumber) updateData.trackingNumber = pre.trackingNumber;
      if (pre.shippingCost) updateData.shippingCost = pre.shippingCost;
      if (pre.sellerNote) updateData.sellerNote = pre.sellerNote;
    }

    // 5. Version-locked update
    const [updated] = await db
      .update(payments)
      .set(updateData)
      .where(
        and(eq(payments.id, input.paymentId), eq(payments.version, payment.version ?? 0)),
      )
      .returning();

    if (!updated) {
      throw new VersionConflictError(input.paymentId);
    }

    // 6. Record timeline event
    const event = await recordEvent({
      orderId: input.paymentId,
      eventType: mapTransitionToEvent(fromStatus, input.toStatus),
      actorType: input.actor.type,
      actorId: input.actor.id,
      metadata: { fromStatus, toStatus: input.toStatus, ...metadata },
    });

    return { success: true, payment: updated, eventId: event.id };
  } catch (error) {
    if (error instanceof VersionConflictError || error instanceof InvalidTransitionError || error instanceof ForbiddenActorError) {
      return { success: false, error: error.message };
    }
    console.error('[OrderService.transition] Error:', error);
    return { success: false, error: 'Error al actualizar el estado del pedido' };
  }
}

// ─── Helper: map from→to to a timeline event type ───
function mapTransitionToEvent(from: OrderStatusV2, to: OrderStatusV2): OrderTimelineEventType {
  // Main flow transitions
  if (to === ORDER_STATUS_V2.PAID) return 'ORDER_PAID';
  if (to === ORDER_STATUS_V2.PREPARING_ORDER) return 'ORDER_PREPARING';
  if (to === ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION) return 'SHIPPING_PAYMENT_PENDING';
  if (to === ORDER_STATUS_V2.READY_TO_SHIP) {
    return from === ORDER_STATUS_V2.ISSUE_REPORTED ? 'CUSTOMER_CONFIRMED' : 'ORDER_READY_TO_SHIP';
  }
  if (to === ORDER_STATUS_V2.IN_TRANSIT) return 'ORDER_IN_TRANSIT';
  if (to === ORDER_STATUS_V2.DELIVERED) return 'ORDER_DELIVERED';
  if (to === ORDER_STATUS_V2.COMPLETED) return 'ORDER_COMPLETED';

  // Issue flow
  if (to === ORDER_STATUS_V2.ISSUE_REPORTED) return 'CUSTOMER_REPORTED_ISSUE';
  if (to === ORDER_STATUS_V2.DISPUTE) return 'DISPUTE_CREATED';

  // Cancellation
  if (to === ORDER_STATUS_V2.CANCELLED) return 'ORDER_CANCELLED';

  // Timeouts
  if (to === ORDER_STATUS_V2.SELLER_TIMEOUT) return 'SELLER_TIMEOUT';

  // Fallback (should be unreachable for valid V2 statuses)
  return `ORDER_${to}` as OrderTimelineEventType;
}
