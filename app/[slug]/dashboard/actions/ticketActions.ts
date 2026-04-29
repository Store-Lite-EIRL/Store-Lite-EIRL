'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

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
  try {
    // 1. Convertir base64 a Uint8Array (compatible con Edge runtime)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('[uploadTicket] base64 length:', imageBase64.length);
    console.log('[uploadTicket] bytes length:', bytes.length);
    console.log('[uploadTicket] businessId:', businessId);
    console.log('[uploadTicket] paymentId:', paymentId);

    // 2. Generar nombre único
    const fileName = `ticket_${paymentId}_${randomUUID()}.jpg`;
    const filePath = `${businessId}/${fileName}`;

    console.log('[uploadTicket] filePath:', filePath);

    // 3. Subir a Supabase Storage
    const adminClient = createAdminClient();
    const { error: uploadError, data } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[uploadTicket] Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('[uploadTicket] Upload success, data:', data);

    // 4. Obtener URL pública
    const { data: urlData } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    const ticketImageUrl = urlData.publicUrl;
    console.log('[uploadTicket] ticketImageUrl:', ticketImageUrl);

    // 5. Generar tracking token
    const trackingToken = randomUUID().slice(0, 8).toUpperCase();
    console.log('[uploadTicket] trackingToken:', trackingToken);

    // 6. Actualizar payment
    console.log('[uploadTicket] Updating payment with status: analizando');
    await db
      .update(payments)
      .set({
        ticketImageUrl,
        trackingToken,
        status: 'analizando',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    console.log('[uploadTicket] Success!');
    return { success: true, ticketImageUrl, trackingToken };
  } catch (error) {
    console.error('[uploadTicket] Catch error:', error);
    return { success: false, error: 'Error al procesar el ticket' };
  }
}
