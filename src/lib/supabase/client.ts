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
    if (typeof window !== 'undefined') {
      // Error real en runtime (browser) — que el usuario sepa que falta config
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
      );
    }
    // Durante SSR/build (e.g. _not-found prerender), no podemos tirar error
    // porque rompe la generación estática. En SSR, AuthProvider solo renderiza
    // el provider sin ejecutar lógica de auth (useEffect no corre).
    console.warn(
      '[Supabase] Missing environment variables during SSR. Auth will work when env vars are configured.',
    );
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
