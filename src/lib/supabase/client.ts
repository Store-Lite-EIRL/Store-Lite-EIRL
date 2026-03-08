// =====================================================
// SUPABASE BROWSER CLIENT
// =====================================================
// Description: Supabase client for browser/client components
// Usage: Import from '@/lib/supabase/client'
// =====================================================

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Creates a Supabase client for browser-side operations
 * Returns a singleton instance to avoid multi-instance issues in components
 */
export function createClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
