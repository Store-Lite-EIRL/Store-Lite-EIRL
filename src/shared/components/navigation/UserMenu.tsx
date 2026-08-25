'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import '@/styles/components/sidebar.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SidebarState } from './types';

interface UserMenuProps {
  /** Current sidebar state */
  state: SidebarState;
  /** Callback when "Cerrar tienda" is clicked */
  onCloseStore: () => void;
  /** Callback when "Cerrar sesión" is clicked */
  onLogout: () => void;
}

/**
 * User menu component for the sidebar footer.
 * Renders a trigger button and a dropdown menu with focus trap.
 * Matches the current Navbar account dropdown behavior.
 */
export function UserMenu({ state, onCloseStore, onLogout }: UserMenuProps) {
  const isCollapsed = state === 'collapsed';
  const isMobileOpen = state === 'mobile-open';
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap within dropdown
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      // Tab cycling within dropdown
      if (event.key === 'Tab') {
        const focusableElements = dropdownRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen],
  );

  // Close on click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  // Handle open/close effects
  useEffect(() => {
    const handleKeyDownNative = (event: KeyboardEvent) => {
      handleKeyDown(event as React.KeyboardEvent);
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDownNative);
      document.addEventListener('mousedown', handleClickOutside);
      // Focus first item in dropdown
      requestAnimationFrame(() => {
        const firstItem = dropdownRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        firstItem?.focus();
      });
    } else {
      document.removeEventListener('keydown', handleKeyDownNative);
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore focus to trigger
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDownNative);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleCloseStoreClick = () => {
    setIsOpen(false);
    onCloseStore();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  // Build dropdown content
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={`sidebar__user-dropdown ${isCollapsed ? 'sidebar__user-dropdown--collapsed' : ''} ${isMobileOpen ? 'sidebar__user-dropdown--mobile' : ''}`}
      role="menu"
      aria-label="Opciones de cuenta"
    >
      <button
        type="button"
        className="sidebar__dropdown-item"
        onClick={handleCloseStoreClick}
        role="menuitem"
      >
        <Icon size={20} className="sidebar__dropdown-icon" aria-hidden="true">
          store
        </Icon>
        <span className="sidebar__dropdown-label">Cerrar tienda</span>
      </button>
      <button
        type="button"
        className="sidebar__dropdown-item"
        onClick={handleLogoutClick}
        role="menuitem"
      >
        <Icon size={20} className="sidebar__dropdown-icon" aria-hidden="true">
          logout
        </Icon>
        <span className="sidebar__dropdown-label">Cerrar sesión</span>
      </button>
    </div>
  );

  // Render dropdown as portal for proper positioning
  const dropdownPortal = isOpen ? createPortal(dropdownContent, document.body) : null;

  return (
    <div className="sidebar__user-menu" data-user-menu>
      <button
        ref={triggerRef}
        type="button"
        className={`sidebar__user-trigger ${isCollapsed ? 'sidebar__user-trigger--collapsed' : ''}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menú de cuenta"
        suppressHydrationWarning
      >
        <Icon size={24} className="sidebar__user-avatar" aria-hidden="true">
          account_circle
        </Icon>
        {!isCollapsed && <span className="sidebar__user-label">Cuenta</span>}
        <Icon size={20} className="sidebar__user-chevron" aria-hidden="true">
          {isOpen ? 'expand_less' : 'expand_more'}
        </Icon>
      </button>
      {dropdownPortal}
    </div>
  );
}
