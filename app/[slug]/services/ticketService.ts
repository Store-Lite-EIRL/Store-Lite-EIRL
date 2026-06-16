import { createClient } from '@/lib/supabase/client';
import { toBlob } from 'html-to-image';
import type { RefObject } from 'react';

export async function generateTicketBlob(
  receiptRef: RefObject<HTMLDivElement | null>,
): Promise<Blob> {
  if (!receiptRef.current) throw new Error('No se pudo generar el ticket');

  // Wait for resources (fonts, images, SVGs) to finish loading
  await new Promise((resolve) => setTimeout(resolve, 800));

  // High resolution for sharp ticket using toBlob
  // skipFonts prevents html-to-image from trying to read cssRules
  // from cross-origin stylesheets (Google Fonts, Material Symbols) that throw SecurityError.
  const blob = await toBlob(receiptRef.current, {
    backgroundColor: '#ffffff',
    pixelRatio: 4,
    quality: 1,
    cacheBust: true,
    skipFonts: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
    filter: (node: Node) => {
      if (node instanceof HTMLLinkElement) {
        const href = node.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
          return false;
        }
      }
      return true;
    },
  });

  if (!blob) {
    throw new Error('No se pudo generar la imagen');
  }

  return blob;
}

export async function uploadTicket(
  blob: Blob,
  orderNumber: string,
): Promise<{ publicUrl: string } | null> {
  const supabase = createClient();
  const fileName = `${orderNumber}.png`;

  const { error: uploadError } = await supabase.storage.from('tickets').upload(fileName, blob, {
    contentType: 'image/png',
    upsert: true,
  });

  if (uploadError) {
    console.error('Error al subir ticket:', uploadError);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('tickets').getPublicUrl(fileName);

  await fetch('/api/payment/update-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, ticketUrl: publicUrl }),
  });

  return { publicUrl };
}

export function downloadLocally(blob: Blob, orderNumber: string): void {
  const link = document.createElement('a');
  link.download = `ticket-${orderNumber}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
}
