// =====================================================
// NEXT.JS PROXY (Next.js 16)
// =====================================================
// Description: Proxy (formerly Middleware) for route protection and session refresh
// Usage: Automatically runs on all routes except static files
// =====================================

import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/rateLimit';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from './src/config/env';
import { updateProxy } from './src/lib/supabase/proxy';
import { extractTenantSlugFromHost, isTenantHost } from './src/shared/utils/url';

/**
 * Proxy function (Next.js 16 convention)
 * Handles:
 * - Session refresh
 * - Route protection
 * - Redirects for authenticated/unauthenticated users
 * - Subdomain storefront rewrite (Phase 2)
 */
export async function proxy(request: NextRequest) {
  let rewriteUrl: URL | null = null;

  // ── Rate limiting (step 0 — before everything else) ────
  // Different limits based on route type.
  // Auth and API routes are rate-limited; storefront is not (for now).
  const pathname = request.nextUrl.pathname;
  let rateLimitConfig: RateLimitConfig | null = null;

  if (pathname.startsWith('/auth/')) {
    rateLimitConfig = RATE_LIMITS.auth;
  } else if (pathname.startsWith('/api/')) {
    rateLimitConfig = RATE_LIMITS.api;
  }

  if (rateLimitConfig) {
    const clientIp = getClientIdentifier(request);
    const result = checkRateLimit(clientIp, rateLimitConfig);

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetInMs / 1000)),
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetInMs / 1000)),
          },
        },
      );
    }
  }

  // Phase 2: Subdomain storefront rewrite
  // Cuando FEATURE_SUBDOMAIN_REWRITE esta habilitado, detectamos subdominios
  // de negocio (ej: mi-tienda.store-lite.com) y reescribimos el pathname
  // internamente para que Next.js sirva el contenido desde /[slug]/...
  if (env.featureSubdomainRewrite) {
    const hostname = getRequestHostname(request);
    const slug = extractTenantSlugFromHost(hostname);

    if (slug && isTenantHost(hostname)) {
      // 🚨 IMPORTANTE: Las rutas /api/* NO se reescriben
      // Las API routes existen en app/api/... y deben resolver en su path
      // canónico, no en /{slug}/api/... Si las reescribimos, dan 404.
      if (request.nextUrl.pathname.startsWith('/api/')) {
        // API routes: no tocar el pathname, dejar que resuelvan en /api/...
        // El proxy igual va a correr updateProxy() para session management.
      } else if (!request.nextUrl.pathname.startsWith(`/${slug}`)) {
        // Guard: No reescribir si el slug ya esta en el path (evita doble rewrite)
        rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/${slug}${request.nextUrl.pathname}`;

        // updateProxy() usa request.nextUrl.pathname para decidir si una ruta
        // es publica/protegida. Mutamos el request para que esa logica vea la
        // ruta interna /{slug}/..., pero el routing real de Next se hace abajo
        // con NextResponse.rewrite(rewriteUrl). NextResponse.next() NO alcanza.
        request.nextUrl.pathname = rewriteUrl.pathname;
      }
    }
  }

  const response = await updateProxy(request);

  // Si hay subdominio tenant, Next necesita un rewrite real para rutear a
  // app/[slug]. Mutar request.nextUrl + NextResponse.next() NO cambia la ruta
  // que resuelve el App Router; por eso antes caia en la landing de '/'.
  // Propagamos las cookies que updateProxy haya modificado.
  if (rewriteUrl && response.status === 200) {
    const rewrittenResponse = NextResponse.rewrite(rewriteUrl, { request });
    response.cookies.getAll().forEach((cookie) => {
      rewrittenResponse.cookies.set(cookie.name, cookie.value);
    });
    return rewrittenResponse;
  }

  return response;
}

/**
 * Obtiene el hostname real de la request.
 *
 * En desarrollo, request.nextUrl.hostname puede normalizarse a "localhost"
 * aunque el navegador haya enviado "store-girl.localhost:3000" en el header
 * Host. Para tenancy por subdominio necesitamos el Host real; si usamos
 * nextUrl.hostname, el proxy no ve el subdominio y termina renderizando "/"
 * (landing del SaaS).
 */
function getRequestHostname(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.hostname
  );
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
