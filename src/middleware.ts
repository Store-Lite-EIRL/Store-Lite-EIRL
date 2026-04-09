import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle Supabase session refresh and route protection.
 * 
 * Logic implemented:
 * - Logged-in users: Redirected from '/' and '/auth' to '/list-business'.
 * - Logged-out users: Redirected from '/list-business' and '/pricing' to '/auth'.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // IMPORTANT: Avoid using getUser() if you only need to check if a session exists.
  // However, for strict protection, getUser() is safer as it validates the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Define route groups
  const isAuthPage = path.startsWith('/auth');
  const isLandingPage = path === '/';
  // Protected routes for logged-in users only
  const isProtectedRoute = path.startsWith('/list-business') || path.startsWith('/pricing');
  
  // Public routes that should always be accessible (like storefronts)
  // Storefronts follow the pattern /[slug] - which is any top-level path that isn't reserved.
  // Next.js middleware matchers and our logic below handle this.

  // 1. Redirect AUTHENTICATED users away from public landing/auth pages
  if (user) {
    if (isLandingPage || isAuthPage) {
      if (path !== '/auth/callback') { // Don't interrupt the callback itself
        return NextResponse.redirect(new URL('/list-business', request.url));
      }
    }
  } 
  // 2. Redirect UNAUTHENTICATED users away from protected dashboard pages
  else {
    if (isProtectedRoute) {
        // Option: we could allow /pricing to be public if needed, 
        // but per user request, we restrict it.
        return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
