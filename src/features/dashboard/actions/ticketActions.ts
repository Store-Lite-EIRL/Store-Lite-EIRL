'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';

const BUCKET_NAME = 'tickets';

function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export interface UploadTicketResult {
  success: boolean;
  error?: string;
  ticketImageUrl?: string;
  trackingToken?: string;
}

/**
 * Sube la imagen del ticket del courier y actualiza el payment
 * @param paymentId - ID del payment a actualizar
 * @param imageBase64 - Imagen en formato base64
 * @param businessId - ID del negocio (para validar propiedad)
 */
export async function uploadTicketAndUpdatePayment(
  paymentId: string,
  imageBase64: string,
  businessId: string,
): Promise<UploadTicketResult> {
  console.log('[uploadTicket] Starting — paymentId:', paymentId, 'businessId:', businessId);

  try {
    // 1. Obtener el trackingToken y validar que el pago pertenezca al negocio
    const [existingPayment] = await db
      .select({
        trackingToken: payments.trackingToken,
        businessId: payments.businessId,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!existingPayment) {
      console.error('[uploadTicket] Payment not found:', paymentId);
      return { success: false, error: 'Pedido no encontrado' };
    }

    if (existingPayment.businessId !== businessId) {
      console.error(
        '[uploadTicket] Permission denied — expected:',
        businessId,
        'got:',
        existingPayment.businessId,
      );
      return { success: false, error: 'No tienes permisos para este pedido' };
    }

    if (!existingPayment.trackingToken) {
      console.error('[uploadTicket] No trackingToken for payment:', paymentId);
      return { success: false, error: 'El pedido no tiene un token de seguimiento' };
    }

    // 2. Convert base64 to Uint8Array (compatible with Edge runtime)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 3. Generate filename using trackingToken (unique per order)
    const fileName = `${existingPayment.trackingToken}.jpg`;
    const filePath = `${businessId}/${fileName}`;

    // 4. Upload to Supabase Storage
    const adminClient = createAdminClient();

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true, // Sobrescribir si ya existe (para poder editar)
      });

    if (uploadError) {
      console.error('[uploadTicket] Upload error:', uploadError.message);
      return { success: false, error: uploadError.message };
    }

    // 5. Get public URL
    const { data: urlData } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const ticketImageUrl = urlData.publicUrl;

    // 6. Update payment: cambiar estado a 'validando' (ticket subido, esperando validación del cliente)
    await db
      .update(payments)
      .set({
        ticketImageUrl,
        status: 'validando', // Estado: Ticket subido, cliente debe validar
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    console.log('[uploadTicket] Success — ticket uploaded for payment:', paymentId);
    return { success: true, ticketImageUrl, trackingToken: existingPayment.trackingToken };
  } catch (error) {
    console.error('[uploadTicket] Error:', error instanceof Error ? error.message : String(error));
    return { success: false, error: 'Error al procesar el ticket' };
  }
}

export interface NotifyDeliveryResult {
  success: boolean;
  error?: string;
}

/**
 * Notifica al customer que su pedido llegó al destino.
 * Cambia el estado a 'en_reparto' para que el customer pueda confirmar recepción.
 * Solo permitido cuando el status actual es 'delivered'.
 */
export async function notifyDelivery(
  paymentId: string,
  businessId: string,
): Promise<NotifyDeliveryResult> {
  try {
    const [existingPayment] = await db
      .select({
        status: payments.status,
        businessId: payments.businessId,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!existingPayment) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    if (existingPayment.businessId !== businessId) {
      return { success: false, error: 'No tienes permisos para este pedido' };
    }

    // Solo se puede notificar entrega si el ticket ya fue validado (status = delivered)
    if (existingPayment.status !== 'delivered') {
      return { success: false, error: 'El ticket aún no fue validado por el cliente' };
    }

    // P5: Transaction with re-check for race condition guard
    await db.transaction(async (tx) => {
      const [currentPayment] = await tx
        .select({ status: payments.status })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (currentPayment?.status !== 'delivered') {
        throw new Error('Estado del pedido fue modificado.');
      }

      await tx
        .update(payments)
        .set({
          status: 'en_reparto' as any,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));
    });

    console.log('[notifyDelivery] Success — delivery notified for payment:', paymentId);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('modificado')) {
      return {
        success: false,
        error: 'El estado del pedido fue modificado. Recargá e intentá de nuevo.',
      };
    }
    console.error(
      '[notifyDelivery] Error:',
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error: 'Error al notificar la entrega' };
  }
}
