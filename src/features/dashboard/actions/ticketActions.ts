'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { transition } from '@/core/orders/orderService';
import { ORDER_STATUS, ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { createClient } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';

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
    // 1. Obtener datos del pago para validar y pasar preconditions
    const [existingPayment] = await db
      .select({
        trackingToken: payments.trackingToken,
        businessId: payments.businessId,
        version: payments.version,
        shippingCost: payments.shippingCost,
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

    const expectedVersion = existingPayment.version ?? 0;

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

    // 6. Update payment — V2 path uses OrderService, legacy uses inline
    if (env.orderFlowV2) {
      const result = await transition({
        paymentId,
        toStatus: ORDER_STATUS_V2.WAITING_CUSTOMER_CONFIRMATION,
        actor: { type: 'seller', id: businessId },
        expectedVersion,
        extraFields: { ticketImageUrl },
        preconditions: { shippingCost: existingPayment.shippingCost },
      });

      if (!result.success) {
        console.error('[uploadTicket] OrderService error:', result.error);
        // Mapear errores técnicos a mensajes amigables para el usuario
        const friendlyError = mapTransitionError(result.error);
        return { success: false, error: friendlyError };
      }
    } else {
      const [updated] = await db
        .update(payments)
        .set({
          ticketImageUrl,
          status: ORDER_STATUS.VALIDANDO,
          version: expectedVersion + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), eq(payments.version, expectedVersion)))
        .returning({ id: payments.id });

      if (!updated) {
        console.error('[uploadTicket] Version conflict for payment:', paymentId);
        return {
          success: false,
          error: 'El pedido fue modificado por otra operación. Recargá e intentá de nuevo.',
        };
      }
    }

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
        version: payments.version,
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
    if (existingPayment.status !== ORDER_STATUS.DELIVERED) {
      return { success: false, error: 'El ticket aún no fue validado por el cliente' };
    }

    // Version-locked update
    const expectedVersion = existingPayment.version ?? 0;

    if (env.orderFlowV2) {
      const result = await transition({
        paymentId,
        toStatus: ORDER_STATUS_V2.IN_TRANSIT,
        actor: { type: 'seller', id: businessId },
        expectedVersion,
      });

      if (!result.success) {
        console.error('[notifyDelivery] OrderService error:', result.error);
        return { success: false, error: result.error };
      }
    } else {
      const [updated] = await db
        .update(payments)
        .set({
          status: ORDER_STATUS.EN_REPARTO,
          version: expectedVersion + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), eq(payments.version, expectedVersion)))
        .returning({ id: payments.id });

      if (!updated) {
        console.error('[notifyDelivery] Version conflict for payment:', paymentId);
        return {
          success: false,
          error: 'El estado del pedido fue modificado. Recargá e intentá de nuevo.',
        };
      }
    }

    console.log('[notifyDelivery] Success — delivery notified for payment:', paymentId);
    return { success: true };
  } catch (error) {
    console.error(
      '[notifyDelivery] Error:',
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error: 'Error al notificar la entrega' };
  }
}

/**
 * Mapea errores técnicos de la máquina de estados a mensajes amigables para el usuario.
 */
function mapTransitionError(error: string): string {
  if (error.includes('Version conflict')) {
    return 'El pedido fue modificado por otra operación. Recargá la página e intentá de nuevo.';
  }
  if (
    error.includes('Invalid transition') ||
    error.includes('not allowed') ||
    error.includes('not permitted')
  ) {
    return 'No se puede cambiar el estado del pedido en este momento. Recargá la página e intentá de nuevo.';
  }
  if (error.includes('Seller must provide')) {
    return 'Faltan datos del courier. Completá los campos de transporte y volvé a intentar.';
  }
  if (error.includes('Estado actual desconocido')) {
    return 'El pedido tiene un estado desconocido. Contactá a soporte.';
  }
  // Si no hay un mapeo conocido, devolver el error original
  return error;
}
