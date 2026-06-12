/**
 * =====================================================
 * API: POST /api/billing/purchase-plan
 * Compra de plan SaaS: cobra via Culqi, genera boleta SUNAT
 * =====================================================
 *
 * Flujo:
 *  1. Valida request
 *  2. Calcula montos: subtotal (sin IGV) + IGV 18% + total
 *  3. Cobra en Culqi (claves del SaaS, no del merchant)
 *  4. INSERT plan_payments (correlativo B001 automático por secuencia)
 *  5. UPSERT business_subscriptions (activa/renueva el plan)
 *  6. Dispara generación del PNG de boleta (async, no bloqueante)
 *  7. Retorna { success, planPaymentId, ticketNumber, planActivatedUntil }
 */

import { db } from '@/core/database/client';
import {
  businessSubscriptions,
  formatTicketNumber,
  planPayments,
  type SubscriptionPlan,
} from '@/core/database/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// ─── Precios de planes (sin IGV) en céntimos para Culqi ─────────────────────
// Actualizar aquí cuando cambien los precios. En el futuro pueden venir de BD.
const PLAN_PRICES: Record<SubscriptionPlan, { monthly: number; annual: number; label: string }> = {
  basico: { monthly: 0, annual: 0, label: 'Básico' },
  emprendedor: { monthly: 5900, annual: 59000, label: 'Emprendedor' }, // S/ 59.00 / S/ 590.00
  business_pro: { monthly: 9900, annual: 99000, label: 'Business Pro' }, // S/ 99.00 / S/ 990.00
  enterprise_ai: { monthly: 14900, annual: 149000, label: 'Enterprise AI' }, // S/ 149.00 / S/ 1490.00
};

// Duración de cada período en días
const PERIOD_DAYS: Record<'monthly' | 'annual', number> = {
  monthly: 30,
  annual: 365,
};

interface PurchasePlanBody {
  token: string;
  planType: SubscriptionPlan;
  period: 'monthly' | 'annual';
  businessId: string;
  // Datos del comprador para SUNAT
  buyerEmail: string;
  buyerFullName: string;
  buyerDocumentType: 'DNI' | 'RUC';
  buyerDocumentNumber: string;
  buyerAddress?: string;
}

interface CulqiChargeResponse {
  object: string;
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  paid?: boolean;
  user_message?: string;
  merchant_message?: string;
  outcome?: { type: string; user_message: string; merchant_message: string };
  reference_code?: string;
  creation_date?: number;
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body: PurchasePlanBody = await request.json();

    const {
      token,
      planType,
      period,
      businessId,
      buyerEmail,
      buyerFullName,
      buyerDocumentType,
      buyerDocumentNumber,
      buyerAddress,
    } = body;

    // ── Validación ────────────────────────────────────────────────────────────
    if (!token || !planType || !period || !businessId || !buyerEmail || !buyerDocumentNumber) {
      return NextResponse.json(
        {
          error:
            'Faltan campos requeridos: token, planType, period, businessId, buyerEmail, buyerDocumentNumber',
        },
        { status: 400 },
      );
    }

    const planConfig = PLAN_PRICES[planType];
    if (!planConfig) {
      return NextResponse.json({ error: `Plan desconocido: ${planType}` }, { status: 400 });
    }

    const priceInCentimos = planConfig[period];
    if (priceInCentimos === 0) {
      return NextResponse.json(
        { error: 'El plan Básico es gratuito y no requiere cobro' },
        { status: 400 },
      );
    }

    // ── Calcular montos (en soles, con 2 decimales) ───────────────────────────
    const subtotalSoles = priceInCentimos / 100;
    const igvSoles = roundTwo(subtotalSoles * 0.18);
    const totalSoles = roundTwo(subtotalSoles + igvSoles);
    const totalCentimos = Math.round(totalSoles * 100); // Para Culqi

    // ── Obtener datos del emisor ──────────────────────────────────────────────
    const issuer = await db.query.saasIssuerConfig.findFirst();
    if (!issuer) {
      console.error('[purchase-plan] saas_issuer_config no configurada');
      return NextResponse.json(
        { error: 'Configuración del emisor no encontrada. Contacta al soporte.' },
        { status: 500 },
      );
    }

