'use server';

import { db } from '@/core/database/client';
import { businesses, chatSessions, messages, payments } from '@/core/database/schema';
import { transition } from '@/core/orders/orderService';
import { ORDER_STATUS_INTERNAL, ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

// ─── Rate Limiting (in-memory) ───
// 5 intentos por IP cada 15 minutos
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

async function checkRateLimit(): Promise<{ allowed: boolean; retryAfter?: number }> {
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // Primera vez o ventana expirada
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

async function clearRateLimit() {
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown';
  rateLimitMap.delete(ip);
}

export async function updateOrderStatus(
  paymentId: string,
  trackingToken: string,
  status: string,
  additionalData: any = {},
) {
  try {
    // Read current version
    const [current] = await db
      .select({ version: payments.version })
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.trackingToken, trackingToken)))
      .limit(1);

    if (!current) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    const expectedVersion = current.version ?? 0;
    const updatePayload: Record<string, unknown> = {
      status,
      version: expectedVersion + 1,
      updatedAt: new Date(),
      ...additionalData,
    };

    if (status === ORDER_STATUS_INTERNAL.ACEPTADO) {
      updatePayload.verifiedAt = new Date();
    } else if (status === ORDER_STATUS_INTERNAL.RECHAZADO) {
      updatePayload.rejectedAt = new Date();
    }

    const [updated] = await db
      .update(payments)
      .set(updatePayload)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.trackingToken, trackingToken),
          eq(payments.version, expectedVersion),
        ),
      )
      .returning({ id: payments.id });

    if (!updated) {
      return { success: false, error: 'El pedido fue modificado. Recargá e intentá de nuevo.' };
    }

    revalidatePath('/[slug]/order/[token]', 'page');
    return { success: true };
  } catch (error) {
    console.error('[Action Error] updateOrderStatus:', error);
    return { success: false, error: 'Error al actualizar el estado' };
  }
}

