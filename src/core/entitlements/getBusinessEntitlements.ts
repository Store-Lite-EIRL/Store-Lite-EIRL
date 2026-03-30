// =====================================================
// ENTITLEMENTS — Server-side calculation function
// =====================================================
// ⚠️  SERVER ONLY — importar únicamente en:
//   - Server Components (layout.tsx, page.tsx)
//   - Server Actions ('use server')
// Nunca importar en archivos 'use client'
// =====================================================

import { db } from '@/core/database/client';
import { businessSubscriptions, businesses } from '@/core/database/schema';
import { and, desc, eq } from 'drizzle-orm';

import {
  DEFAULT_PLAN,
  PLAN_ENTITLEMENTS,
  type BusinessEntitlements,
  type PlanType,
} from './plans';

/**
 * Calcula los entitlements de un negocio según su plan de suscripción activo.
 *
 * - Si no tiene suscripción activa → plan `basico` (mínimos permisos)
 * - Si el negocio no existe → plan `basico`, isActive: false
 *
 * @example
 * // En layout.tsx (Server Component)
 * const entitlements = await getBusinessEntitlements(business.id);
 *
 * @example
 * // En Server Action
 * const entitlements = await getBusinessEntitlements(businessId);
 * if (!entitlements.hasPaymentGateway) {
 *   return { success: false, error: 'Tu plan no incluye gateway de pago.' };
 * }
 */
export async function getBusinessEntitlements(businessId: string): Promise<BusinessEntitlements> {
  const [business, subscription] = await Promise.all([
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
      columns: { planType: true },
    }),
  ]);

  const plan: PlanType = (subscription?.planType as PlanType) ?? DEFAULT_PLAN;

  return {
    plan,
    isActive: business?.isActive ?? false,
    ...PLAN_ENTITLEMENTS[plan],
  };
}
