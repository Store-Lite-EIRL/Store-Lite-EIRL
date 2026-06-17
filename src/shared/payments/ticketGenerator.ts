/**
 * ticketGenerator.ts
 *
 * Shared ticket generation and upload utility.
 * Captures a DOM node as PNG, uploads to Supabase storage,
 * and notifies the backend via an update URL.
 *
 * Used by both:
 * - Checkout (bucket: `tickets`, updateUrl: `/api/payment/update-ticket`)
 * - Plans    (bucket: `tickets_plans`, updateUrl: `/api/billing/update-plan-ticket`)
 */

import { createClient } from '@/lib/supabase/client';
import { toPng } from 'html-to-image';
import type { RefObject } from 'react';

export interface TicketGeneratorOptions {
  /** Supabase storage bucket name */
  bucket: string;
  /** API endpoint to notify after upload */
  updateUrl: string;
}

export interface TicketGeneratorResult {
  publicUrl: string;
}

/**
 * Captures a DOM ref as PNG, uploads to Supabase storage, and calls
 * the updateUrl API endpoint with the uploaded URL.
 *
 * @param ref - React ref to the DOM element to capture
 * @param identifier - Order number or ticket number used as filename
 * @param options - Bucket name and update API URL
 */
export async function generateAndUploadTicket(
  ref: RefObject<HTMLDivElement | null>,
  identifier: string,
  options: TicketGeneratorOptions,
): Promise<TicketGeneratorResult> {
  if (!ref.current) {
    throw new Error('No se pudo generar el ticket');
  }

  // Wait for resources (fonts, images) to finish rendering
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Capture DOM element as PNG data URL
  const dataUrl = await toPng(ref.current, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    skipFonts: true,
    quality: 0.95,
  });

  // Convert data URL to Blob
  const blob = await fetch(dataUrl).then((r) => r.blob());

  // Upload to Supabase
  const supabase = createClient();
  const fileName = `${identifier.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

  const { error: uploadError } = await supabase.storage
    .from(options.bucket)
    .upload(fileName, blob, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error(`[ticketGenerator] Error uploading to ${options.bucket}:`, uploadError);
    throw new Error(`Error al subir el ticket: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(options.bucket).getPublicUrl(fileName);

  // Notify backend
  const response = await fetch(options.updateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber: identifier, ticketUrl: publicUrl }),
  });

  if (!response.ok) {
    console.error(`[ticketGenerator] Error notifying ${options.updateUrl}:`, response.status);
  }

  return { publicUrl };
}
