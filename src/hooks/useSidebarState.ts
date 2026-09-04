'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SidebarState = 'expanded' | 'collapsed' | 'mobile-open';

const STORAGE_KEY = 'sidebar:v1:state';
const DEFAULT_STATE: SidebarState = 'collapsed';

interface UseSidebarStateReturn {
  state: SidebarState;
  toggle: () => void;
  setState: (state: SidebarState) => void;
  registerStorageListener: () => () => void;
}

/**
 * Hook for managing sidebar state with localStorage persistence and cross-tab sync.
 *
 * @param initialState - Optional initial state (default: 'collapsed')
 * @returns Object with state, toggle, setState, and registerStorageListener
 *
 * Features:
 * - Persists state to localStorage with key 'sidebar:v1:state'
 * - Cross-tab synchronization via storage event listener
 * - Respects prefers-reduced-motion (no transition on first render)
 * - Returns cleanup function for storage listener
 */
export function useSidebarState(initialState?: SidebarState): UseSidebarStateReturn {
  const [state, setStateInternal] = useState<SidebarState>(initialState ?? DEFAULT_STATE);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && ['expanded', 'collapsed', 'mobile-open'].includes(parsed.state)) {
            setStateInternal(parsed.state);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const isFirstRender = useRef(true);
  const prefersReducedMotion = useRef(false);

  // Detect prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Persist state to localStorage
  const setState = useCallback((newState: SidebarState) => {
    setStateInternal(newState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ state: newState, timestamp: Date.now() }),
        );
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    }
  }, []);

  // Toggle between expanded and collapsed (mobile-open is handled separately)
  const toggle = useCallback(() => {
    setStateInternal((prev) => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: next, timestamp: Date.now() }));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  }, []);

  // Register cross-tab storage listener
  const registerStorageListener = useCallback(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue !== event.oldValue) {
        try {
          const parsed = JSON.parse(event.newValue || '{}');
          if (parsed && ['expanded', 'collapsed', 'mobile-open'].includes(parsed.state)) {
            setStateInternal(parsed.state);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Apply reduced-motion class on first render
  useEffect(() => {
    if (typeof document !== 'undefined' && isFirstRender.current && prefersReducedMotion.current) {
      document.documentElement.classList.add('sidebar--no-transition');
      // Remove after first paint to allow future transitions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('sidebar--no-transition');
        });
      });
    }
    isFirstRender.current = false;
  }, []);

  return {
    state,
    toggle,
    setState,
    registerStorageListener,
  };
}
