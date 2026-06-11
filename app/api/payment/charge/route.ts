/**
 * =====================================================
 * API: POST /api/payment/charge
 * Backend: Crear cargo (charge) en Culqi y guardar payment
 * =====================================================
 */

import { db } from '@/core/database/client';
import {
  businesses,
  businessSettings,
  paymentOrders,
  payments,
  products,
} from '@/core/database/schema';
import { completeIdempotencyKey, reserveIdempotencyKey } from '@/core/payments/idempotency';
import { generateTrackingToken } from '@/core/utils/trackingToken';
import { notifyLowStock, notifyNewOrder, notifyOutOfStock } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/utils/crypto';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const LOW_STOCK_THRESHOLD = 5;

// ─── Rate Limiter ────────────────────────────────────────────────────
// Sliding window: máx 3 requests por (businessId + productId) en 30s
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 30_000; // 30 segundos
const RATE_LIMIT_MAX = 3;

function checkRateLimit(businessId: string, productId: string): boolean {
  const key = `${businessId}:${productId}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  let timestamps = rateLimitStore.get(key) ?? [];
  // Filtrar solo los que están dentro de la ventana
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) return false; // bloqueado

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

// Limpieza periódica cada 60s para evitar fuga de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore) {
    const valid = timestamps.filter((t) => t > now - RATE_LIMIT_WINDOW);
    if (valid.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, valid);
  }
}, 60_000);

interface CulqiChargeResponse {
  object: string;
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  paid?: boolean;
  user_message?: string;
  merchant_message?: string;
  outcome?: {
    type: string;
    user_message: string;
    merchant_message: string;
  };
  description?: string;
  reference_code?: string;
  metadata?: Record<string, unknown>;
  creation_date?: number;
  status: string;
}

export async function POST(request: Request) {
  try {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    let reservedIdempotencyKey: string | null = null;

    const rawBody = await request.json();

    // 0. Validate Data using Zod
    const { chargeRequestSchema } = await import('@/features/billing/schemas');
    const validationResult = chargeRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Datos no válidos' },
        { status: 400 },
      );
    }

    const {
      token,
      culqiOrderId,
      amount,
      email,
      businessId,
      productId,
      currency = 'PEN',
      phone,
      customerAuth,
      metadata = {},
    } = validationResult.data;

    // ─── Rate Limit Check ──────────────────────────────────────────
    if (!checkRateLimit(businessId, productId)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Esperá unos segundos antes de reintentar.' },
        { status: 429 },
      );
    }

    // ─── FLOW: ORDER-BASED PAYMENT (tarjeta pagó una orden) ───
    let culqiData: CulqiChargeResponse | null = null;
    let paymentMethodOverride:
      | 'card'
      | 'yape'
      | 'plin'
      | 'pago_efectivo'
      | 'billetera_movil'
      | 'cuotealo'
      | undefined;

    if (culqiOrderId) {
      // Ya fue cobrado por Culqi Checkout contra la orden
      // Solo marcar la orden como pagada y crear el payment
      paymentMethodOverride = 'card';
    } else {
      // ─── FLOW: TOKEN-BASED CHARGE (tarjeta/Yape directo) ───
      // 1. Obtener y descifrar la Secret Key
      const settings = await db.query.businessSettings.findFirst({
        where: eq(businessSettings.businessId, businessId),
        columns: { culqiSecretKey: true },
      });

      if (!settings?.culqiSecretKey) {
        return NextResponse.json(
          { error: 'El negocio no tiene configurada pasarela de pagos' },
          { status: 400 },
        );
      }

      // 🔥 SECURITY: Decrypt and Validate Key Environment
      const culqiSecretKey = decrypt(settings.culqiSecretKey);
      const isProd = process.env.NODE_ENV === 'production';
      const isKeyLive = culqiSecretKey.startsWith('sk_live');

      if (isProd && !isKeyLive) {
        return NextResponse.json(
          { error: 'Configuración inválida: Se requiere una llave de producción (sk_live).' },
          { status: 400 },
        );
      }
      if (!isProd && isKeyLive) {
        return NextResponse.json(
          {
            error:
              'Configuración inválida: No se permiten llaves sk_live en entorno de desarrollo.',
          },
          { status: 400 },
        );
      }
    }

    // 2. Obtener info necesaria para Culqi (aplica a ambos flujos)
    const [product, business] = await Promise.all([
      db.query.products.findFirst({ where: eq(products.id, productId), columns: { title: true } }),
      db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { ownerId: true },
      }),
    ]);

    if (!business?.ownerId) {
      return NextResponse.json(
        { error: 'No se pudo obtener el propietario del negocio' },
        { status: 400 },
      );
    }

    // 🛡️ SECURITY: El dueño del negocio NO puede comprar su propio producto
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser?.id && authUser.id === business.ownerId) {
      return NextResponse.json({ error: 'No puedes comprar tu propio producto' }, { status: 403 });
    }

    const idempotencyReservation = await reserveIdempotencyKey(idempotencyKey);
    if (
      idempotencyReservation?.type === 'replay' ||
      idempotencyReservation?.type === 'processing'
    ) {
      return idempotencyReservation.response;
    }
    reservedIdempotencyKey = idempotencyReservation?.key ?? null;

    // 3. Crear el cargo en Culqi (solo token flow)
    if (token) {
      const settings = await db.query.businessSettings.findFirst({
        where: eq(businessSettings.businessId, businessId),
        columns: { culqiSecretKey: true },
      });

      if (!settings?.culqiSecretKey) {
        return NextResponse.json(
          { error: 'El negocio no tiene configurada pasarela de pagos' },
          { status: 400 },
        );
      }

      const culqiSecretKey = decrypt(settings.culqiSecretKey);

      const culqiResponse = await fetch('https://api.culqi.com/v2/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${culqiSecretKey}`,
        },
        body: JSON.stringify({
          amount,
          currency_code: currency,
          email: email || 'cliente@culqi.com',
          source_id: token,
          description: `Compra: ${product?.title || 'Producto'} - Store Lite`,
          metadata: { businessId, productId, platform: 'store-lite' },
        }),
      });

      culqiData = await culqiResponse.json();
      const isSuccess = culqiData?.outcome?.type === 'venta_exitosa' || culqiData?.paid === true;

      if (!culqiResponse.ok || !isSuccess) {
        const responseBody = {
          error: 'Error en Culqi',
          details: culqiData?.user_message || culqiData?.outcome?.user_message || 'Pago rechazado',
        };
        await completeIdempotencyKey(reservedIdempotencyKey, responseBody, 400);
        return NextResponse.json(responseBody, { status: 400 });
      }
    }

    const culqiChargeIdForLookup = culqiOrderId || culqiData?.id || null;
    if (culqiChargeIdForLookup) {
      const existingPayment = await db.query.payments.findFirst({
        where: eq(payments.culqiChargeId, culqiChargeIdForLookup),
      });

      if (existingPayment) {
        const responseBody = {
          success: true,
          payment: existingPayment,
          charge: {
            id: culqiChargeIdForLookup,
            status: 'paid',
          },
          replayed: true,
        };
        await completeIdempotencyKey(reservedIdempotencyKey, responseBody, 200);
        return NextResponse.json(responseBody);
      }
    }

    // 🔥 ATOMICITY: Transacción de Base de Datos
    const result = await db.transaction(async (tx) => {
      // 4. Guardar Pago
      const shippingInfo = metadata?.shippingInfo || {};

      // Mapear tipo de courier: urbano_agencia -> agencia, urbano_domicilio -> domicilio, recojo -> recojo
      const shippingType =
        shippingInfo.courier === 'urbano_agencia'
          ? 'agencia'
          : shippingInfo.courier === 'urbano_domicilio'
            ? 'domicilio'
            : 'recojo';

      const pm = paymentMethodOverride || (token?.startsWith('ype_') ? 'yape' : 'card');
      const culqiChargeId = culqiOrderId || culqiData?.id || null;
      const culqiRefCode = culqiData?.reference_code || null;

      const [payment] = await tx
        .insert(payments)
        .values({
          businessId,
          productId,
          sellerUserId: business.ownerId,
          amount: String(amount / 100),
          currency,
          paymentMethod: pm,
          culqiChargeId,
          culqiReferenceCode: culqiRefCode,
          buyerEmail: email || 'cliente@culqi.com',
          buyerPhone: (shippingInfo as any).phone || null,
          buyerDni: (shippingInfo as any).dni || null,
          status: 'paid',
          orderNumber: (metadata?.orderNumber as string) || null,
          shippingType: shippingType as any,
          shippingDepartment: (shippingInfo as any).department || null,
          shippingProvince: (shippingInfo as any).province || null,
          shippingDistrict: (shippingInfo as any).district || null,
          shippingAddress: (shippingInfo as any).address || null,
          shippingAgency: (shippingInfo as any).agency || null,
          shippingPhone: (shippingInfo as any).phone || null,
          shippingCost: String((shippingInfo as any).cost || 0),
          shippingReference: (shippingInfo as any).reference || null,
          metadata: {
            ...metadata,
            culqiId: culqiChargeId,
            ...(customerAuth ? { customerAuth } : {}),
          },
          trackingToken: generateTrackingToken(),
        })
        .returning();

      // 5b. Si es pago contra orden, marcar la orden como pagada
      if (culqiOrderId) {
        await tx
          .update(paymentOrders)
          .set({ status: 'paid', updatedAt: sql`now()` })
          .where(eq(paymentOrders.culqiOrderId, culqiOrderId));
      }

      // 5. Actualizar Stock
      const cartItems = (metadata?.cartItems as { id: string; quantity: number }[]) || [];
      const itemsToUpdate = cartItems.length > 0 ? cartItems : [{ id: productId, quantity: 1 }];

      for (const item of itemsToUpdate) {
        await tx
          .update(products)
          .set({ stock: sql`GREATEST(${products.stock} - ${Math.max(1, item.quantity)}, 0)` })
          .where(eq(products.id, item.id));
      }

      return payment;
    });

    // ─── Notificar al negocio ───
    // Fire-and-forget: no fallar si la notificación falla
    console.log('[DEBUG] Intentando notificar nueva orden para business:', businessId);
    notifyNewOrder(businessId, {
      orderId: result.id,
      customerName: email || 'cliente@culqi.com',
      amount: amount / 100,
      itemsCount: (metadata?.cartItems as { id: string; quantity: number }[])?.length || 1,
    })
      .then(() => {
        console.log('[DEBUG] Notification sent successfully');
      })
      .catch((notifyErr) => {
        console.error('[notifyNewOrder] Error:', notifyErr);
      });

    // Notificar stock bajo/agotado
    const cartItems = (metadata?.cartItems as { id: string; quantity: number }[]) || [];
    const itemsToCheck = cartItems.length > 0 ? cartItems : [{ id: productId, quantity: 1 }];

    for (const item of itemsToCheck) {
      const updatedProduct = await db.query.products.findFirst({
        where: eq(products.id, item.id),
        columns: { id: true, title: true, stock: true },
      });

      if (updatedProduct && updatedProduct.stock === 0) {
        notifyOutOfStock(businessId, {
          productId: updatedProduct.id,
          productName: updatedProduct.title,
        }).catch(() => {});
      } else if (updatedProduct && updatedProduct.stock <= LOW_STOCK_THRESHOLD) {
        notifyLowStock(businessId, {
          productId: updatedProduct.id,
          productName: updatedProduct.title,
          currentStock: updatedProduct.stock,
          minStock: LOW_STOCK_THRESHOLD,
        }).catch(() => {});
      }
    }

    const responseBody = {
      success: true,
      payment: result,
      charge: {
        id: culqiData?.id || culqiOrderId || result.id,
        status: 'paid',
      },
    };

    await completeIdempotencyKey(reservedIdempotencyKey, responseBody, 200);

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('[payment/charge] Critical Error:', error);
    return NextResponse.json({ error: 'Error interno procesando el pago' }, { status: 500 });
  }
}
