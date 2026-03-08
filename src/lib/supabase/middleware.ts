// =====================================================
// SUPABASE MIDDLEWARE CLIENT
// =====================================================
// Description: Supabase client for Next.js middleware
// Usage: Import from '@/lib/supabase/middleware'
// =====================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Creates a Supabase client for middleware operations
 * Handles session refresh and cookie management
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/auth');
  const isCreatePage = pathname.startsWith('/created');
  const isListPage = pathname.startsWith('/list-business');

  // Identify public storefront paths like /[slug] or /[slug]/product/[id]
  const pathSegments = pathname.split('/').filter(Boolean);
  const isStorefrontBase =
    pathSegments.length === 1 && !['auth', 'created', 'list-business'].includes(pathSegments[0]);
  const isProductDetail = pathSegments.length === 3 && pathSegments[1] === 'product';
  const isPublicStorefront = isStorefrontBase || isProductDetail;

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

  // Handle business redirection for authenticated users
  if (user && !isCreatePage && !isListPage && pathname === '/') {
    return await handleBusinessRedirection(request, supabase, user.id);
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

  // Fallback: if business lookup fails, continue with normal request flow.
  return NextResponse.next({
    request,
  });
}
