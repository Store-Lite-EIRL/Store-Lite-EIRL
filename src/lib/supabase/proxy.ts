// =====================================================
// SUPABASE PROXY CLIENT
// =====================================================
// Description: Supabase client for Next.js proxy
// Usage: Import from '@/lib/supabase/proxy'
// =====================================================

import { env } from '@/config/env';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Handles proxy operations
 * Handles session refresh and cookie management
 */
export async function updateProxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Phase 4: Cookie domain compartido para subdominios
  // Cuando FEATURE_SUBDOMAIN_REWRITE está activo y SHARED_COOKIE_DOMAIN está configurado,
  // las cookies de sesión se setean con Domain=.store-lite.com para que el navegador
  // las envíe a todos los subdominios.
  const sharedDomain = env.featureSubdomainRewrite ? env.sharedCookieDomain : null;

  // Almacén de opciones de cookies para propagarlas correctamente en redirects
  // (supabaseResponse.cookies.getAll() solo devuelve name/value, sin options)
  const cookieOptionsStore = new Map<string, { value: string; options: Record<string, unknown> }>();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Propagate cookies to request (solo value, no necesita options)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        // Update response to include mutated request so server components see the refreshed token
        supabaseResponse = NextResponse.next({
          request,
        });

        // Propagate cookies to response for the browser
        // Si estamos en modo subdominio, agregamos Domain a las opciones
        cookiesToSet.forEach(({ name, value, options }) => {
          const mergedOptions: Record<string, unknown> = { ...options };

          if (sharedDomain) {
            mergedOptions.domain = sharedDomain;
          }

          supabaseResponse.cookies.set(name, value, mergedOptions);
          cookieOptionsStore.set(name, { value, options: mergedOptions });
        });
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser().

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;
    const isAuthPage = pathname.startsWith('/auth');
    const isCreatePage = pathname.startsWith('/created');
    const isListPage = pathname.startsWith('/list-business');
    const isPricingPage = pathname.startsWith('/pricing');

    // Identify public storefront paths like /[slug] or /[slug]/product/[id]
    const pathSegments = pathname.split('/').filter(Boolean);
    const isStorefrontBase =
      pathSegments.length === 1 &&
      !['auth', 'created', 'list-business', 'pricing'].includes(pathSegments[0]);
    const isProductDetail = pathSegments.length === 3 && pathSegments[1] === 'product';
    const isPublicStorefront = isStorefrontBase || isProductDetail;

    // Helper to return redirects while preserving refreshed cookies
    // Usa cookieOptionsStore en vez de getAll() porque necesitamos las options (domain, httpOnly, etc.)
    const redirectWithCookies = (url: URL) => {
      const redirectResponse = NextResponse.redirect(url);

      for (const [name, { value, options }] of cookieOptionsStore) {
        redirectResponse.cookies.set(name, value, options);
      }

      return redirectResponse;
    };

    const isRootPage = pathname === '/';

    // Handle unauthenticated users
    if (!user && !isAuthPage && !isPublicStorefront && !isRootPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      return redirectWithCookies(url);
    }

    // Handle authenticated users on auth page
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return redirectWithCookies(url);
    }

    // Handle business redirection for authenticated users
    if (user && !isCreatePage && !isListPage && !isPricingPage && pathname === '/') {
      const { data: userBusinesses, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id);

      if (!error) {
        const url = request.nextUrl.clone();
        if (!userBusinesses || userBusinesses.length === 0) {
          url.pathname = '/created';
        } else {
          url.pathname = '/list-business';
        }
        return redirectWithCookies(url);
      }
    }
  } catch (error) {
    // Gracefully handle fetch failures in proxy/edge runtime
    console.error('Supabase Auth error in Proxy:', error);
  }

  return supabaseResponse;
}
