'use server';

import { db } from '@/core/database/client';
import { chatSessions, messages, payments, businesses } from '@/core/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(
  paymentId: string,
  trackingToken: string,
  status: string,
  additionalData: any = {},
) {
  try {
    const updatePayload: any = {
      status,
      updatedAt: new Date(),
      ...additionalData,
    };

    if (status === 'aceptado') {
      updatePayload.verifiedAt = new Date();
    } else if (status === 'rechazado') {
      updatePayload.rejectedAt = new Date();
    }

    await db
      .update(payments)
      .set(updatePayload)
      .where(and(eq(payments.id, paymentId), eq(payments.trackingToken, trackingToken)));

    revalidatePath('/[slug]/order/[token]', 'page');
    return { success: true };
  } catch (error) {
    console.error('[Action Error] updateOrderStatus:', error);
    return { success: false, error: 'Error al actualizar el estado' };
  }
}

export async function verifyOrderAccess(
  trackingToken: string,
  dni: string,
  orderNumber?: string,
) {
  try {
    const baseWhere = and(
      eq(payments.trackingToken, trackingToken),
      eq(payments.buyerDni, dni),
    );

    const order = await db.query.payments.findFirst({
      where: baseWhere,
    });

    // If orderNumber is provided, verify it matches too
    if (orderNumber && order && order.orderNumber !== orderNumber) {
      return { success: false };
    }

    return { success: !!order };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Verify order access using ONLY DNI + orderNumber (no trackingToken).
 * Used when the tracking link has expired and user needs to recover access.
 */
export async function verifyOrderAccessByDniAndOrderNumber(
  dni: string,
  orderNumber: string,
) {
  try {
    const order = await db.query.payments.findFirst({
      where: and(
        eq(payments.buyerDni, dni),
        eq(payments.orderNumber, orderNumber),
      ),
    });

    if (!order) {
      return { success: false };
    }

    return {
      success: true,
      trackingToken: order.trackingToken,
      slug: order.businessId ? await getBusinessSlug(order.businessId) : null,
    };
  } catch (error) {
    return { success: false };
  }
}

async function getBusinessSlug(businessId: string): Promise<string | null> {
  try {
    const biz = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { slug: true },
    });
    return biz?.slug ?? null;
  } catch {
    return null;
  }
}

/**
 * Sincroniza la sesión de chat: busca por DNI o por ID de invitado anterior.
 * Unifica las sesiones si es necesario para que el historial sea persistente.
 */
export async function syncChatSession(params: {
  guestIdFromStorage: string | null;
  dni: string;
  businessId: string;
  buyerName: string;
}) {
  try {
    const dniGuestId = `dni-${params.dni}`;

    // 1. Buscamos si ya existe una sesión vinculada al DNI
    let session = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.guestId, dniGuestId),
        eq(chatSessions.businessId, params.businessId),
        eq(chatSessions.status, 'active'),
      ),
      orderBy: [desc(chatSessions.createdAt)],
    });

    if (session) {
      return { success: true, sessionId: session.id, guestId: dniGuestId };
    }

    // 2. Si no hay por DNI, buscamos si hay una por el ID aleatorio del storage
    if (params.guestIdFromStorage) {
      session = await db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.guestId, params.guestIdFromStorage),
          eq(chatSessions.businessId, params.businessId),
          eq(chatSessions.status, 'active'),
        ),
        orderBy: [desc(chatSessions.createdAt)],
      });

      if (session) {
        // Vinculamos esta sesión al DNI para siempre
        await db
          .update(chatSessions)
          .set({ guestId: dniGuestId, guestName: params.buyerName })
          .where(eq(chatSessions.id, session.id));

        return { success: true, sessionId: session.id, guestId: dniGuestId };
      }
    }

    // 3. Si nada existe, creamos una nueva sesión con el DNI
    const [newSession] = await db
      .insert(chatSessions)
      .values({
        businessId: params.businessId,
        guestId: dniGuestId,
        guestName: params.buyerName,
        guestGender: 'other',
        status: 'active',
      })
      .returning();

    // Mensaje de bienvenida automático
    await db.insert(messages).values({
      sessionId: newSession.id,
      isFromStore: true,
      content: `¡Hola ${params.buyerName}! Bienvenido al canal de soporte de tu orden. ¿Cómo podemos ayudarte?`,
    });

    return { success: true, sessionId: newSession.id, guestId: dniGuestId };
  } catch (error) {
    console.error('[Action Error] syncChatSession:', error);
    return { success: false, error: 'Error al sincronizar chat' };
  }
}
