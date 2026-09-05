'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import '@/styles/components/sidebar.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SidebarState } from './types';

interface SidebarHeaderProps {
  /** Current sidebar state */
  state: SidebarState;
  /** Business slug for workspace routing */
  slug: string;
  /** Current workspace name */
  workspaceName?: string;
  /** Callback when workspace changes */
  onWorkspaceChange?: (newSlug: string) => void;
  /** Callback for search (future implementation) */
  onSearch?: (query: string) => void;
  /** Callback for create action */
  onCreate?: () => void;
}

interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

/**
 * Sidebar header component.
 * Renders app icon, workspace selector, search input, and create button.
 * Responsive: collapsed hides search/create, shows only icon.
 */
export function SidebarHeader({
  state,
  slug,
  workspaceName = 'Company',
  onWorkspaceChange,
  onSearch,
  onCreate,
}: SidebarHeaderProps) {
  const isCollapsed = state === 'collapsed';
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const workspaceTriggerRef = useRef<HTMLButtonElement>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // Mock workspace data - replace with real API in future
  const workspaces: WorkspaceOption[] = [{ id: '1', name: 'Company', slug: 'company' }];

  // Close dropdown on click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      workspaceTriggerRef.current &&
      !workspaceTriggerRef.current.contains(event.target as Node) &&
      workspaceDropdownRef.current &&
      !workspaceDropdownRef.current.contains(event.target as Node)
    ) {
      setIsWorkspaceOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isWorkspaceOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkspaceOpen, handleClickOutside]);

  const handleWorkspaceSelect = (workspace: WorkspaceOption) => {
    setIsWorkspaceOpen(false);
    onWorkspaceChange?.(workspace.slug);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(event.target.value);
  };

  const handleCreateClick = () => {
    onCreate?.();
  };

  return (
    <header className="sidebar__header" role="banner">
      <div className="sidebar__header-brand">
        <div className="sidebar__app-icon" aria-hidden="true">
          <Icon size={24}>store</Icon>
        </div>
        {!isCollapsed && <span className="sidebar__header-title">Store Lite</span>}
      </div>

      {!isCollapsed && (
        <div className="sidebar__header-actions">
          {/* Workspace Selector */}
          <div className="sidebar__workspace-selector">
            <div style={{ position: 'relative' }}>
              <button
                ref={workspaceTriggerRef}
                type="button"
                className="sidebar__workspace-trigger"
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                aria-expanded={isWorkspaceOpen}
                aria-haspopup="listbox"
                aria-label="Seleccionar espacio de trabajo"
                suppressHydrationWarning
              >
                <span
                  className="sidebar__workspace-name"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '160px',
                  }}
                >
                  {workspaceName}
                </span>
                <Icon size={20} className="sidebar__workspace-chevron" aria-hidden="true">
                  expand_more
                </Icon>
              </button>

              {isWorkspaceOpen && (
                <div
                  ref={workspaceDropdownRef}
                  className="sidebar__workspace-dropdown"
                  role="listbox"
                  aria-label="Espacios de trabajo"
                >
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      className="sidebar__workspace-option"
                      role="option"
                      aria-selected={workspace.slug === slug}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      suppressHydrationWarning
                    >
                      <Icon size={20} aria-hidden="true">
                        business
                      </Icon>
                      <span>{workspace.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div
            className="sidebar__search-wrapper"
            style={{ position: 'relative', flex: 1, maxWidth: '280px' }}
          >
            <label htmlFor="sidebar-search" className="visually-hidden">
              Buscar
            </label>
            <Icon
              size={20}
              className="sidebar__search-icon"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--sidebar-item-color)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              search
            </Icon>
            <input
              id="sidebar-search"
              type="search"
              className="sidebar__search-input"
              placeholder="Buscar..."
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid var(--sidebar-border)',
                borderRadius: 'var(--sidebar-item-radius)',
                backgroundColor: 'var(--sidebar-bg)',
                color: 'var(--sidebar-header-color)',
                fontSize: 'var(--sidebar-label-font-size)',
                outline: 'none',
                transition:
                  'border-color var(--sidebar-transition-duration) var(--sidebar-transition-easing), box-shadow var(--sidebar-transition-duration) var(--sidebar-transition-easing)',
              }}
              suppressHydrationWarning
            />
          </div>

          {/* Create Button */}
          <button
            type="button"
            className="sidebar__create-button"
            onClick={handleCreateClick}
            aria-label="Crear nuevo"
            title="Crear nuevo"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              border: 'none',
              borderRadius: 'var(--sidebar-item-radius)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              cursor: 'pointer',
              transition:
                'background-color var(--sidebar-transition-duration) var(--sidebar-transition-easing), transform var(--sidebar-transition-duration) var(--sidebar-transition-easing)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--md-sys-color-primary)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            suppressHydrationWarning
          >
            <Icon size={20} aria-hidden="true">
              edit
            </Icon>
          </button>
        </div>
      )}
    </header>
  );
}
