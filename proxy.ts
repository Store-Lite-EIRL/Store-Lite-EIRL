// =====================================================
// NEXT.JS PROXY (Next.js 16)
// =====================================================
// Description: Proxy (formerly Middleware) for route protection and session refresh
// Usage: Automatically runs on all routes except static files
// =====================================

import { type NextRequest } from 'next/server';
import { updateProxy } from './src/lib/supabase/proxy';

/**
 * Proxy function (Next.js 16 convention)
 * Handles:
 * - Session refresh
 * - Route protection
 * - Redirects for authenticated/unauthenticated users
 */
export async function proxy(request: NextRequest) {
  return await updateProxy(request);
}

/**
 * Matcher configuration
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
