/**
 * Active route detection for sidebar navigation.
 * Ports exact logic from Navbar.tsx lines 134-145.
 */

/**
 * Check if a navigation path is active given the current pathname.
 *
 * @param path - Navigation item path (e.g., '/mi-tienda/dashboard')
 * @param pathname - Current pathname from router (e.g., '/mi-tienda/dashboard/widgets')
 * @param slug - Business slug (e.g., 'mi-tienda')
 * @returns True if the path matches the current route
 */
export function isActive(path: string, pathname: string, slug: string): boolean {
  // Exact match for root path (e.g., '/mi-tienda' === '/mi-tienda')
  if (path === `/${slug}` && pathname === `/${slug}`) {
    return true;
  }

  // Prefix match for nested routes (e.g., '/mi-tienda/dashboard' matches '/mi-tienda/dashboard/widgets')
  if (path !== `/${slug}` && pathname.startsWith(path)) {
    return true;
  }

  // Special case: storage also matches product detail routes
  // e.g., '/mi-tienda/storage' matches '/mi-tienda/product/123'
  if (path === `/${slug}/storage` && pathname.startsWith(`/${slug}/product/`)) {
    return true;
  }

  return false;
}

/**
 * Check if a navigation path is active for mobile "Más" submenu items.
 * Uses the same logic but with submenu-specific paths.
 */
export function isSubmenuActive(path: string, pathname: string, slug: string): boolean {
  return isActive(path, pathname, slug);
}

/**
 * Get the active item ID from a list of navigation items.
 */
export function getActiveItemId(
  items: { id: string; path: string }[],
  pathname: string,
  slug: string,
): string | null {
  for (const item of items) {
    if (isActive(item.path, pathname, slug)) {
      return item.id;
    }
  }
  return null;
}
