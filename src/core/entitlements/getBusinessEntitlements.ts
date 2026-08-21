// =====================================================
// ENTITLEMENTS — Server-side calculation function
// =====================================================
// ⚠️  SERVER ONLY — importar únicamente en:
//   - Server Components (layout.tsx, page.tsx)
//   - Server Actions ('use server')
// Nunca importar en archivos 'use client'
// =====================================================

import { db } from '@/core/database/client';
import { businessSettings, businessSubscriptions, businesses } from '@/core/database/schema';
import { and, desc, eq } from 'drizzle-orm';

import { enforceProductLimit } from './enforceProductLimit';
import { DEFAULT_PLAN, PLAN_ENTITLEMENTS, type BusinessEntitlements, type PlanType } from './plans';

/**
 * Calcula los entitlements de un negocio según su plan de suscripción activo.
 * Además verifica si el negocio tiene configurada su pasarela de pago.
 */
export async function getBusinessEntitlements(businessId: string): Promise<BusinessEntitlements> {
  const [business, subscription, settings] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { isActive: true },
    }),
    db.query.businessSubscriptions.findFirst({
      where: and(
        eq(businessSubscriptions.businessId, businessId),
        eq(businessSubscriptions.planStatus, 'active'),
      ),
      orderBy: [desc(businessSubscriptions.createdAt)],
      columns: { planType: true, planEndDate: true },
    }),
    db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: { culqiPublicKey: true, culqiSecretKey: true },
    }),
  ]);

  // Verificar expiración: si planEndDate ya pasó, degradar a Free
  const now = new Date();
  const isExpired = subscription?.planEndDate instanceof Date && subscription.planEndDate < now;

  // Track previous plan for enforcement comparison
  const previousPlan = !subscription ? null : (subscription.planType as PlanType);

  let plan: PlanType;
  if (!subscription || isExpired) {
    if (isExpired) {
      console.warn(
        `[entitlements] Business ${businessId} plan expired (${subscription?.planEndDate?.toISOString()}), degrading to ${DEFAULT_PLAN}`,
      );
    }
    plan = DEFAULT_PLAN;
  } else {
    plan = subscription.planType as PlanType;
  }

  // Safety net: ensure product count is within plan limits on degradation
  if (previousPlan !== null && previousPlan !== plan) {
    await enforceProductLimit(businessId, PLAN_ENTITLEMENTS[plan].maxProducts);
  }

  const isPaymentConfigured = Boolean(settings?.culqiPublicKey && settings?.culqiSecretKey);
  const planEndDate = subscription?.planEndDate?.toISOString() ?? null;

  return {
    plan,
    isActive: business?.isActive ?? false,
    ...PLAN_ENTITLEMENTS[plan],
    isPaymentConfigured,
    culqiPublicKey: settings?.culqiPublicKey ?? undefined,
    planEndDate,
  };
}
