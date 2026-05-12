// =====================================================
// HOOKS — usePermissions
// =====================================================
// Client-side hook to access user permissions
// =====================================================

'use client';

import type { MemberPermissions } from '@/lib/permissions/checkPermission';
import type { Permission, Role } from '@/lib/permissions/definitions';
import { useCallback, useEffect, useState } from 'react';

interface UsePermissionsReturn {
  permissions: Permission[];
  role: Role | null;
  isOwner: boolean;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
}

interface UsePermissionsOptions {
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Business slug instead of ID (for URL-based fetching) */
  slug?: string;
}

/**
 * Hook para obtener y verificar permisos del usuario actual.
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   const { can, isOwner } = usePermissions({ slug: 'mi-negocio' });
 *
 *   return (
 *     <div>
 *       <h1>Productos</h1>
 *       {can('products.create') && <Button>Crear producto</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(
  businessIdOrOptions?: string | UsePermissionsOptions,
  options?: UsePermissionsOptions,
): UsePermissionsReturn {
  // Normalize parameters
  const businessId =
    typeof businessIdOrOptions === 'string'
      ? businessIdOrOptions
      : options?.slug
        ? undefined
        : undefined;

  const slug =
    typeof businessIdOrOptions === 'string'
      ? undefined
      : businessIdOrOptions?.slug || options?.slug;

  const autoFetch =
    typeof businessIdOrOptions === 'string' ? true : (businessIdOrOptions?.autoFetch ?? true);

  const [data, setData] = useState<MemberPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/api/business/permissions';
      if (businessId) {
        url += `?businessId=${businessId}`;
      } else if (slug) {
        url += `?slug=${slug}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error fetching permissions');
      }

      const result = await response.json();
      setData({
        isOwner: result.isOwner,
        role: result.role,
        permissions: result.permissions,
      });
    } catch (err) {
      console.error('[usePermissions] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData({ isOwner: false, role: null, permissions: [] });
    } finally {
      setIsLoading(false);
    }
  }, [businessId, slug]);

  useEffect(() => {
    if (autoFetch) {
      fetchPermissions();
    }
  }, [autoFetch, fetchPermissions]);

  const can = useCallback(
    (permission: Permission): boolean => {
      if (data?.isOwner) return true;
      return data?.permissions.includes(permission) ?? false;
    },
    [data],
  );

  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (data?.isOwner) return true;
      return permissions.some((p) => data?.permissions.includes(p));
    },
    [data],
  );

  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (data?.isOwner) return true;
      return permissions.every((p) => data?.permissions.includes(p));
    },
    [data],
  );

  return {
    permissions: data?.permissions ?? [],
    role: data?.role ?? null,
    isOwner: data?.isOwner ?? false,
    isLoading,
    can,
    canAny,
    canAll,
  };
}
