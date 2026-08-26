'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import '@/styles/components/sidebar.css';
import { useCallback, useEffect, useState } from 'react';
import { buildNavItems } from './navData';
import { NavItem } from './NavItem';
import type { NavItemData, Permission, SidebarState } from './types';

interface NavSectionProps {
  /** Navigation items to render (will be filtered by buildNavItems) */
  items: NavItemData[];
  /** Current sidebar state */
  state: SidebarState;
  /** Current pathname for active route detection */
  pathname: string;
  /** Business slug */
  slug: string;
  /** Business ID for notifications badge */
  businessId: string;
  /** Current plan name */
  planName: string;
  /** User permissions */
  permissions: Permission[];
  /** Whether user is owner */
  isOwner: boolean;
  /** Section header label (optional) */
  sectionHeader?: string;
  /** Unique section ID for localStorage persistence */
  sectionId?: string;
}

/**
 * Navigation section component.
 * Renders a section header (if provided) and a list of filtered NavItems.
 * Supports collapsible sections with localStorage persistence.
 */
export function NavSection({
  items: allItems,
  state,
  slug,
  planName,
  permissions,
  isOwner,
  sectionHeader,
  sectionId,
}: NavSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [filteredItems, setFilteredItems] = useState<NavItemData[]>([]);

  // Persist expanded state in localStorage
  const storageKey = sectionId ? `sidebar:v1:sections:${sectionId}` : null;

  // Load expanded state from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          setExpanded(JSON.parse(stored));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [storageKey]);

  // Save expanded state to localStorage
  const toggleExpanded = useCallback(() => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextExpanded));
      } catch {
        // Ignore storage errors
      }
    }
  }, [expanded, storageKey]);

  // Filter items whenever props change
  useEffect(() => {
    const builtItems = buildNavItems({
      slug,
      planName,
      permissions,
      isOwner,
    });
    // Filter the provided items against the built items (by ID)
    const builtItemIds = new Set(builtItems.map((i) => i.id));
    const filtered = allItems.filter((item) => builtItemIds.has(item.id));
    setFilteredItems(filtered);
  }, [allItems, slug, planName, permissions, isOwner]);

  // Handle keyboard navigation for section header
  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  };

  if (filteredItems.length === 0 && !sectionHeader) {
    return null;
  }

  return (
    <section className="sidebar__section" data-section-id={sectionId}>
      {sectionHeader && (
        <button
          type="button"
          className={`sidebar__section-header ${expanded ? '' : 'sidebar__section-header--collapsed'}`}
          onClick={toggleExpanded}
          onKeyDown={handleHeaderKeyDown}
          aria-expanded={expanded}
          aria-controls={`sidebar-section-${sectionId}`}
          suppressHydrationWarning
        >
          <span className="sidebar__section-title">{sectionHeader}</span>
          <Icon size={20} className="sidebar__section-chevron" aria-hidden="true">
            chevron_right
          </Icon>
        </button>
      )}
      <div
        id={`sidebar-section-${sectionId}`}
        className={`sidebar__section-content ${expanded ? '' : 'sidebar__section-content--collapsed'}`}
        role="group"
        aria-label={sectionHeader}
      >
        {filteredItems.map((item) => {
          const isNotifications = item.id === 'notifications';
          let badgeCount: number | undefined;
          if (!isNotifications && item.badge) {
            badgeCount = parseInt(item.badge, 10);
          }

          return (
            <NavItem
              key={item.id}
              item={item}
              isActive={false} // Active state computed inside NavItem
              state={state}
              badgeCount={badgeCount}
            />
          );
        })}
      </div>
    </section>
  );
}
