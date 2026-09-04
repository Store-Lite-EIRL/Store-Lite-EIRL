import { getBusinessPath } from '@/shared/utils/url';
import type { NavItemData, Permission } from './types';

interface BuildNavItemsOptions {
  slug: string;
  planName: string;
  permissions: Permission[];
  isOwner: boolean;
}

/**
 * Build navigation items based on user permissions, plan, and ownership.
 * Ports exact filtering logic from Navbar.tsx lines 174-214.
 *
 * @param options - Configuration options
 * @returns Filtered array of NavItemData
 */
export function buildNavItems(options: BuildNavItemsOptions): NavItemData[] {
  const { slug, planName, permissions, isOwner } = options;

  const can = (permission: Permission): boolean => {
    if (isOwner) return true;
    return permissions.includes(permission);
  };

  // Define all possible navigation items with their requirements
  const allItems: NavItemData[] = [
    {
      id: 'home',
      icon: 'home',
      label: 'Inicio',
      path: getBusinessPath(slug),
    },
    {
      id: 'chat',
      icon: 'chat',
      label: 'Mensajes',
      path: getBusinessPath(slug, '/chat'),
      permission: 'chat.view',
    },
    {
      id: 'notifications',
      icon: 'notifications',
      label: 'Notificaciones',
      path: getBusinessPath(slug, '/notifications'),
      permission: 'notifications.view',
      badge: '0', // Will be replaced by Supabase real-time badge
    },
    {
      id: 'storage',
      icon: 'package_2',
      label: 'Almacén',
      path: getBusinessPath(slug, '/storage'),
      permission: 'products.view', // or categories.view
    },
    {
      id: 'feedback',
      icon: 'feedback',
      label: 'Ayuda',
      path: getBusinessPath(slug, '/ayuda'),
    },
    {
      id: 'dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      path: getBusinessPath(slug, '/dashboard'),
      permission: 'dashboard.view',
      plan: 'basico', // Hidden when plan is 'basico'
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Ajustes',
      path: getBusinessPath(slug, '/settings'),
    },
  ];

  // Filter items based on plan and permissions
  return allItems.filter((item) => {
    // 1. Owner bypasses ALL filters (plan and permissions)
    if (isOwner) {
      return true;
    }

    // 2. Plan-based filtering
    // Hide dashboard if plan is 'basico' (case-insensitive)
    if (item.plan && planName.toLowerCase() === item.plan.toLowerCase()) {
      return false;
    }

    // 3. Permission-based filtering
    if (item.permission) {
      // Special case: storage needs products.view OR categories.view
      if (item.id === 'storage') {
        return can('products.view') || can('categories.view');
      }
      return can(item.permission);
    }

    // 4. Items without permission requirement are always visible
    // (home, feedback, settings)
    return true;
  });
}

/**
 * Get all navigation items without filtering (for testing/admin)
 */
export function getAllNavItems(slug: string): NavItemData[] {
  return [
    {
      id: 'home',
      icon: 'home',
      label: 'Inicio',
      path: getBusinessPath(slug),
    },
    {
      id: 'chat',
      icon: 'chat',
      label: 'Mensajes',
      path: getBusinessPath(slug, '/chat'),
      permission: 'chat.view',
    },
    {
      id: 'notifications',
      icon: 'notifications',
      label: 'Notificaciones',
      path: getBusinessPath(slug, '/notifications'),
      permission: 'notifications.view',
      badge: '0', // Will be replaced by Supabase real-time badge
    },
    {
      id: 'storage',
      icon: 'package_2',
      label: 'Almacén',
      path: getBusinessPath(slug, '/storage'),
      permission: 'products.view',
    },
    {
      id: 'feedback',
      icon: 'feedback',
      label: 'Ayuda',
      path: getBusinessPath(slug, '/ayuda'),
    },
    {
      id: 'dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      path: getBusinessPath(slug, '/dashboard'),
      permission: 'dashboard.view',
      plan: 'basico',
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Ajustes',
      path: getBusinessPath(slug, '/settings'),
    },
  ];
}
