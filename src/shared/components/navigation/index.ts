// Export all navigation components and utilities
export { default as Navbar } from './Navbar';
export { NavItem } from './NavItem';
export { NavSection } from './NavSection';
export { Sidebar } from './Sidebar';
export { UserMenu } from './UserMenu';

// Types
export type {
  MobileDrawerProps,
  NavItemData,
  Permission,
  SidebarContainerProps,
  SidebarItemProps,
  SidebarState,
  UserMenuItem,
} from './types';

// Navigation data
export { buildNavItems, getAllNavItems } from './navData';

// Active route detection
export { getActiveItemId, isActive, isSubmenuActive } from './activeRoute';

// Hooks
export { useKeyboardNavigation, useNavItemRef } from '@/hooks/useKeyboardNavigation';
export { useMobileDrawer, useMobileDrawerTrigger } from '@/hooks/useMobileDrawer';
export { useSidebarState } from '@/hooks/useSidebarState';
