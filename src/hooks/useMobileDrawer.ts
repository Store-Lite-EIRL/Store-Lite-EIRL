'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

interface UseMobileDrawerReturn {
  drawerRef: RefObject<HTMLDivElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  focusTrapRef: RefObject<HTMLDivElement | null>;
}

/**
 * Hook for mobile drawer with focus trap, backdrop click handling, and focus restoration.
 *
 * @param isOpen - Whether the drawer is open
 * @param onClose - Callback when drawer should close
 * @returns Object with refs for drawer, backdrop, and focus trap container
 *
 * Features:
 * - Focus trap: Tab cycles within drawer, Shift+Tab reverse
 * - Backdrop click → onClose
 * - Escape key → onClose
 * - Restore focus to trigger on close
 * - Prevent body scroll when open
 */
export function useMobileDrawer(isOpen: boolean, onClose: () => void): UseMobileDrawerReturn {
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the focus trap
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = focusTrapRef.current;
    if (!container) return [];

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0,
    );
  }, []);

  // Handle Escape key and focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }

      // Focus trap: Tab / Shift+Tab
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: moving backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose, getFocusableElements],
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Handle drawer open/close effects
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      // Find trigger element (the button that opened the drawer)
      // This would be set by the component using this hook
      if (triggerRef.current) {
        previouslyFocusedRef.current = triggerRef.current;
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      backdrop?.addEventListener('click', handleBackdropClick);

      // Focus first focusable element in drawer
      requestAnimationFrame(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else if (drawerRef.current) {
          drawerRef.current.focus();
        }
      });
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      backdrop?.removeEventListener('click', handleBackdropClick);

      // Restore focus to trigger
      requestAnimationFrame(() => {
        if (
          previouslyFocusedRef.current &&
          typeof previouslyFocusedRef.current.focus === 'function'
        ) {
          previouslyFocusedRef.current.focus();
        }
      });
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleKeyDown);
      backdrop?.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, handleKeyDown, handleBackdropClick, getFocusableElements]);

  return {
    drawerRef,
    backdropRef,
    focusTrapRef,
  };
}

/**
 * Helper to set the trigger element reference for focus restoration.
 * Call this with the ref of the button that opens the drawer.
 */
export function useMobileDrawerTrigger(): (element: HTMLElement | null) => void {
  const triggerRef = useRef<HTMLElement | null>(null);

  return useCallback((element: HTMLElement | null) => {
    triggerRef.current = element;
  }, []);
}
