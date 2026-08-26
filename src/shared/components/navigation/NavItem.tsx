'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import '@/styles/components/sidebar.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActive } from './activeRoute';
import type { NavItemData, SidebarState } from './types';

interface NavItemProps {
  /** Navigation item data */
  item: NavItemData;
  /** Whether item is active */
  isActive: boolean;
  /** Current sidebar state */
  state: SidebarState;
  /** Badge count (optional) */
  badgeCount?: number;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Navigation item component for the sidebar.
 * Renders icon, label, and badge with proper states.
 * Handles collapsed/expanded/mobile states via CSS.
 */
export function NavItem({ item, isActive: active, state, badgeCount, onClick }: NavItemProps) {
  const pathname = usePathname();
  const slug = pathname.split('/')[1] || '';

  // Determine if we need a link or button
  const isLink = Boolean(item.path);

  // Calculate active state using the shared utility
  const computedActive = active || (isLink && isActive(item.path, pathname, slug));

  // Build className
  const baseClass = 'sidebar__item';
  const activeClass = computedActive ? 'sidebar__item--active' : '';

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  // Render badge if count > 0
  const renderBadge = () => {
    if (badgeCount && badgeCount > 0) {
      const displayCount = badgeCount > 99 ? '99+' : badgeCount.toString();
      return (
        <span className="sidebar__badge" aria-label={`${badgeCount} notificaciones`}>
          {displayCount}
        </span>
      );
    }
    return null;
  };

  const content = (
    <>
      <span className="sidebar__item-icon-wrapper" aria-hidden="true">
        <Icon size={24} className="sidebar__item-icon">
          {item.icon}
        </Icon>
      </span>
      <span className="sidebar__item-label">{item.label}</span>
      {renderBadge()}
    </>
  );

  if (isLink) {
    return (
      <Link
        href={item.path}
        className={`${baseClass} ${activeClass}`}
        aria-current={computedActive ? 'page' : undefined}
        role="menuitem"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-nav-item=""
        data-nav-id={item.id}
        suppressHydrationWarning
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${baseClass} ${activeClass}`}
      aria-current={computedActive ? 'page' : undefined}
      role="menuitem"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-nav-item=""
      data-nav-id={item.id}
      suppressHydrationWarning
    >
      {content}
    </button>
  );
}
