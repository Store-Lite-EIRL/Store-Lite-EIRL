'use server';

import { resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { payments, products } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
// removed unused imports
import { createClient } from '@/lib/supabase/server';
import { and, eq, gt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createHash, randomBytes } from 'node:crypto';
import { generateTrackingToken } from '@/core/utils/trackingToken';

const CULQI_CHARGE_URL = 'https://api.culqi.com/v2/charges';
const LOW_STOCK_THRESHOLD = 5;

export type PaymentMethod = 'card' | 'yape';

export interface ProcessPaymentInput {
  tokenId: string;
  productId: string;
  businessSlug: string;
  paymentMethod: PaymentMethod;
  buyerEmail: string;
  buyerPhone?: string;
  buyerDni?: string; // ← Agregado para tracking
  amountSoles: number;
  currency?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  paymentId?: string;
  deliveryCode?: string;
  culqiChargeId?: string;
  error?: string;
}

function generateDeliveryCode(): string {
  const bytes = randomBytes(5);
  return Array.from(bytes)
    .map((b) => b % 10)
    .join('');
}

function hashDeliveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function deliveryCodeExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export async function processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
  const {
    tokenId,
    productId,
    businessSlug,
    paymentMethod,
    buyerEmail,
    buyerPhone,
    amountSoles: requestedAmountSoles,
  } = input;

  const sk = process.env.CULQI_SK;
  if (!sk) {
    return { success: false, error: 'Payment gateway not configured (missing CULQI_SK).' };
  }

  const business = (await resolveBusinessSlug(businessSlug))?.business;

  if (!business) {
    return { success: false, error: 'Negocio no encontrado.' };
  }

  if (!business.isActive) {
    return {
      success: false,
      error: 'Este negocio no esta disponible para cobros en este momento.',
    };
  }

  const entitlements = await getBusinessEntitlements(business.id);
  if (!entitlements.hasPaymentGateway) {
    return {
      success: false,
      error: 'La pasarela de pago no está habilitada para este negocio.',
    };
  }

  const product = await db.query.products.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, productId), eq(table.businessId, business.id)),
    columns: { id: true, title: true, price: true, stock: true, currency: true },
  });

  if (!product) {
    return { success: false, error: 'Producto no encontrado.' };
  }

  const authoritativeAmountSoles = Number(product.price);
  if (!Number.isFinite(authoritativeAmountSoles) || authoritativeAmountSoles <= 0) {
    return { success: false, error: 'Monto invalido para el producto seleccionado.' };
  }

  const currency = product.currency || 'PEN';

  const [reservedStock] = await db
    .update(products)
    .set({ stock: sql`${products.stock} - 1`, updatedAt: new Date() })
    .where(and(eq(products.id, product.id), gt(products.stock, 0)))
    .returning({ id: products.id });

  if (!reservedStock) {
    return { success: false, error: 'El producto esta agotado.' };
  }

  const amountCents = Math.round(authoritativeAmountSoles * 100);

  let culqiResponse: Response;
  try {
    culqiResponse = await fetch(CULQI_CHARGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sk}`,
      },
      body: JSON.stringify({
        amount: amountCents,
        currency_code: currency,
        email: buyerEmail,
        source_id: tokenId,
        capture: true,
        metadata: {
          product_id: productId,
          business_slug: business.slug,
          buyer_phone: buyerPhone || '',
        },
      }),
    });
  } catch (networkError) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + 1`, updatedAt: new Date() })
      .where(eq(products.id, product.id));
    return { success: false, error: 'Error de conexion al procesar el pago. Intenta de nuevo.' };
  }

  let chargeData;
  try {
    chargeData = await culqiResponse.json();
  } catch {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + 1`, updatedAt: new Date() })
      .where(eq(products.id, product.id));
    return { success: false, error: 'Error inesperado en la pasarela de pago.' };
  }

  if (!culqiResponse.ok || chargeData.object === 'error') {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + 1`, updatedAt: new Date() })
      .where(eq(products.id, product.id));
    const message =
      chargeData.user_message ||
      chargeData.merchant_message ||
      'El pago fue rechazado. Verifica tus datos e intenta de nuevo.';
    return { success: false, error: message };
  }

  const deliveryCode = generateDeliveryCode();
  const deliveryCodeHash = hashDeliveryCode(deliveryCode);
  const codeExpiresAt = deliveryCodeExpiresAt();

  let paymentRecord: { id: string } | undefined;
  try {
    const [newPayment] = await db
      .insert(payments)
      .values({
        businessId: business.id,
        productId: product.id,
        sellerUserId: business.ownerId,
        amount: String(authoritativeAmountSoles),
        currency,
        paymentMethod,
        culqiChargeId: chargeData.id,
        culqiReferenceCode: chargeData.reference_code || chargeData.id,
        culqiTrackingId: chargeData.outcome?.type || null,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        buyerDni: input.buyerDni || null, // ← Agregado para tracking
        status: 'paid',
        deliveryCodeHash,
        deliveryCodeExpiresAt: codeExpiresAt,
        trackingToken: generateTrackingToken(),
        metadata: {
          culqi_outcome: chargeData.outcome,
          product_title: product.title,
          amount_source: 'server_product_price',
          requested_amount: requestedAmountSoles,
          authoritative_amount: authoritativeAmountSoles,
        },
      })
      .returning({ id: payments.id });

    paymentRecord = newPayment;
  } catch (dbError) {
    console.error('[processPayment] CRITICAL: Charge succeeded but DB insert failed:', {
      culqiChargeId: chargeData.id,
      dbError,
    });
    return {
      success: true,
      culqiChargeId: chargeData.id,
      error:
        'Pago procesado pero hubo un error al crear el registro. Guarda tu ID de cargo: ' +
        chargeData.id,
    };
  }

  revalidatePath(`/${business.slug}`);

  return {
    success: true,
    paymentId: paymentRecord.id,
    deliveryCode,
    culqiChargeId: chargeData.id,
  };
}

export async function getPaymentById(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      product: { columns: { title: true } },
      business: { columns: { name: true, slug: true } },
    },
  });

  if (!payment) {
    return { payment: null, error: 'Pago no encontrado.' };
  }

  if (user?.id !== payment.sellerUserId) {
    return { payment: null, error: 'No autorizado.' };
  }

  return { payment, error: null };
}
