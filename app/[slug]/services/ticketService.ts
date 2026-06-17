import { generateAndUploadTicket } from '@/shared/payments/ticketGenerator';
import type { RefObject } from 'react';

/**
 * Generates a ticket PNG from a DOM ref and uploads it to the tickets bucket.
 * Delegates to the shared ticketGenerator module with checkout-specific options.
 */
export async function generateAndUploadCheckoutTicket(
  receiptRef: RefObject<HTMLDivElement | null>,
  orderNumber: string,
) {
  return generateAndUploadTicket(receiptRef, orderNumber, {
    bucket: 'tickets',
    updateUrl: '/api/payment/update-ticket',
  });
}

/**
 * Captures a DOM ref as a PNG blob for local download.
 */
export async function generateTicketBlob(ref: RefObject<HTMLDivElement | null>): Promise<Blob> {
  if (!ref.current) throw new Error('No se pudo generar el ticket');
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(ref.current, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    skipFonts: true,
    quality: 0.95,
  });
  return fetch(dataUrl).then((r) => r.blob());
}

/**
 * Uploads a PNG blob to the tickets Supabase bucket.
 */
export async function uploadTicket(blob: Blob, orderNumber: string): Promise<string> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  const fileName = `${orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  const { error: uploadError } = await supabase.storage
    .from('tickets')
    .upload(fileName, blob, { contentType: 'image/png', upsert: true });
  if (uploadError) throw new Error(`Error al subir el ticket: ${uploadError.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from('tickets').getPublicUrl(fileName);
  return publicUrl;
}

export function downloadLocally(blob: Blob, orderNumber: string): void {
  const link = document.createElement('a');
  link.download = `ticket-${orderNumber}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
}
