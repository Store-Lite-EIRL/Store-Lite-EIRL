// =====================================================
// NEXT.JS PROXY (Next.js 16)
// =====================================================
// Description: Proxy (formerly Middleware) for route protection and session refresh
// Usage: Automatically runs on all routes except static files
// =====================================

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

  // Phase 2: Subdomain storefront rewrite
  // Cuando FEATURE_SUBDOMAIN_REWRITE esta habilitado, detectamos subdominios
  // de negocio (ej: mi-tienda.store-lite.com) y reescribimos el pathname
  // internamente para que Next.js sirva el contenido desde /[slug]/...
  if (env.featureSubdomainRewrite) {
    const hostname = getRequestHostname(request);
    const slug = extractTenantSlugFromHost(hostname);

    if (slug && isTenantHost(hostname)) {
      // Guard: No reescribir si el slug ya esta en el path (evita doble rewrite)
      if (!request.nextUrl.pathname.startsWith(`/${slug}`)) {
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
