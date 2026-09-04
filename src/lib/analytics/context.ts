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

  // Look up the user's business membership
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, businesses(id, plan)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const businessId = (membership as Record<string, unknown>)?.business_id as string | null;
  const businesses = (membership as Record<string, unknown>)?.businesses as
    | { id: string; plan: string | null }[]
    | null;
  const plan = businesses?.[0]?.plan ?? 'none';

  return { userId: user.id, businessId, plan };
}
