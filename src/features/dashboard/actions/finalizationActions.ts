'use server';

import { db } from '@/core/database/client';
import { chatSessions, messages, payments } from '@/core/database/schema';
import { createBusinessNotification } from '@/lib/notifications';
import { and, desc, eq, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export interface FinalizationActionResult {
  success: boolean;
  error?: string;
  data?: {
    status: string;
    finalizationDeadline?: string;
  };
}

// =====================================================
// CONSTANTS
// =====================================================

const HOURS_BEFORE_SELLER_CAN_REQUEST = 24; // 24h después de "aceptado"
const DAYS_FOR_CUSTOMER_TO_CONFIRM = 3; // 3 días para que el customer confirme

// =====================================================
// 1. SELLER: Request Finalization
// =====================================================
// Called when the seller clicks "FINALIZAR COMPRA"
// Requirements:
// - Payment must be in 'aceptado' status
// - At least 24 hours must have passed since 'aceptado' (aceptado_at)
// - Payment must not be already in finalization process

export async function requestFinalization(
  paymentId: string,
  businessId: string,
): Promise<FinalizationActionResult> {
  try {
    console.log('[requestFinalization] Starting for payment:', paymentId);

    // 1. Fetch the payment and validate ownership + status
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.businessId, businessId)))
      .limit(1);

    if (!payment) {
      console.error('[requestFinalization] Payment not found or not owned by business');
      return { success: false, error: 'Pago no encontrado o no tienes permisos.' };
    }

    // 2. Check if status is 'delivered'
    if (payment.status !== 'delivered') {
      console.error('[requestFinalization] Invalid status:', payment.status);
      return {
        success: false,
        error: `El pago debe estar en estado "delivered". Estado actual: ${payment.status}`,
      };
    }

    // 3. Check if 24 hours have passed since "delivered" (REMOVED FOR FLEXIBILITY)
    /*
    const deliveredAt = payment.verifiedAt || payment.updatedAt;
    if (!deliveredAt) {
      console.error('[requestFinalization] No delivered timestamp found');
      return { success: false, error: 'No se encontró la fecha de entrega del pedido.' };
    }

    const hoursSinceDelivered = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceDelivered < HOURS_BEFORE_SELLER_CAN_REQUEST) {
      const remainingHours = Math.ceil(HOURS_BEFORE_SELLER_CAN_REQUEST - hoursSinceDelivered);
      console.warn('[requestFinalization] Too early to request. Hours since delivered:', hoursSinceDelivered);
      return { 
        success: false, 
        error: `Debes esperar ${remainingHours} hora(s) más antes de solicitar la finalización.` 
      };
    }
    */

    // 4. Check if already in finalization process
    if (payment.finalizationRequestedAt) {
      console.warn(
        '[requestFinalization] Finalization already requested at:',
        payment.finalizationRequestedAt,
      );
      return { success: false, error: 'La finalización ya fue solicitada anteriormente.' };
    }

    // 5. Calculate deadline (now + 3 days)
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + DAYS_FOR_CUSTOMER_TO_CONFIRM);

    console.log(
      '[requestFinalization] Updating payment to not_delivered (waiting for confirmation), deadline:',
      deadline,
    );

    // 6. Update payment
    await db
      .update(payments)
      .set({
        status: 'not_delivered' as any, // Waiting for customer confirmation
        finalizationRequestedAt: now,
        finalizationDeadline: deadline,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    // 7. Create notification for the business (seller)
    await createBusinessNotification({
      businessId,
      type: 'order_finalization_requested',
      category: 'pedidos',
      title: 'Solicitud de finalización enviada',
      message: `Se ha enviado la solicitud de finalización para el pedido ${payment.orderNumber || paymentId.slice(0, 8)}. Esperando confirmación del cliente.`,
      data: {
        paymentId,
        orderNumber: payment.orderNumber,
        finalizationDeadline: deadline.toISOString(),
      },
    });

    // 8. Send automatic chat message to the customer
    if (payment.buyerDni) {
      const guestId = `dni-${payment.buyerDni}`;
      const session = await db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.guestId, guestId),
          eq(chatSessions.businessId, businessId),
          eq(chatSessions.status, 'active'),
        ),
        orderBy: [desc(chatSessions.createdAt)],
      });

      if (session) {
        await db.insert(messages).values({
          sessionId: session.id,
          isFromStore: true,
          content: `⚠️ EL VENDEDOR HA SOLICITADO FINALIZAR LA COMPRA. 

Si ya recibiste tu pedido correctamente, por favor confírmalo en el portal de seguimiento. 

Recuerda que si no respondes en 3 días (${deadline.toLocaleDateString('es-PE')}), el pedido se finalizará automáticamente.`,
        });
      }
    }

    revalidatePath(`/${businessId}/dashboard`, 'page');
    if (payment.trackingToken) {
      // Find the business slug if possible, but businessId is often the slug in this project or we can use the business object
      const business = await db.query.businesses.findFirst({
        where: eq(payments.businessId, businessId),
      });
      const slug = business?.slug || businessId;
      revalidatePath(`/${slug}/order/${payment.trackingToken}`, 'page');
    }

    console.log('[requestFinalization] Success! Payment updated to esperando_confirmacion');

    return {
      success: true,
      data: {
        status: 'esperando_confirmacion',
        finalizationDeadline: deadline.toISOString(),
      },
    };
  } catch (error) {
    console.error('[requestFinalization] Error:', error);
    return {
      success: false,
      error: 'Error al solicitar la finalización del pedido.',
    };
  }
}

