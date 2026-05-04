import { db } from '@/core/database/client';
import { businesses, chatSessions, messages, payments } from '@/core/database/schema';
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

export async function verifyOrderAccess(trackingToken: string, dni: string, orderNumber?: string) {
  try {
    // Rate limiting check
    const rateLimit = checkRateLimit();
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
    clearRateLimit();

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
 * 1. Busca una sesión activa vinculada al paymentId exacto.
 * 2. Si no existe, cierra sesiones viejas del mismo buyer (para evitar chat cruzado).
 * 3. Crea una nueva sesión vinculada al paymentId con mensaje de bienvenida.
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

    // 1. Buscamos si ya existe una sesión vinculada a ESTE paymentId
    const session = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.paymentId, params.paymentId),
        eq(chatSessions.businessId, params.businessId),
        eq(chatSessions.status, 'active'),
      ),
      orderBy: [desc(chatSessions.createdAt)],
    });

    if (session) {
      return { success: true, sessionId: session.id, guestId: session.guestId };
    }

    // 2. No hay sesión para este pedido → cerramos sesiones viejas del mismo buyer
    // para evitar que mensajes de otra orden aparezcan aquí
    await db
      .update(chatSessions)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(
        and(
          eq(chatSessions.guestId, dniGuestId),
          eq(chatSessions.businessId, params.businessId),
          eq(chatSessions.status, 'active'),
        ),
      );

    // 3. Creamos una nueva sesión vinculada al paymentId
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
