/**
 * Analytics Context
 *
 * Reads the current Supabase session and returns
 * the context needed for event capture: userId, businessId, plan.
 * Used by captureEvent to auto-inject context into PostHog events.
 */

import { createClient } from '@/lib/supabase/server';

export interface AnalyticsContext {
  userId: string | null;
  businessId: string | null;
  plan: string;
}

export async function getAnalyticsContext(): Promise<AnalyticsContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, businessId: null, plan: 'none' };
  }

  // Look up the user's business membership (real table: business_team_members)
  const { data: membership } = await supabase
    .from('business_team_members')
    .select('business_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const businessId = (membership as { business_id: string } | null)?.business_id ?? null;

  // Resolve the plan from the active subscription — the `businesses` table has
  // no plan column; plan lives in `business_subscriptions.plan_type`.
  let plan = 'none';
  if (businessId) {
    const { data: subscription } = await supabase
      .from('business_subscriptions')
      .select('plan_type')
      .eq('business_id', businessId)
      .eq('plan_status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    plan = (subscription as { plan_type: string } | null)?.plan_type ?? 'none';
  }

  return { userId: user.id, businessId, plan };
}
