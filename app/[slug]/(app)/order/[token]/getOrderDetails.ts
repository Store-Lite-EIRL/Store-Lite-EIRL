'use server';

import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { and, eq } from 'drizzle-orm';
import type { CallerProof, GetOrderDetailsResult } from './types';

/**
 * Returns sensitive order fields ONLY after verifying the caller
 * matches the order's buyer. CallerProof must be provided — at least
 * one of {dni, authId} must match the payment record.
 *
 * These fields are excluded from SSR in page.tsx to minimize data exposure.
 */
export async function getOrderDetails(
  paymentId: string,
  trackingToken: string,
  callerProof: CallerProof,
): Promise<{ success: true; data: GetOrderDetailsResult } | { success: false; error: string }> {
  try {
    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.id, paymentId), eq(payments.trackingToken, trackingToken)),
      columns: {
        buyerDni: true,
        buyerEmail: true,
        buyerPhone: true,
        amount: true,
        currency: true,
        metadata: true,
      },
    });

    if (!payment) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    // Verify caller identity
    let verified = false;

    if (callerProof.dni && payment.buyerDni === callerProof.dni) {
      verified = true;
    }

    if (!verified && callerProof.authId) {
      const metadata = payment.metadata as Record<string, unknown> | null;
      const customerAuth = metadata?.customerAuth as Record<string, unknown> | null;
      const storedAuthId = customerAuth?.authId as string | undefined;
      if (storedAuthId === callerProof.authId) {
        verified = true;
      }
    }

    if (!verified) {
      return { success: false, error: 'No autorizado' };
    }

    return {
      success: true,
      data: {
        buyerDni: payment.buyerDni,
        buyerEmail: payment.buyerEmail,
        buyerPhone: payment.buyerPhone,
        amount: payment.amount,
        currency: payment.currency,
      },
    };
  } catch (error) {
    console.error('[getOrderDetails] Error:', error);
    return { success: false, error: 'Error al obtener detalles de la orden' };
  }
}
