'use client';

import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface NavItemData {
  id: string;
  icon: string;
  label: string;
  path: string;
  permission?: string;
  plan?: string;
  badge?: string;
  children?: NavItemData[];
}

/**
 * Hook for keyboard navigation using roving tabindex pattern.
 *
 * @param items - Array of navigation items
 * @param onActivate - Callback when item is activated (Enter/Space)
 * @param onEscape - Callback when Escape is pressed
 * @returns Object with containerRef to attach to the navigation container
 *
 * Features:
 * - Roving tabindex pattern (only one item in tab order at a time)
 * - ArrowUp/ArrowDown: move focus between items
 * - Enter/Space: activate focused item (calls onActivate)
 * - Escape: call onEscape (close mobile drawer)
 * - Home/End: jump to first/last item
 * - Only active when container is focused
 */
export function useKeyboardNavigation(
  items: NavItemData[],
  onActivate: (item: NavItemData) => void,
  onEscape: () => void,
): { containerRef: React.RefObject<HTMLDivElement | null> } {
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const focusedIndexRef = useRef(-1);
  const itemRefsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Ref that components can attach to
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync containerRef.current to state
  useEffect(() => {
    setContainerElement(containerRef.current);
  }, []);

  // Register item ref
  const registerItemRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      itemRefsRef.current.set(id, element);
    } else {
      itemRefsRef.current.delete(id);
    }
  }, []);

  // Get focusable item elements in order
  const getFocusableItems = useCallback((): HTMLElement[] => {
    const container = containerElement;
    if (!container) return [];

    const focusableItems: HTMLElement[] = [];
    container.querySelectorAll('[data-nav-item]').forEach((el) => {
      if (el instanceof HTMLElement) {
        focusableItems.push(el);
      }
    });
    return focusableItems;
  }, [containerElement]);

  // Focus item at index
  const focusItemAtIndex = useCallback(
    (index: number) => {
      const focusableItems = getFocusableItems();
      if (focusableItems.length === 0) return;

      const clampedIndex = Math.max(0, Math.min(index, focusableItems.length - 1));
      focusedIndexRef.current = clampedIndex;

      // Update tabindex for roving pattern
      focusableItems.forEach((item, i) => {
        item.tabIndex = i === clampedIndex ? 0 : -1;
      });

      focusableItems[clampedIndex].focus();
    },
    [getFocusableItems],
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const focusableItems = getFocusableItems();
      if (focusableItems.length === 0) return;

      const currentIndex = focusedIndexRef.current;
      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
          focusItemAtIndex(nextIndex);
          break;

        case 'ArrowUp':
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
          focusItemAtIndex(nextIndex);
          break;

        case 'Home':
          event.preventDefault();
          focusItemAtIndex(0);
          break;

        case 'End':
          event.preventDefault();
          focusItemAtIndex(focusableItems.length - 1);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < focusableItems.length) {
            const itemId = focusableItems[currentIndex].getAttribute('data-nav-id');
            if (itemId) {
              const item = items.find((i) => i.id === itemId);
              if (item) {
                onActivate(item);
              }
            }
          }
          break;

        case 'Escape':
          event.preventDefault();
          onEscape();
          break;

        default:
          break;
      }
    },
    [getFocusableItems, focusItemAtIndex, items, onActivate, onEscape],
  );

  // Attach keyboard listener when container is focused
  useEffect(() => {
    const container = containerElement;
    if (!container) return;

    const handleFocusIn = () => {
      // Initialize roving tabindex on first focus
      const focusableItems = getFocusableItems();
      if (focusableItems.length > 0 && focusedIndexRef.current === -1) {
        focusedIndexRef.current = 0;
        focusableItems.forEach((item, i) => {
          item.tabIndex = i === 0 ? 0 : -1;
        });
      }
    };

    const handleFocusOut = () => {
      // Keep tabindex state but don't reset focusedIndex
      // This preserves position when tabbing back in
    };

    container.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [containerElement, handleKeyDown, getFocusableItems]);

  return { containerRef };
}

/**
 * Helper hook to register a navigation item ref.
 * Use this in components that render navigation items.
 */
export function useNavItemRef(_itemId: string): (element: HTMLElement | null) => void {
  // We need to find the container's registerNavItemRef
  // This is a bit of a hack - in practice, the container should provide context
  return useCallback((_element: HTMLElement | null) => {
    // The container will have registerNavItemRef attached
    // We'll use a different approach - see NavItem component
  }, []);
}
