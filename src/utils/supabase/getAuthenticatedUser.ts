// =====================================================
// GET AUTHENTICATED USER HELPER
// =====================================================
// Description: Server helper to get current authenticated user
// Usage: const user = await getAuthenticatedUser();
// =====================================================

import { createClient } from '@/lib/supabase/server';
import type { AuthUser } from '@/types/auth';

/**
 * Retrieves the currently authenticated user from Supabase session
 * Use this in Server Components, Server Actions, and Route Handlers
 * @returns {Promise<AuthUser | null>} The authenticated user or null
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch full profile if needed
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return {
    ...user,
    profile: profile || undefined,
  } as AuthUser;
}