// =====================================================
// 2. CUSTOMER: Confirm Finalization (Accept)
// =====================================================
// Called when the customer accepts the finalization
// Requirements:
// - Payment must be in 'esperando_confirmacion' status
// - Token must match (security check)

export async function confirmFinalization(
  paymentId: string,
  token: string,
): Promise<FinalizationActionResult> {
  try {
    console.log('[confirmFinalization] Starting for payment:', paymentId);

    // 1. Fetch payment and validate token + status
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.trackingToken, token)))
      .limit(1);

    if (!payment) {
      console.error('[confirmFinalization] Payment not found or invalid token');
      return { success: false, error: 'Pedido no encontrado o token inválido.' };
    }

    if (
      (payment.status as string) !== 'not_delivered' &&
      (payment.status as string) !== 'en_reparto'
    ) {
      console.error('[confirmFinalization] Invalid status:', payment.status);
      return {
        success: false,
        error: `El pedido no está en estado de espera de confirmación. Estado actual: ${payment.status}`,
      };
    }

    const now = new Date();

    console.log('[confirmFinalization] Confirming finalization...');

    // 2. Update payment to 'completed' inside transaction with re-check (P5: race condition guard)
    await db.transaction(async (tx) => {
      // Re-read current status inside the transaction
      const [currentPayment] = await tx
        .select({ status: payments.status })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (
        currentPayment?.status !== 'not_delivered' &&
        (currentPayment?.status as string) !== 'en_reparto'
      ) {
        throw new Error('Estado del pedido fue modificado por otra operación.');
      }

      await tx
        .update(payments)
        .set({
          status: 'completed' as any,
          finalizationConfirmedAt: now,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));
    });

    // 3. Notify the business (seller)
    await createBusinessNotification({
      businessId: payment.businessId,
      type: 'order_finalization_confirmed',
      category: 'pedidos',
      title: '¡Pedido finalizado!',
      message: `El cliente ha confirmado la recepción satisfactoria del pedido ${payment.orderNumber || payment.id.slice(0, 8)}.`,
      data: {
        paymentId,
        orderNumber: payment.orderNumber,
        confirmedAt: now.toISOString(),
      },
    });

    // 4. Send chat message
    if (payment.buyerDni) {
      const guestId = `dni-${payment.buyerDni}`;
      const session = await db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.guestId, guestId),
          eq(chatSessions.businessId, payment.businessId),
          eq(chatSessions.status, 'active'),
        ),
        orderBy: [desc(chatSessions.createdAt)],
      });

      if (session) {
        await db.insert(messages).values({
          sessionId: session.id,
          isFromStore: false, // From customer
          content: `✅ HE CONFIRMADO LA RECEPCIÓN DEL PEDIDO. Todo conforme.`,
        });
      }
    }

    const business = await db.query.businesses.findFirst({
      where: eq(payments.businessId, payment.businessId),
    });
    const slug = business?.slug || payment.businessId;

    revalidatePath(`/${slug}/dashboard`, 'page');
    revalidatePath(`/${slug}/order/${token}`, 'page');

    console.log('[confirmFinalization] Success! Payment finalized.');

    return {
      success: true,
      data: {
        status: 'finalizado',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('modificado por otra operación')) {
      return {
        success: false,
        error: 'El estado del pedido fue modificado. Recargá la página e intentá de nuevo.',
      };
    }
    console.error('[confirmFinalization] Error:', error);
    return {
      success: false,
      error: 'Error al confirmar la finalización del pedido.',
    };
  }
}

