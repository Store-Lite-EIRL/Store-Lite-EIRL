/**
 * =====================================================
 * API: POST /api/payment/charge
 * Backend: Crear cargo (charge) en Culqi y guardar payment
 * =====================================================
 */

import { db } from '@/core/database/client';
import { businesses, businessSettings, payments, products } from '@/core/database/schema';
import { generateTrackingToken } from '@/core/utils/trackingToken';
import { notifyLowStock, notifyNewOrder, notifyOutOfStock } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/utils/crypto';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const LOW_STOCK_THRESHOLD = 5;

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
      amount,
      email,
      businessId,
      productId,
      currency = 'PEN',
      phone,
      metadata = {},
    } = validationResult.data;

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

    // 2. Obtener info necesaria para Culqi
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

    // 3. Crear el cargo en Culqi
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

    const culqiData: CulqiChargeResponse = await culqiResponse.json();
    const isSuccess = culqiData.outcome?.type === 'venta_exitosa' || culqiData.paid === true;

    if (!culqiResponse.ok || !isSuccess) {
      return NextResponse.json(
        {
          error: 'Error en Culqi',
          details: culqiData?.user_message || culqiData?.outcome?.user_message || 'Pago rechazado',
        },
        { status: 400 },
      );
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

      const [payment] = await tx
        .insert(payments)
        .values({
          businessId,
          productId,
          sellerUserId: business.ownerId,
          amount: String(amount / 100),
          currency,
          paymentMethod: token.startsWith('ype_') ? 'yape' : 'card',
          culqiChargeId: culqiData.id,
          culqiReferenceCode: culqiData.reference_code || null,
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
          metadata: { ...metadata, culqiId: culqiData.id },
          trackingToken: generateTrackingToken(),
        })
        .returning();

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

    return NextResponse.json({
      success: true,
      payment: result,
      charge: {
        id: culqiData.id,
        status: 'paid',
      },
    });
  } catch (error) {
    console.error('[payment/charge] Critical Error:', error);
    return NextResponse.json({ error: 'Error interno procesando el pago' }, { status: 500 });
  }
}