export async function verifyOrderAccess(trackingToken: string, dni: string, orderNumber?: string) {
  try {
    // Rate limiting check
    const rateLimit = await checkRateLimit();
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Demasiados intentos. Esperá ${rateLimit.retryAfter} segundos.`,
        rateLimited: true,
      };
    }

    const order = await db.query.payments.findFirst({
      where: and(eq(payments.trackingToken, trackingToken), eq(payments.buyerDni, dni)),
    });

    if (!order) {
      return { success: false };
    }

    // P4: Normalize orderNumber comparison (handle null/empty)
    const providedOrderNumber = orderNumber?.trim() || null;
    const dbOrderNumber = order.orderNumber || null;

    if (providedOrderNumber !== dbOrderNumber) {
      return { success: false };
    }

    // Success — clear rate limit counter
    await clearRateLimit();

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Verify order access using ONLY DNI + orderNumber (no trackingToken).
 * Used when the tracking link has expired and user needs to recover access.
 */
export async function verifyOrderAccessByDniAndOrderNumber(dni: string, orderNumber: string) {
  try {
    const order = await db.query.payments.findFirst({
      where: and(eq(payments.buyerDni, dni), eq(payments.orderNumber, orderNumber)),
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
 * Sincroniza la sesión de chat vinculada a un pedido específico.
 *
 * Lógica:
 * 1. Busca una sesión activa vinculada al paymentId exacto → si existe, la reusa.
 * 2. Si no, busca una sesión activa del mismo buyer (guestId) → la REUSA y
 *    la vincula al paymentId. Esto es CLAVE para mantener el historial del
 *    chat pre-compra (donde el seller ya mandó mensajes).
 * 3. Si no hay ninguna, CREA una nueva sesión vinculada al paymentId.
 */
export async function syncChatSession(params: {
  guestIdFromStorage: string | null;
  dni: string;
  businessId: string;
  buyerName: string;
  paymentId: string;
}) {
  try {
    const dniGuestId = `dni-${params.dni}`;

    // 1. Buscar sesión activa vinculada EXACTAMENTE a este paymentId
    const exactSession = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.paymentId, params.paymentId),
        eq(chatSessions.businessId, params.businessId),
        eq(chatSessions.status, 'active'),
      ),
      orderBy: [desc(chatSessions.createdAt)],
    });

    if (exactSession) {
      return { success: true, sessionId: exactSession.id, guestId: exactSession.guestId };
    }

    // 2. Buscar sesión activa del mismo buyer (guestId) para REUSARLA
    //    y mantener el historial del chat pre-compra
    const existingSession = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.guestId, dniGuestId),
        eq(chatSessions.businessId, params.businessId),
        eq(chatSessions.status, 'active'),
      ),
      orderBy: [desc(chatSessions.createdAt)],
    });

    if (existingSession) {
      // Reusamos la sesión existente: solo vinculamos el paymentId
      // así el cliente ve el historial completo del chat pre-compra
      await db
        .update(chatSessions)
        .set({ paymentId: params.paymentId, updatedAt: new Date() })
        .where(eq(chatSessions.id, existingSession.id));

      return { success: true, sessionId: existingSession.id, guestId: dniGuestId };
    }

    // 3. No hay sesión previa → CREAMOS una nueva vinculada al paymentId
    const [newSession] = await db
      .insert(chatSessions)
      .values({
        businessId: params.businessId,
        paymentId: params.paymentId,
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

/**
 * Verifica el acceso a una orden usando la identidad de Google.
 *
 * Busca en el metadata de payments si el `customerAuth.authId` coincide
 * con el `authId` del usuario autenticado.
 */
export async function verifyOrderByGoogleIdentity(
  trackingToken: string,
  authId: string,
  orderNumber?: string,
) {
  try {
    // 1. Primero verificar si la orden existe (por trackingToken)
    const order = await db.query.payments.findFirst({
      where: eq(payments.trackingToken, trackingToken),
      columns: {
        id: true,
        orderNumber: true,
        metadata: true,
      },
    });

    if (!order) {
      return { success: false, reason: 'not_found' };
    }

    // 2. Verificar si la orden tiene Google vinculado
    const metadata = order.metadata as Record<string, unknown> | null;
    const customerAuth = metadata?.customerAuth as Record<string, unknown> | null;
    const storedAuthId = customerAuth?.authId as string | undefined;

    if (!storedAuthId) {
      // La orden existe pero NO fue vinculada a Google
      return { success: false, reason: 'no_google_link' };
    }

    if (storedAuthId !== authId) {
      // Hay Google vinculado pero es otra cuenta
      return { success: false, reason: 'wrong_account' };
    }

    // 3. Si se provee orderNumber, validar que coincida
    if (orderNumber) {
      const dbOrderNumber = order.orderNumber || null;
      const providedOrderNumber = orderNumber.trim() || null;

      if (providedOrderNumber !== dbOrderNumber) {
        return { success: false, reason: 'wrong_order' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Action Error] verifyOrderByGoogleIdentity:', error);
    return { success: false, reason: 'error' };
  }
}

// =====================================================
// 5. V2: Report Issue (ISSUE_REPORTED flow)
// =====================================================

export interface ReportIssueV2Result {
  success: boolean;
  error?: string;
}

/**
 * Report an issue on an order (V2 flow).
 * Uses OrderService.transition() with ISSUE_REPORTED status.
 * Works for WAITING_CUSTOMER_CONFIRMATION, READY_TO_SHIP, IN_TRANSIT, DELIVERED.
 */
export async function reportIssueV2(
  paymentId: string,
  trackingToken: string,
  reason: string,
): Promise<ReportIssueV2Result> {
  try {
    const [payment] = await db
      .select({ version: payments.version })
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.trackingToken, trackingToken)))
      .limit(1);

    if (!payment) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    const result = await transition({
      paymentId,
      toStatus: ORDER_STATUS_V2.ISSUE_REPORTED,
      actor: { type: 'customer' },
      expectedVersion: payment.version ?? 0,
      extraFields: { rejectionReason: reason },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/[slug]/order/[token]', 'page');
    return { success: true };
  } catch (error) {
    console.error('[reportIssueV2] Error:', error);
    return { success: false, error: 'Error al reportar el problema' };
  }
}
