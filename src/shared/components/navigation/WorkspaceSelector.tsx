'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import { getBusinessPath } from '@/shared/utils/url';
import '@/styles/components/sidebar.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceSelectorProps {
  /** Current workspace slug */
  currentSlug: string;
  /** Current workspace name */
  currentName: string;
  /** Callback when workspace changes */
  onChange?: (newSlug: string) => void;
}

/**
 * Workspace selector dropdown component.
 * Mock data for now - replace with real API in future.
 */
export function WorkspaceSelector({ currentSlug, currentName, onChange }: WorkspaceSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock workspace data - replace with real API in future
  const workspaces: WorkspaceOption[] = [
    { id: '1', name: 'Company', slug: 'company' },
    // Future: fetch from API
  ];

  // Close dropdown on click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleSelect = (workspace: WorkspaceOption) => {
    setIsOpen(false);
    const newPath = getBusinessPath(workspace.slug);
    router.push(newPath);
    onChange?.(workspace.slug);
  };

  return (
    <div className="sidebar__workspace-selector" style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        className="sidebar__workspace-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
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
            maxWidth: '200px',
          }}
        >
          {currentName}
        </span>
        <Icon size={20} className="sidebar__workspace-chevron" aria-hidden="true">
          expand_more
        </Icon>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
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
              aria-selected={workspace.slug === currentSlug}
              onClick={() => handleSelect(workspace)}
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
  );
}
