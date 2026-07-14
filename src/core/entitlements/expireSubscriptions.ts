// =====================================================
// EXPIRE SUBSCRIPTIONS — Mass expiration function
// =====================================================
// Updates all subscriptions with planEndDate < now()
// and planStatus = 'active' → planStatus = 'inactive'.
// Then enforces product limits for each expired business.
// Idempotent: running twice has no extra effect.
// =====================================================

import { db } from '@/core/database/client';
import { businessSubscriptions } from '@/core/database/schema';
import { and, eq, lt } from 'drizzle-orm';
import { enforceProductLimit } from './enforceProductLimit';
import { PLAN_ENTITLEMENTS } from './plans';

export async function expireSubscriptions(): Promise<{
  expired: number;
  productsDisabled: number;
}> {
  const result = await db
    .update(businessSubscriptions)
    .set({ planStatus: 'inactive', updatedAt: new Date() })
    .where(
      and(
        lt(businessSubscriptions.planEndDate, new Date()),
        eq(businessSubscriptions.planStatus, 'active'),
      ),
    )
    .returning({
      id: businessSubscriptions.id,
      businessId: businessSubscriptions.businessId,
    });

  let productsDisabled = 0;
  if (result.length > 0) {
    const maxAllowed = PLAN_ENTITLEMENTS.basico.maxProducts;
    for (const sub of result) {
      const disabled = await enforceProductLimit(sub.businessId, maxAllowed);
      productsDisabled += disabled;
    }
  }

  return { expired: result.length, productsDisabled };
}
