// =====================================================
// URL HELPERS — Business URL construction
// =====================================================
// Description: Centralized URL building for business storefronts.
//   Phase 1: produces path-based URLs (store-lite.com/{slug}/...).
//   Future: can be switched to subdomain-based URLs ({slug}.store-lite.com/...)
//   without changing callers.
// =====================================================

import { env } from '@/config/env';

/**
 * Subdominios reservados que NO deben resolverse como negocios.
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'dashboard',
  'mail',
  'support',
  'static',
  'assets',
  'cdn',
  'docs',
  'blog',
  'status',
] as const;

export type ReservedSubdomain = (typeof RESERVED_SUBDOMAINS)[number];

/**
 * Construye un path relativo para un negocio.
 *
 * Cuando NO estamos en modo subdominio (path-based):
 *   getBusinessPath('mi-tienda', '/dashboard')  →  '/mi-tienda/dashboard'
 *   getBusinessPath('mi-tienda')                 →  '/mi-tienda'
 *
 * Cuando SÍ estamos en modo subdominio:
 *   getBusinessPath('mi-tienda', '/dashboard')  →  '/dashboard'
 *   getBusinessPath('mi-tienda')                 →  ''
 *   (el slug ya está en el hostname, no se duplica en el path)
 *
 * La detección del modo es automática:
 *   - Server-side: usa la feature flag FEATURE_SUBDOMAIN_REWRITE
 *   - Client-side: detecta el subdominio desde window.location.hostname
 */
export function getBusinessPath(slug: string, path = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanPath = normalizedPath === '/' ? '' : normalizedPath;

  // Fase 5: en modo subdominio el slug ya está en el hostname,
  // devolvemos solo el path para evitar URLs duplicadas como:
  //   tienda-1.store-lite.com/tienda-1/dashboard  (MAL)
  //   tienda-1.store-lite.com/dashboard           (BIEN)
  if (isSubdomainModeForSlug(slug)) {
    return cleanPath;
  }

  // Modo path-based: /{slug}/{path}
  return `/${slug}${cleanPath}`;
}

/**
 * Determina si la navegación actual está en modo subdominio para un slug dado.
 *
 * Server-side: evalúa la feature flag FEATURE_SUBDOMAIN_REWRITE.
 * Client-side: detecta dinámicamente si el hostname actual corresponde al slug
 * (ej: en mi-tienda.localhost:3000, el hostname contiene 'mi-tienda' como subdominio).
 */
function isSubdomainModeForSlug(slug: string): boolean {
  // Client-side: el hostname revela si ya estamos en un subdominio que coincide
  if (typeof window !== 'undefined') {
    const hostSlug = extractTenantSlugFromHost(window.location.hostname);
    return hostSlug === slug;
  }

  // Server-side: confiar en la feature flag
  return env.featureSubdomainRewrite;
}

/**
 * Construye una URL canónica completa para un negocio.
 * Usada para SEO: JSON-LD, Open Graph, canonical link.
 *
 * Cuando FEATURE_SUBDOMAIN_REWRITE está activo, genera URLs con subdominio:
 *   getCanonicalBusinessUrl('mi-tienda', '/producto/123')
 *   → 'http://mi-tienda.localhost:3000/producto/123'  (dev)
 *   → 'https://mi-tienda.store-lite.com/producto/123'  (prod)
 *
 * Cuando está inactivo, genera URLs por path:
 *   getCanonicalBusinessUrl('mi-tienda', '/producto/123')
 *   → 'http://localhost:3000/mi-tienda/producto/123'
 */
export function getCanonicalBusinessUrl(slug: string, path = ''): string {
  const base = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (env.featureSubdomainRewrite) {
    const url = new URL(base);
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${slug}.${url.hostname}${port}${normalizedPath === '/' ? '' : normalizedPath}`;
  }

  return `${base}${getBusinessPath(slug, path)}`;
}

/**
 * Retorna la URL base de la aplicación.
 * En Fase 3 se puede reemplazar con detección dinámica de hostname.
 */
function getBaseUrl(): string {
  // Usamos la variable de entorno si está disponible
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback para entorno de desarrollo
  return 'http://localhost:3000';
}

/**
 * Determina si un hostname corresponde a un subdominio de negocio.
 * Útil para el proxy rewrite (Fase 2).
 */
export function isTenantHost(hostname: string): boolean {
  const slug = extractTenantSlugFromHost(hostname);
  return slug !== null && !isReservedSubdomain(slug);
}

/**
 * Extrae el slug del negocio desde un hostname con subdominio.
 *
 * Ejemplo (producción):
 *   extractTenantSlugFromHost('mi-tienda.store-lite.com')  →  'mi-tienda'
 *   extractTenantSlugFromHost('store-lite.com')             →  null
 *   extractTenantSlugFromHost('admin.store-lite.com')       →  'admin' (pero es reservado)
 *
 * Ejemplo (local — .localhost):
 *   extractTenantSlugFromHost('mitienda.localhost')         →  'mitienda'
 *   extractTenantSlugFromHost('localhost')                  →  null
 */
export function extractTenantSlugFromHost(hostname: string): string | null {
  // Remover puerto si existe
  const host = hostname.split(':')[0];

  // Extraer subdominios del hostname
  // Para store-lite.com → parts = ['store-lite', 'com'] → sin subdominio
  // Para mi-tienda.store-lite.com → parts = ['mi-tienda', 'store-lite', 'com'] → subdominio = 'mi-tienda'
  const parts = host.split('.');

  // El TLD .localhost es especial para desarrollo local.
  //   mitienda.localhost → ['mitienda', 'localhost'] → 2 partes, slug = 'mitienda'
  //   localhost          → ['localhost']             → 1 parte,  sin subdominio
  // Para TLDs normales se requieren ≥3 partes (slug.domain.tld).
  const isLocalhostTld = parts.length > 0 && parts[parts.length - 1] === 'localhost';
  const minParts = isLocalhostTld ? 2 : 3;

  if (parts.length < minParts) {
    return null;
  }

  // El primer segmento es el potencial slug de negocio
  const potentialSlug = parts[0];

  // Validar que sea un slug válido (solo minúsculas, números, guiones)
  // Dos regex separados para evitar ReDoS: primero formato general, después borde con guion
  if (!/^[a-z0-9][a-z0-9-]{0,61}$/.test(potentialSlug)) {
    return null;
  }
  // No puede empezar ni terminar con guion
  if (potentialSlug.startsWith('-') || potentialSlug.endsWith('-')) {
    return null;
  }

  return potentialSlug;
}

/**
 * Verifica si un string es un subdominio reservado.
 */
export function isReservedSubdomain(slug: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(slug.toLowerCase());
}
