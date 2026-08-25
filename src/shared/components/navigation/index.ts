// Export all navigation components and utilities
export { default as Navbar } from './Navbar';

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
