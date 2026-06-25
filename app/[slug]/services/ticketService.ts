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
  // Convert data URL to Blob without fetch() to avoid CSP connect-src violations.
  // fetch() on a data: URL is blocked by restrictive CSPs; atob + Uint8Array is purely in-memory.
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
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