    // ── Cobrar en Culqi (claves del SaaS, NO del merchant) ───────────────────
    const culqiSecretKey = process.env.CULQI_SK;
    if (!culqiSecretKey) {
      console.error('[purchase-plan] CULQI_SK no configurada');
      return NextResponse.json({ error: 'Pasarela de pagos no configurada' }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let culqiData: CulqiChargeResponse;
    try {
      const culqiResponse = await fetch('https://api.culqi.com/v2/charges', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${culqiSecretKey}`,
        },
        body: JSON.stringify({
          amount: totalCentimos,
          currency_code: 'PEN',
          email: buyerEmail,
          source_id: token,
          description: `Plan ${planConfig.label} ${period === 'monthly' ? 'Mensual' : 'Anual'} - Store Lite`,
          metadata: {
            businessId,
            planType,
            period,
            platform: 'store-lite-saas',
          },
        }),
      });
      clearTimeout(timeout);
      culqiData = await culqiResponse.json();

      const isSuccess = culqiData.outcome?.type === 'venta_exitosa' || culqiData.paid === true;
      if (!culqiResponse.ok || !isSuccess) {
        return NextResponse.json(
          {
            error: 'Error al procesar el pago',
            details:
              culqiData?.user_message ||
              culqiData?.outcome?.user_message ||
              'Error desconocido de Culqi',
          },
          { status: culqiResponse.ok ? 400 : culqiResponse.status },
        );
      }
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return NextResponse.json(
        { error: isAbort ? 'Timeout al procesar el pago' : 'Error de conexión con la pasarela' },
        { status: isAbort ? 504 : 502 },
      );
    }

    // ── Determinar método de pago ─────────────────────────────────────────────
    const paymentMethod = token.startsWith('ype_') ? 'yape' : 'card';

    // ── Transacción: leer suscripción actual, calcular prorrateo, insertar pago y upsert ──
    const { planPayment, planEndDate } = await db.transaction(async (tx) => {
      // Leer suscripción activa actual para prorrateo
      const currentSubscription = await tx.query.businessSubscriptions.findFirst({
        where: and(
          eq(businessSubscriptions.businessId, businessId),
          eq(businessSubscriptions.planStatus, 'active'),
        ),
        columns: { planType: true, planEndDate: true, planStartDate: true },
      });

      // Calcular fechas con prorrateo
      const now = new Date();
      let planStartDate: Date;
      let planEndDate: Date;

      const isRenewal =
        currentSubscription &&
        currentSubscription.planType === planType &&
        currentSubscription.planEndDate &&
        currentSubscription.planEndDate > now;

      if (isRenewal) {
        // Mismo plan vigente → extender desde el fin actual
        planStartDate = currentSubscription.planStartDate ?? now;
        planEndDate = new Date(currentSubscription.planEndDate);
        planEndDate.setDate(planEndDate.getDate() + PERIOD_DAYS[period]);
      } else {
        // Plan diferente o primera compra → comenzar desde hoy
        planStartDate = now;
        planEndDate = new Date(now);
        planEndDate.setDate(planEndDate.getDate() + PERIOD_DAYS[period]);
      }

      // ── Insertar plan_payment ───────────────────────────────────────────────
      // Dejamos que la DB maneje el default del ticketCorrelative via secuencia
      const [planPayment] = await tx
        .insert(planPayments)
        .values({
          businessId,
          planType,
          period,
          amountSubtotal: String(subtotalSoles),
          amountIgv: String(igvSoles),
          amountTotal: String(totalSoles),
          currency: 'PEN',
          paymentMethod: paymentMethod as 'card' | 'yape',
          culqiChargeId: culqiData.id,
          culqiReferenceCode: culqiData.reference_code || null,
          status: 'paid',
          buyerEmail,
          buyerFullName: buyerFullName || null,
          buyerDocumentType: buyerDocumentType || null,
          buyerDocumentNumber: buyerDocumentNumber || null,
          buyerAddress: buyerAddress || null,
          ticketSeries: 'B001',
          ticketIssuedAt: new Date(),
          planStartDate,
          planEndDate,
          metadata: {
            culqiRaw: {
              chargeId: culqiData.id,
              createdAt: culqiData.creation_date
                ? new Date(culqiData.creation_date * 1000).toISOString()
                : new Date().toISOString(),
            },
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
          },
        })
        .returning();

      // ── Activar / renovar suscripción ───────────────────────────────────────
      await tx
        .insert(businessSubscriptions)
        .values({
          businessId,
          planType,
          planStatus: 'active',
          planStartDate,
          planEndDate,
        })
        .onConflictDoUpdate({
          target: businessSubscriptions.businessId,
          set: {
            planType,
            planStatus: 'active',
            planStartDate,
            planEndDate,
            updatedAt: new Date(),
          },
        });

      return { planPayment, planEndDate };
    });

    const ticketNumber = formatTicketNumber(
      planPayment.ticketSeries,
      planPayment.ticketCorrelative,
    );

    return NextResponse.json({
      success: true,
      planPaymentId: planPayment.id,
      ticketNumber,
      planActivatedUntil: planEndDate.toISOString(),
      amountTotal: totalSoles,
    });
  } catch (error) {
    console.error('[purchase-plan] Error inesperado:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    );
  }
}
