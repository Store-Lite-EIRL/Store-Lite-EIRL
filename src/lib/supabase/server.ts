// =====================================================
// SUPABASE SERVER CLIENT
// =====================================================
// Description: Supabase client for server components and actions
// Usage: Import from '@/lib/supabase/server'
// =====================================================

import { env } from '@/config/env';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations
 * Used in Server Components, Server Actions, and Route Handlers
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }

  // Phase 4: En modo subdominio, las cookies necesitan Domain compartido
  const sharedDomain = env.featureSubdomainRewrite ? env.sharedCookieDomain : null;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            const mergedOptions = { ...options };

            if (sharedDomain) {
              mergedOptions.domain = sharedDomain;
            }

            cookieStore.set(name, value, mergedOptions);
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
