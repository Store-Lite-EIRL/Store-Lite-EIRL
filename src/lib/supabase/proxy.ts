// =====================================================
// SUPABASE PROXY CLIENT (Next.js 16)
// =====================================================
// Description: Supabase client for Next.js proxy
// Usage: Import from '@/lib/supabase/proxy'
// =====================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Handles proxy operations (formerly middleware)
 * Handles session refresh and cookie management
 */
export async function updateProxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next();

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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next();
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
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
      pathSegments.length === 1 && !['auth', 'created', 'list-business', 'pricing'].includes(pathSegments[0]);
    const isProductDetail = pathSegments.length === 3 && pathSegments[1] === 'product';
    const isPublicStorefront = isStorefrontBase || isProductDetail;
    const adminSections = new Set(['storage', 'chat', 'settings', 'dashboard']);
    const isBusinessAdminRoute = pathSegments.length >= 2 && adminSections.has(pathSegments[1]);

    // Handle unauthenticated users
    if (!user && !isAuthPage && !isPublicStorefront) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }

    // Handle authenticated users on auth page
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Owner-only enforcement for tenant admin routes
    if (user && isBusinessAdminRoute) {
      const slug = pathSegments[0];
      if (slug) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!ownedBusiness) {
          const url = request.nextUrl.clone();
          url.pathname = '/list-business';
          return NextResponse.redirect(url);
        }
      }
    }

    // Handle business redirection for authenticated users
    if (user && !isCreatePage && !isListPage && !isPricingPage && pathname === '/') {
      return await handleBusinessRedirection(request, supabase, user.id);
    }
  } catch (error) {
    // Gracefully handle fetch failures in proxy/edge runtime
    console.error('Supabase Auth error in Proxy:', error);
  }

  return supabaseResponse;
}

/**
 * Handles redirection for authenticated users without an active business session
 */
async function handleBusinessRedirection(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
) {
  try {
    const { data: userBusinesses, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId);

    if (!error) {
      const url = request.nextUrl.clone();
      if (!userBusinesses || userBusinesses.length === 0) {
        url.pathname = '/created';
      } else {
        url.pathname = '/list-business';
      }
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error('Business redirection fetch failed:', err);
  }

  return NextResponse.next();
}
