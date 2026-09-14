import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip static assets and API routes entirely
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user - allow public pages to render
  if (!user) {
    return response;
  }

  // User authenticated: check for selected business cookie
  const selectedSlug = request.cookies.get('selected_business_slug')?.value;

  // If on root "/" and has selected business → go directly to business
  if (request.nextUrl.pathname === '/' && selectedSlug) {
    return NextResponse.redirect(new URL(`/${selectedSlug}`, request.url));
  }

  // If on root "/" without business → onboarding
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // If on "/list-business" and has selected business → go directly to business
  if (request.nextUrl.pathname === '/list-business' && selectedSlug) {
    return NextResponse.redirect(new URL(`/${selectedSlug}`, request.url));
  }

  // Other paths - continue normally
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
