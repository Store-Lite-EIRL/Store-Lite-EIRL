// ──────────────────────────────────────────
// Order Attachments Service
// Max 3 attachments per order. Typed by attachment type.
// ──────────────────────────────────────────

import { db } from '@/core/database/client';
import { orderAttachments } from '@/core/database/schema/orders';
import { and, count, eq } from 'drizzle-orm';
import type { OrderAttachmentType } from './order-types';

export const MAX_ATTACHMENTS = 3;

export interface UploadAttachmentParams {
  orderId: string;
  fileUrl: string;
  fileName: string;
  attachmentType: OrderAttachmentType;
}

export interface UploadAttachmentResult {
  success: true;
  attachment: typeof orderAttachments.$inferSelect;
}

export interface UploadAttachmentError {
  success: false;
  error: string;
}

/**
 * Upload an attachment for an order.
 * Enforces the max-3-per-order constraint.
 */
export async function uploadAttachment(
  params: UploadAttachmentParams,
): Promise<UploadAttachmentResult | UploadAttachmentError> {
  // Count existing attachments
  const [result] = await db
    .select({ total: count() })
    .from(orderAttachments)
    .where(eq(orderAttachments.orderId, params.orderId));

  if (result.total >= MAX_ATTACHMENTS) {
    return {
      success: false,
      error: `Máximo ${MAX_ATTACHMENTS} archivos adjuntos por pedido`,
    };
  }

  const [attachment] = await db
    .insert(orderAttachments)
    .values({
      orderId: params.orderId,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      attachmentType: params.attachmentType,
    })
    .returning();

  return { success: true, attachment };
}

/**
 * List all attachments for an order, ordered oldest-first.
 */
export async function listAttachments(
  orderId: string,
): Promise<(typeof orderAttachments.$inferSelect)[]> {
  return db.query.orderAttachments.findMany({
    where: (attachments, { eq }) => eq(attachments.orderId, orderId),
    orderBy: (attachments, { asc }) => [asc(attachments.createdAt)],
  });
}

/**
 * Delete a single attachment by ID (if it belongs to the given order).
 */
export async function deleteAttachment(
  attachmentId: string,
  orderId: string,
): Promise<{ success: boolean }> {
  const [deleted] = await db
    .delete(orderAttachments)
    .where(
      and(eq(orderAttachments.id, attachmentId), eq(orderAttachments.orderId, orderId)),
    )
    .returning({ id: orderAttachments.id });

  return { success: !!deleted };
}
