/**
 * =====================================================
 * API: POST /api/payment/create-order
 * Backend: Crear orden de pago en Culqi (async methods)
 * =====================================================
 */

import { db } from '@/core/database/client';
import { businessSettings, paymentOrders } from '@/core/database/schema';
import { decrypt } from '@/utils/crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface CulqiOrderResponse {
  object: string;
  id: string;
  amount: number;
  currency_code: string;
  payment_method: string;
  order_number: string;
  client_details: { email: string; phone?: string };
  expiration_date: number; // unix timestamp
  status: string;
  metadata?: Record<string, unknown>;
  cip_code?: string;
  cip_cc_agent?: string;
  cip_cc_user?: string;
  action?: { qr?: { image_url?: string } };
  url_redirect?: string;
  user_message?: string;
  merchant_message?: string;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // 0. Validate Data using Zod
    const { createOrderRequestSchema } = await import('@/features/billing/schemas');
    const validationResult = createOrderRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Datos no válidos' },
        { status: 400 },
      );
    }

    const { amount, currency, email, phone, businessId, productId, description } =
      validationResult.data;

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
          error: 'Configuración inválida: No se permiten llaves sk_live en entorno de desarrollo.',
        },
        { status: 400 },
      );
    }

    // 2. Build Culqi Order payload
    const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setDate(expirationDate.getDate() + 3);

    const culqiOrderBody: Record<string, unknown> = {
      amount,
      currency_code: currency,
      description: description || `Orden Store Lite - ${orderNumber}`,
      order_number: orderNumber,
      client_details: {
        email,
        ...(phone ? { phone } : {}),
      },
      expiration_date: Math.floor(expirationDate.getTime() / 1000),
      confirm: false,
      ...(productId ? { metadata: { businessId, productId, platform: 'store-lite' } } : {}),
    };

    // 3. Call Culqi API with 15s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let culqiResponse: Response;
    let culqiData: CulqiOrderResponse;

    try {
      culqiResponse = await fetch('https://api.culqi.com/v2/orders', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${culqiSecretKey}`,
        },
        body: JSON.stringify(culqiOrderBody),
      });
      clearTimeout(timeout);
      culqiData = await culqiResponse.json();
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return NextResponse.json(
        { error: isAbort ? 'Timeout al procesar la orden' : 'Error de conexión con la pasarela' },
        { status: isAbort ? 504 : 502 },
      );
    }

    if (!culqiResponse.ok) {
      return NextResponse.json(
        {
          error: 'Error en Culqi',
          details: culqiData?.user_message || culqiData?.merchant_message || 'Error desconocido',
        },
        { status: culqiResponse.status },
      );
    }

    // 4. Parse payment method from Culqi response
    const paymentMethod = mapCulqiPaymentMethod(culqiData.payment_method);

    // 5. Extract payment details based on method
    const paymentCode = culqiData.cip_code || null;
    const qrUrl = culqiData.action?.qr?.image_url || null;

    // 6. Persist order in database
    const [order] = await db
      .insert(paymentOrders)
      .values({
        businessId,
        culqiOrderId: culqiData.id,
        amount: String(amount / 100),
        currency,
        status: 'pending',
        paymentMethod,
        paymentCode,
        qrUrl,
        buyerEmail: email,
        buyerPhone: phone || null,
        expirationDate,
        metadata: {
          culqiRaw: {
            orderId: culqiData.id,
            orderNumber: culqiData.order_number,
            createdAt: new Date().toISOString(),
          },
        },
      })
      .returning();

    // 7. Return payment instructions
    return NextResponse.json({
      success: true,
      culqiOrderId: order.culqiOrderId,
      paymentCode: order.paymentCode,
      qrUrl: order.qrUrl,
      expirationDate: order.expirationDate.toISOString(),
    });
  } catch (error) {
    console.error('[payment/create-order] Critical Error:', error);
    return NextResponse.json({ error: 'Error interno procesando la orden' }, { status: 500 });
  }
}

function mapCulqiPaymentMethod(method: string): 'pago_efectivo' | 'billetera_movil' | 'cuotealo' {
  if (method === 'pago_efectivo' || method === 'billetera_movil' || method === 'cuotealo') {
    return method;
  }
  return 'pago_efectivo'; // fallback safe default
}
