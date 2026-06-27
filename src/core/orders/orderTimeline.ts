// ──────────────────────────────────────────
// Order Timeline Service
// Append-only typed event recording
// ──────────────────────────────────────────

import { db } from '@/core/database/client';
import { orderTimelineEvents } from '@/core/database/schema/orders';
import type { ActorType } from './orderStatus';
import type { OrderTimelineEventType } from './orderTypes';

export interface RecordEventParams {
  orderId: string;
  eventType: OrderTimelineEventType;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a typed timeline event.
 * This is append-only — no validation of event ordering.
 */
export async function recordEvent(
  params: RecordEventParams,
): Promise<typeof orderTimelineEvents.$inferSelect> {
  const [event] = await db
    .insert(orderTimelineEvents)
    .values({
      orderId: params.orderId,
      eventType: params.eventType,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      metadata: (params.metadata ?? {}) as Record<string, unknown>,
    })
    .returning();

  return event;
}

/**
 * Get all timeline events for an order, ordered newest-first.
 */
export async function getTimeline(
  orderId: string,
): Promise<(typeof orderTimelineEvents.$inferSelect)[]> {
  return db.query.orderTimelineEvents.findMany({
    where: (events, { eq }) => eq(events.orderId, orderId),
    orderBy: (events, { desc }) => [desc(events.createdAt)],
  });
}
