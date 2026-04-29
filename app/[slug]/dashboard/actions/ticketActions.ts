'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
// removed randomUUID import - we don't generate new tokens here
// import { randomUUID } from 'node:crypto';

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
    // 1. Convert base64 to Uint8Array (compatible with Edge runtime)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Generate unique filename
    const fileName = `ticket_${paymentId}_${randomUUID()}.jpg`;
    const filePath = `${businessId}/${fileName}`;

    // 3. Upload to Supabase Storage
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

    // 4. Get public URL
    const { data: urlData } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    const ticketImageUrl = urlData.publicUrl;

    // 5. Get existing payment to retrieve trackingToken
    const [existingPayment] = await db
      .select({ trackingToken: payments.trackingToken })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!existingPayment) {
      return { success: false, error: 'Payment not found' };
    }

    // 6. Update payment (do NOT overwrite trackingToken)
    await db
      .update(payments)
      .set({
        ticketImageUrl,
        status: 'not_delivered', // Valid enum value from schema
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    return { success: true, ticketImageUrl, trackingToken: existingPayment.trackingToken };
  } catch (error) {
    console.error('[uploadTicket] Catch error:', error);
    return { success: false, error: 'Error al procesar el ticket' };
  }
}