// =====================================================
// 3. CUSTOMER: Reject Finalization (Report Problem)
// =====================================================
// Called when the customer reports a problem
// Requirements:
// - Payment must be in 'esperando_confirmacion' status
// - Token must match

export async function rejectFinalization(
  paymentId: string,
  token: string,
  reason: string,
): Promise<FinalizationActionResult> {
  try {
    console.log('[rejectFinalization] Starting for payment:', paymentId);

    // 1. Fetch payment and validate token + status
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.trackingToken, token)))
      .limit(1);

    if (!payment) {
      console.error('[rejectFinalization] Payment not found or invalid token');
      return { success: false, error: 'Pedido no encontrado o token inválido.' };
    }

    if (payment.status !== 'not_delivered' && (payment.status as string) !== 'en_reparto') {
      console.error('[rejectFinalization] Invalid status:', payment.status);
      return {
        success: false,
        error: `El pedido no está en estado de espera de confirmación. Estado actual: ${payment.status}`,
      };
    }

    console.log('[rejectFinalization] Rejecting with reason:', reason);

    // 2. Update payment to 'disputed' inside transaction with re-check (P5: race condition guard)
    // Also clear completedAt if it was previously set (P17)
    const now = new Date();
    await db.transaction(async (tx) => {
      const [currentPayment] = await tx
        .select({ status: payments.status })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (
        currentPayment?.status !== 'not_delivered' &&
        (currentPayment?.status as string) !== 'en_reparto'
      ) {
        throw new Error('Estado del pedido fue modificado por otra operación.');
      }

      await tx
        .update(payments)
        .set({
          status: 'disputed' as any,
          rejectionReason: reason,
          completedAt: null, // P17: clear completion date on rejection
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));
    });

    // 3. Notify the business (seller)
    await createBusinessNotification({
      businessId: payment.businessId,
      type: 'order_finalization_rejected',
      category: 'pedidos',
      title: 'Problema reportado en pedido',
      message: `El cliente ha reportado un problema con el pedido ${payment.orderNumber || payment.id.slice(0, 8)}: ${reason}`,
      data: {
        paymentId,
        orderNumber: payment.orderNumber,
        reason,
        rejectedAt: new Date().toISOString(),
      },
    });

    // 4. Send chat message
    if (payment.buyerDni) {
      const guestId = `dni-${payment.buyerDni}`;
      const session = await db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.guestId, guestId),
          eq(chatSessions.businessId, payment.businessId),
          eq(chatSessions.status, 'active'),
        ),
        orderBy: [desc(chatSessions.createdAt)],
      });

      if (session) {
        await db.insert(messages).values({
          sessionId: session.id,
          isFromStore: false, // From customer
          content: `❌ HE REPORTADO UN PROBLEMA: ${reason}`,
        });
      }
    }

    const business = await db.query.businesses.findFirst({
      where: eq(payments.businessId, payment.businessId),
    });
    const slug = business?.slug || payment.businessId;

    revalidatePath(`/${slug}/dashboard`, 'page');
    revalidatePath(`/${slug}/order/${token}`, 'page');

    console.log('[rejectFinalization] Success! Payment marked as reporte.');

    return {
      success: true,
      data: {
        status: 'reporte',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('modificado por otra operación')) {
      return {
        success: false,
        error: 'El estado del pedido fue modificado. Recargá la página e intentá de nuevo.',
      };
    }
    console.error('[rejectFinalization] Error:', error);
    return {
      success: false,
      error: 'Error al reportar el problema del pedido.',
    };
  }
}

