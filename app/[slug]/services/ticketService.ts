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

export function downloadLocally(blob: Blob, orderNumber: string): void {
  const link = document.createElement('a');
  link.download = `ticket-${orderNumber}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
}
