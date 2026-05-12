'use server';

import { db } from '@/core/database/client';
import { businesses, businessSubscriptions } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function upgradeBusinessPlan(businessId: string, planType: string) {
  try {
    const validPlans = ['basico', 'emprendedor', 'business_pro', 'enterprise_ai'] as const;
    if (!validPlans.includes(planType as (typeof validPlans)[number])) {
      return { success: false, error: 'Plan no valido' };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const business = await db.query.businesses.findFirst({
      where: and(eq(businesses.id, businessId), eq(businesses.ownerId, user.id)),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: 'No autorizado' };
    }

    const currentActivePlan = await db.query.businessSubscriptions.findFirst({
      where: and(
        eq(businessSubscriptions.businessId, businessId),
        eq(businessSubscriptions.planStatus, 'active'),
      ),
      columns: { planType: true },
    });

    if (currentActivePlan?.planType === planType) {
      return { success: true, unchanged: true };
    }

    const isPaidPlan = planType !== 'basico';
    const allowMockPaidActivation = process.env.NODE_ENV !== 'production';
    if (isPaidPlan && !allowMockPaidActivation) {
      return { success: false, error: 'La activacion requiere verificacion de pago' };
    }

    const mockSubscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 10)}`;
    const mockCustomerId = `cus_mock_${Math.random().toString(36).substring(2, 10)}`;

    const endDate = new Date();
    if (planType !== 'basico') {
      endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setHours(endDate.getHours() + 24);
    }

    await db
      .update(businessSubscriptions)
      .set({ planStatus: 'inactive', planUpdatedAt: new Date() })
      .where(
        and(
          eq(businessSubscriptions.businessId, businessId),
          eq(businessSubscriptions.planStatus, 'active'),
        ),
      );

    await db.insert(businessSubscriptions).values({
      businessId,
      planType: planType as (typeof validPlans)[number],
      planStatus: 'active',
      planStartDate: new Date(),
      planEndDate: planType !== 'basico' ? endDate : null,
      gatewaySubscriptionId: planType === 'basico' ? null : mockSubscriptionId,
      gatewayCustomerId: planType === 'basico' ? null : mockCustomerId,
      gatewayPlanId: planType === 'basico' ? null : `price_${planType}`,
      cancelAtPeriodEnd: false,
    });

    revalidatePath('/list-business');
    revalidatePath('/pricing');

    return { success: true };
  } catch (error) {
    console.error('Failed to upgrade plan:', error);
    return { success: false, error: 'Ocurrio un error al actualizar el plan.' };
  }
}