// =====================================================
// 4. CRON JOB: Auto-Finalize Expired Requests
// =====================================================
// This function should be called periodically (e.g., every 24h)
// It finds all payments in 'not_delivered' with expired deadlines
// and automatically sets them to 'completed'

export async function autoFinalizeExpiredPayments(): Promise<{
  success: boolean;
  processedCount: number;
  error?: string;
}> {
  try {
    console.log('[autoFinalize] Starting auto-finalization check...');

    const now = new Date();

    // 1. Find payments in 'not_delivered' with expired deadlines
    const expiredPayments = await db
      .select({
        id: payments.id,
        businessId: payments.businessId,
        orderNumber: payments.orderNumber,
        finalizationDeadline: payments.finalizationDeadline,
        buyerDni: payments.buyerDni,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'not_delivered' as any),
          lt(payments.finalizationDeadline, now), // Deadline has passed
        ),
      );

    console.log(`[autoFinalize] Found ${expiredPayments.length} expired payments`);

    if (expiredPayments.length === 0) {
      return { success: true, processedCount: 0 };
    }

    // 2. Update each payment to 'completed'
    let processedCount = 0;
    for (const payment of expiredPayments) {
      try {
        await db
          .update(payments)
          .set({
            status: 'completed' as any,
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(payments.id, payment.id));

        // 3. Notify business (seller)
        await createBusinessNotification({
          businessId: payment.businessId,
          type: 'order_auto_finalized',
          category: 'pedidos',
          title: 'Pedido finalizado automáticamente',
          message: `El pedido ${payment.orderNumber || payment.id.slice(0, 8)} se ha finalizado automáticamente tras 3 días sin respuesta del cliente.`,
          data: {
            paymentId: payment.id,
            orderNumber: payment.orderNumber,
            finalizedAt: now.toISOString(),
            reason: 'auto_finalized_timeout',
          },
        });

        // 4. Send chat message
        if (payment.buyerDni) {
          const guestId = `dni-${payment.buyerDni}`;
          const session = await db.query.chatSessions.findFirst({
            where: and(
              eq(chatSessions.guestId, guestId),
              eq(chatSessions.businessId, payment.businessId),
              eq(chatSessions.status, 'active'),
            ),
            orderBy: [desc(chatSessions.createdAt)],
          });

          if (session) {
            await db.insert(messages).values({
              sessionId: session.id,
              isFromStore: true,
              content: `⌛ PEDIDO FINALIZADO AUTOMÁTICAMENTE. Debido a la falta de respuesta en los últimos 3 días, el sistema ha dado por concluido este pedido.`,
            });
          }
        }

        processedCount++;
        console.log(`[autoFinalize] Auto-finalized payment ${payment.id}`);
      } catch (err) {
        console.error(`[autoFinalize] Error processing payment ${payment.id}:`, err);
      }
    }

    revalidatePath(`/[slug]/dashboard`, 'page');

    console.log(`[autoFinalize] Success! Processed ${processedCount} payments.`);

    return { success: true, processedCount };
  } catch (error) {
    console.error('[autoFinalize] Error:', error);
    return {
      success: false,
      processedCount: 0,
      error: 'Error en la auto-finalización de pagos.',
    };
  }
}
