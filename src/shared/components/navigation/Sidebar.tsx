'use client';

import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useMobileDrawer } from '@/hooks/useMobileDrawer';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import '@/styles/components/sidebar.css';
import { useEffect, useRef, useState } from 'react';
import { NavSection } from './NavSection';
import { UserMenu } from './UserMenu';
import { buildNavItems } from './navData';
import type { NavItemData, Permission, SidebarState } from './types';

interface SidebarProps {
  /** Current sidebar state */
  state: SidebarState;
  /** Toggle callback (expanded <-> collapsed) */
  onToggle: () => void;
  /** Close mobile drawer callback */
  onCloseMobile: () => void;
  /** Current plan name */
  planName: string;
  /** Business ID */
  businessId: string;
  /** Business slug */
  slug: string;
  /** Current pathname */
  pathname: string;
  /** Whether we're on the chat page (hide sidebar on mobile) */
  isChatPage: boolean;
  /** User permissions */
  permissions?: Permission[];
  /** Whether user is owner */
  isOwner?: boolean;
}

/**
 * Main sidebar component.
 * Composes header, navigation sections, and user menu.
 * Integrates keyboard navigation and mobile drawer hooks.
 */
export function Sidebar({
  state,
  onToggle,
  onCloseMobile,
  planName,
  businessId,
  slug,
  pathname,
  isChatPage,
  permissions = [],
  isOwner = false,
}: SidebarProps) {
  const isCollapsed = state === 'collapsed';
  const isExpanded = state === 'expanded';
  const isMobileOpen = state === 'mobile-open';

  // Mobile drawer refs
  const { drawerRef, backdropRef, focusTrapRef } = useMobileDrawer(isMobileOpen, onCloseMobile);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Build navigation items
  const navItems = buildNavItems({
    slug,
    planName,
    permissions,
    isOwner,
  });

  // Define sections (matching design spec: Workspace, Favorites, Your Teams)
  const sections: {
    id: string;
    header: string;
    items: NavItemData[];
  }[] = [
    {
      id: 'workspace',
      header: 'Workspace',
      items: navItems.filter((item) =>
        ['home', 'chat', 'notifications', 'storage', 'feedback'].includes(item.id),
      ),
    },
    {
      id: 'favorites',
      header: 'Favorites',
      items: navItems.filter((item) => ['dashboard', 'settings'].includes(item.id)),
    },
  ];

  // Filter out empty sections
  const validSections = sections.filter((s) => s.items.length > 0);

  // Keyboard navigation hook
  const { containerRef: navContainerRef } = useKeyboardNavigation(
    navItems,
    (item) => {
      // Navigate to item path
      window.location.href = item.path;
    },
    onCloseMobile,
  );

  // Add data-ssr attribute and remove after hydration
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // CSS classes
  const sidebarClasses = [
    'sidebar',
    isCollapsed ? 'sidebar--collapsed' : '',
    isExpanded ? 'sidebar--expanded' : '',
    isMobileOpen ? 'sidebar--mobile-open' : '',
    !isHydrated ? 'sidebar--no-transition' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Hide sidebar on chat page when mobile open
  if (isChatPage && isMobileOpen) {
    return null;
  }

  return (
    <>
      {isMobileOpen && (
        <div
          ref={backdropRef}
          className="sidebar__backdrop sidebar__backdrop--visible"
          aria-hidden="true"
        />
      )}
      <aside
        ref={drawerRef}
        className={sidebarClasses}
        data-ssr={!isHydrated ? '' : undefined}
        role="navigation"
        aria-label="Navegación principal"
      >
        {/* Header */}
        <header className="sidebar__header">
          <div className="sidebar__header-brand">
            <div className="sidebar__app-icon" aria-hidden="true">
              <Icon size={24}>store</Icon>
            </div>
            {!isCollapsed && <span className="sidebar__header-title">Store Lite</span>}
          </div>
          <div className="sidebar__header-actions">
            <button
              ref={triggerRef}
              type="button"
              className="sidebar__toggle"
              onClick={onToggle}
              aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
              aria-expanded={isExpanded}
            >
              <Icon size={24} aria-hidden="true">
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </Icon>
            </button>
          </div>
        </header>

        <div className="sidebar__divider" />

        {/* Navigation */}
        <nav
          ref={(el) => {
            navContainerRef.current = el as HTMLDivElement | null;
            focusTrapRef.current = el as HTMLDivElement | null;
          }}
          className="sidebar__nav"
          data-nav-container
        >
          {validSections.map((section) => (
            <NavSection
              key={section.id}
              items={section.items}
              state={state}
              pathname={pathname}
              slug={slug}
              businessId={businessId}
              planName={planName}
              permissions={permissions}
              isOwner={isOwner}
              sectionHeader={section.header}
              sectionId={section.id}
            />
          ))}
        </nav>

        {/* Footer / User Menu */}
        <footer className="sidebar__footer">
          <UserMenu
            state={state}
            onCloseStore={() => {
              // This will be handled by the parent component
              window.location.href = `/list-business`;
            }}
            onLogout={() => {
              // This will be handled by the parent component
              window.location.href = '/auth';
            }}
          />
        </footer>
      </aside>
    </>
  );
}
