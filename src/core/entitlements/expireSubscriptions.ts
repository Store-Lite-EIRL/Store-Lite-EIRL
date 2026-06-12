// =====================================================
// EXPIRE SUBSCRIPTIONS — Mass expiration function
// =====================================================
// Updates all subscriptions with planEndDate < now()
// and planStatus = 'active' → planStatus = 'inactive'.
// Idempotent: running twice has no extra effect.
// =====================================================

import { db } from '@/core/database/client';
import { businessSubscriptions } from '@/core/database/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function expireSubscriptions(): Promise<{ expired: number }> {
  const result = await db
    .update(businessSubscriptions)
    .set({ planStatus: 'inactive', updatedAt: new Date() })
    .where(
      and(
        lt(businessSubscriptions.planEndDate, new Date()),
        eq(businessSubscriptions.planStatus, 'active'),
      ),
    )
    .returning({ id: businessSubscriptions.id });

  return { expired: result.length };
}
