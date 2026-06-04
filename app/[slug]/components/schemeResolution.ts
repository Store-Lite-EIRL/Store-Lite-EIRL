import type { StorefrontColorScheme } from '@/core/storefront';

/**
 * Resolves the effective color scheme using priority order:
 * viewer (user toggle) > preview (admin editor) > effective (business default)
 */
export function resolveActiveScheme(
  viewer: 'light' | 'dark' | null,
  preview: StorefrontColorScheme | undefined,
  effective: StorefrontColorScheme,
): StorefrontColorScheme {
  return viewer ?? preview ?? effective;
}
