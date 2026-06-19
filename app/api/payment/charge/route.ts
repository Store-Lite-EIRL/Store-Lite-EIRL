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
import { paymentRateLimiter } from '@/core/payments/rateLimiter';
import { generateTrackingToken } from '@/core/utils/trackingToken';
import { notifyLowStock, notifyNewOrder, notifyOutOfStock } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import type { CulqiChargeResponse } from '@/types/culqi';
import { decrypt } from '@/utils/crypto';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const LOW_STOCK_THRESHOLD = 5;

// ─── Internal types ─────────────────────────────────────────────────
interface ShippingInfoData {
  phone?: string | null;
  dni?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
  address?: string | null;
  agency?: string | null;
  cost?: number | string;
  reference?: string | null;
  courier?: string;
}

// ─── Helper: Resolve and validate Culqi secret key ──────────────────
async function resolveCulqiSecretKey(
  businessId: string,
): Promise<{ secretKey: string; error: NextResponse | null }> {
  const settings = await db.query.businessSettings.findFirst({
    where: eq(businessSettings.businessId, businessId),
    columns: { culqiSecretKey: true },
  });

  if (!settings?.culqiSecretKey) {
    return {
      secretKey: '',
      error: NextResponse.json(
        { error: 'El negocio no tiene configurada pasarela de pagos' },
        { status: 400 },
      ),
    };
  }

  const secretKey = decrypt(settings.culqiSecretKey);
  const isProd = process.env.NODE_ENV === 'production';
  const isKeyLive = secretKey.startsWith('sk_live');

  if (isProd && !isKeyLive) {
    return {
      secretKey: '',
      error: NextResponse.json(
        { error: 'Configuración inválida: Se requiere una llave de producción (sk_live).' },
        { status: 400 },
      ),
    };
  }

  if (!isProd && isKeyLive) {
    return {
      secretKey: '',
      error: NextResponse.json(
        {
          error: 'Configuración inválida: No se permiten llaves sk_live en entorno de desarrollo.',
        },
        { status: 400 },
      ),
    };
  }

  return { secretKey, error: null };
}

// ─── Helper: Execute Culqi charge API call ──────────────────────────
interface ExecuteCulqiChargeParams {
  token: string;
  secretKey: string;
  amount: number;
  currency: string;
  email?: string;
  productTitle?: string;
  businessId: string;
  productId: string;
}

async function executeCulqiCharge({
  token,
  secretKey,
  amount,
  currency,
  email,
  productTitle,
  businessId,
  productId,
}: ExecuteCulqiChargeParams): Promise<{
  culqiData: CulqiChargeResponse;
  error: NextResponse | null;
}> {
  const response = await fetch('https://api.culqi.com/v2/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      amount,
      currency_code: currency,
      email: email || 'cliente@culqi.com',
      source_id: token,
      description: `Compra: ${productTitle || 'Producto'} - Store Lite`,
      metadata: { businessId, productId, platform: 'store-lite' },
    }),
  });

  const culqiData: CulqiChargeResponse = await response.json();
  const isSuccess = culqiData?.outcome?.type === 'venta_exitosa' || culqiData?.paid === true;

  if (!response.ok || !isSuccess) {
    return {
      culqiData,
      error: NextResponse.json(
        {
          error: 'Error en Culqi',
          details: culqiData?.user_message || culqiData?.outcome?.user_message || 'Pago rechazado',
        },
        { status: 400 },
      ),
    };
  }

  return { culqiData, error: null };
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
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
      customerAuth,
      metadata = {},
    } = validationResult.data;

    // ─── Rate Limit Check ──────────────────────────────────────────
    if (!paymentRateLimiter.check(`${businessId}:${productId}`)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Esperá unos segundos antes de reintentar.' },
        { status: 429 },
      );
    }

    // ─── FLOW BRANCHING ─────────────────────────────────────────────
    let culqiData: CulqiChargeResponse | null = null;
    const isOrderFlow = !!culqiOrderId;
    const isTokenFlow = !!token;

    if (isOrderFlow) {
      // ORDER-BASED: Culqi Checkout ya cobró contra la orden
      // Solo creamos el payment en DB y marcamos la orden como pagada
    } else if (isTokenFlow) {
      // TOKEN-BASED: Ejecutar el cargo contra Culqi con la key del negocio
      const { secretKey, error: keyError } = await resolveCulqiSecretKey(businessId);
      if (keyError) return keyError;

      const { culqiData: chargeResult, error: chargeError } = await executeCulqiCharge({
        token,
        secretKey,
        amount,
        currency,
        email,
        productTitle: undefined, // product title not needed for charge
        businessId,
        productId,
      });
      if (chargeError) return chargeError;
      culqiData = chargeResult;
    }

    // ─── COMMON: Business lookup + Security checks ────────
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { ownerId: true },
    });

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
    const result = await db.transaction(
      // eslint-disable-next-line complexity
      async (tx) => {
        // 4. Guardar Pago
        const rawShipping = (metadata?.shippingInfo || {}) as ShippingInfoData;

        // Mapear tipo de courier
        let shippingType: 'agencia' | 'domicilio' | 'recojo';
        if (rawShipping.courier === 'urbano_agencia') {
          shippingType = 'agencia';
        } else if (rawShipping.courier === 'urbano_domicilio') {
          shippingType = 'domicilio';
        } else {
          shippingType = 'recojo';
        }

        let pm: 'card' | 'yape';
        if (isOrderFlow) {
          pm = 'card';
        } else if (token?.startsWith('ype_')) {
          pm = 'yape';
        } else {
          pm = 'card';
        }
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
            buyerPhone: rawShipping.phone ?? null,
            buyerDni: rawShipping.dni ?? null,
            status: 'paid',
            orderNumber: (metadata?.orderNumber as string) ?? null,
            shippingType,
            shippingDepartment: rawShipping.department ?? null,
            shippingProvince: rawShipping.province ?? null,
            shippingDistrict: rawShipping.district ?? null,
            shippingAddress: rawShipping.address ?? null,
            shippingAgency: rawShipping.agency ?? null,
            shippingPhone: rawShipping.phone ?? null,
            shippingCost: String(rawShipping.cost ?? 0),
            shippingReference: rawShipping.reference ?? null,
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
      },
    );

    // ─── Notificar al negocio ───
    // Fire-and-forget: no fallar si la notificación falla
    notifyNewOrder(businessId, {
      orderId: result.id,
      customerName: email || 'cliente@culqi.com',
      amount: amount / 100,
      itemsCount: (metadata?.cartItems as { id: string; quantity: number }[])?.length || 1,
    }).catch((notifyErr) => {
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
