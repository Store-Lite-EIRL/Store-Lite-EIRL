// =====================================================
// NEXT.JS MIDDLEWARE
// =====================================================
// Description: Middleware for route protection and session refresh
// Usage: Automatically runs on all routes except static files
// =====================================================

import { type NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';

/**
 * Middleware function that handles:
 * - Session refresh
 * - Route protection
 * - Redirects for authenticated/unauthenticated users
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher configuration
 * Specifies which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
