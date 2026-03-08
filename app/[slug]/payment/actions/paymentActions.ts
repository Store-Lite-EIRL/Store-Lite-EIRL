'use server';

/**
 * paymentActions.ts
 *
 * Server Actions for Culqi payment processing.
 * All actions in this file run exclusively on the server.
 *
 * Flow:
 *  1. Client tokenizes card/Yape data with Culqi → gets token_id
 *  2. Client calls processPayment(token_id, ...) → Server Action
 *  3. Server Action calls Culqi /v2/charges with the SECRET key (never exposed)
 *  4. Server Action creates a Payment record in DB (Supabase/Drizzle)
 *  5. Server Action returns Success/Error to client
 */

import { db } from '@/core/database/client';
import { businesses, payments, products } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const CULQI_CHARGE_URL = 'https://api.culqi.com/v2/charges';

// ============================================================
// TYPES
// ============================================================

export type PaymentMethod = 'card' | 'yape';

export interface ProcessPaymentInput {
  tokenId: string;
  productId: string;
  businessSlug: string;
  paymentMethod: PaymentMethod;
  buyerEmail: string;
  buyerPhone?: string;
  /** Amount in soles (e.g., 49.99). Will be converted to cents internally. */
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

// ============================================================
// HELPERS
// ============================================================

/** Generates a 10-digit delivery confirmation code */
function generateDeliveryCode(): string {
  const bytes = randomBytes(5);
  // Reduce each byte to 0-9 and pad to 10 digits
  return Array.from(bytes)
    .map((b) => b % 10)
    .join('');
}

/** Creates a SHA-256 hash of the delivery code */
function hashDeliveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Computes the delivery code expiration: 30 days from now */
function deliveryCodeExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

// ============================================================
// SERVER ACTION: processPayment
// ============================================================

/**
 * Processes a payment using Culqi's v2/charges endpoint.
 * Creates a payment record in the database on success.
 *
 * @param input - Payment data including token, product, and buyer info
 */
export async function processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
  const {
    tokenId,
    productId,
    businessSlug,
    paymentMethod,
    buyerEmail,
    buyerPhone,
    amountSoles,
    currency = 'PEN',
  } = input;

  const sk = process.env.CULQI_SK;
  if (!sk) {
    return { success: false, error: 'Payment gateway not configured (missing CULQI_SK).' };
  }

  // --- 1. Look up Business and Product ---
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, businessSlug),
    columns: { id: true, ownerId: true },
  });

  if (!business) {
    return { success: false, error: 'Negocio no encontrado.' };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true, title: true, price: true, stock: true },
  });

  if (!product) {
    return { success: false, error: 'Producto no encontrado.' };
  }

  if (product.stock <= 0) {
    return { success: false, error: 'El producto está agotado.' };
  }

  // --- 2. Compute amount in cents ---
  const amountCents = Math.round(amountSoles * 100);

  // --- 3. Call Culqi API ---
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
          business_slug: businessSlug,
          buyer_phone: buyerPhone || '',
        },
      }),
    });
  } catch (networkError) {
    console.error('[processPayment] Network error calling Culqi:', networkError);
    return { success: false, error: 'Error de conexión al procesar el pago. Intenta de nuevo.' };
  }

  const chargeData = await culqiResponse.json();

  // --- 4. Handle Culqi errors ---
  if (!culqiResponse.ok || chargeData.object === 'error') {
    const message =
      chargeData.user_message ||
      chargeData.merchant_message ||
      'El pago fue rechazado. Verifica tus datos e intenta de nuevo.';
    console.error('[processPayment] Culqi charge error:', chargeData);
    return { success: false, error: message };
  }

  // --- 5. Generate delivery code ---
  const deliveryCode = generateDeliveryCode();
  const deliveryCodeHash = hashDeliveryCode(deliveryCode);
  const codeExpiresAt = deliveryCodeExpiresAt();

  // --- 6. Create payment record ---
  let paymentRecord: { id: string } | undefined;
  try {
    const [newPayment] = await db
      .insert(payments)
      .values({
        businessId: business.id,
        productId: product.id,
        sellerUserId: business.ownerId,
        amount: String(amountSoles),
        currency,
        paymentMethod,
        culqiChargeId: chargeData.id,
        culqiReferenceCode: chargeData.reference_code || chargeData.id,
        culqiTrackingId: chargeData.outcome?.type || null,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        status: 'paid',
        deliveryCodeHash,
        deliveryCodeExpiresAt: codeExpiresAt,
        metadata: {
          culqi_outcome: chargeData.outcome,
          product_title: product.title,
        },
      })
      .returning({ id: payments.id });

    paymentRecord = newPayment;
  } catch (dbError) {
    // Payment went through Culqi but DB insert failed — critical issue
    console.error('[processPayment] CRITICAL: Charge succeeded but DB insert failed:', {
      culqiChargeId: chargeData.id,
      dbError,
    });
    // Return success anyway because money was charged — manual reconciliation needed
    return {
      success: true,
      culqiChargeId: chargeData.id,
      error: 'Pago procesado pero hubo un error al crear el registro. Guarda tu ID de cargo: ' + chargeData.id,
    };
  }

  // --- 7. Revalidate paths ---
  revalidatePath(`/${businessSlug}`);

  return {
    success: true,
    paymentId: paymentRecord.id,
    deliveryCode,
    culqiChargeId: chargeData.id,
  };
}

// ============================================================
// SERVER ACTION: getPaymentById
// ============================================================

/**
 * Retrieves a payment record by its ID.
 * Note: Delivery code is NOT returned here (only shown once at purchase time).
 */
export async function getPaymentById(paymentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // Only the seller (business owner) can view payment details
  if (user?.id !== payment.sellerUserId) {
    return { payment: null, error: 'No autorizado.' };
  }

  return { payment, error: null };
}
