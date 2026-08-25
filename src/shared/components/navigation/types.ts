import type { Permission } from '@/lib/permissions/definitions';

/**
 * Sidebar display state
 */
export type SidebarState = 'expanded' | 'collapsed' | 'mobile-open';

/**
 * Navigation item data structure
 * Supports hierarchical navigation with children
 */
export interface NavItemData {
  /** Unique identifier for the navigation item */
  id: string;

  /** Material Symbols Rounded icon name */
  icon: string;

  /** Display label */
  label: string;

  /** Navigation path (relative to business slug) */
  path: string;

  /** Required permission to view this item */
  permission?: Permission;

  /** Plan name that hides this item (e.g., 'basico' hides dashboard) */
  plan?: string;

  /** Badge text (e.g., notification count) */
  badge?: string;

  /** Child navigation items for nested menus */
  children?: NavItemData[];
}

/**
 * User menu item for dropdown
 */
export interface UserMenuItem {
  /** Unique identifier */
  id: string;

  /** Material Symbols Rounded icon name */
  icon: string;

  /** Display label */
  label: string;

  /** Click handler */
  onClick: () => void;
}

/**
 * Re-export Permission type from definitions
 */
export type { Permission };

/**
 * Props for sidebar container component
 */
export interface SidebarContainerProps {
  /** Current sidebar state */
  state: SidebarState;

  /** Callback when state changes */
  onStateChange: (state: SidebarState) => void;

  /** Business slug for URL generation */
  slug: string;

  /** Current plan name */
  planName?: string;

  /** User permissions */
  permissions?: Permission[];

  /** Whether user is owner */
  isOwner?: boolean;

  /** Business ID for notifications badge */
  businessId?: string;

  /** Current pathname for active route detection */
  pathname: string;
}

/**
 * Props for navigation item component
 */
export interface SidebarItemProps {
  /** Navigation item data */
  item: NavItemData;

  /** Whether item is active */
  isActive: boolean;

  /** Whether sidebar is collapsed */
  isCollapsed: boolean;

  /** Click handler */
  onClick?: () => void;

  /** Keyboard activation handler */
  onActivate?: () => void;
}

/**
 * Props for mobile drawer component
 */
export interface MobileDrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Navigation items to render */
  items: NavItemData[];

  /** Current pathname for active detection */
  pathname: string;

  /** Business slug */
  slug: string;
}
