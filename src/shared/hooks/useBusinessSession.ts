'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEY = 'activeBusinessSession';

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessSession {
  slug: string;
  openedAt: number;
  tabId: string;
  /** True if this was triggered by user interaction (clicking a BusinessCard) */
  isUserIntention?: boolean;
}

export interface UseBusinessSessionReturn {
  currentSession: BusinessSession | null;
  pendingSession: BusinessSession | null;
  setSession: (slug: string, isUserIntention?: boolean) => void;
  clearSession: () => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  hasActiveSession: boolean;
  isSameBusiness: (slug: string) => boolean;
  sessionKilledFromOtherTab: boolean;
  resetSessionKilledFlag: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique tab ID for this browser tab
 */
const generateTabId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get current tab ID (creates one if doesn't exist)
 */
const getOrCreateTabId = (): string => {
  const key = 'businessSessionTabId';
  let tabId = sessionStorage.getItem(key);

  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(key, tabId);
  }

  return tabId;
};

/**
 * Read session from localStorage
 */
const readSession = (): BusinessSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as BusinessSession;
  } catch {
    console.warn('[useBusinessSession] Failed to parse session from localStorage');
    return null;
  }
};

/**
 * Write session to localStorage
 */
const writeSession = (session: BusinessSession | null): void => {
  if (typeof window === 'undefined') return;

  if (session === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
};

/**
 * Clear all business-related data from localStorage and cookies
 */
export const clearBusinessSessionData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('selectedBusinessSlug');

  // Clear cookie
  document.cookie = 'selected_business_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

// ============================================================================
// HOOK
// ============================================================================

export function useBusinessSession(): UseBusinessSessionReturn {
  const [currentSession, setCurrentSession] = useState<BusinessSession | null>(null);
  const [pendingSession, setPendingSession] = useState<BusinessSession | null>(null);
  const [sessionKilledFromOtherTab, setSessionKilledFromOtherTab] = useState(false);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const session = readSession();
    setCurrentSession(session);
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      // Only react to our key
      if (event.key !== STORAGE_KEY) return;

      // If session was removed (logout/close from another tab)
      if (event.newValue === null) {
        setCurrentSession(null);
        setPendingSession(null);
        // Signal that session was killed from another tab - we need to redirect
        setSessionKilledFromOtherTab(true);
        return;
      }

      try {
        const newSession = JSON.parse(event.newValue) as BusinessSession;

        // If session was cleared and now a new one is set, reset the killed flag
        setSessionKilledFromOtherTab(false);

        // Ignore if it's the same session
        if (currentSession && newSession.slug === currentSession.slug) {
          return;
        }

        // Ignore if it's from the same tab
        if (newSession.tabId === getOrCreateTabId()) {
          return;
        }

        // Update current session to sync with the new one from other tab
        // DON'T set as pending - we don't want to show modal for cross-tab sync
        setCurrentSession(newSession);
      } catch {
        console.warn('[useBusinessSession] Failed to parse storage event');
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentSession]);

  // Reset the session killed flag
  const resetSessionKilledFlag = useCallback(() => {
    setSessionKilledFromOtherTab(false);
  }, []);

  /**
   * Set a new business session
   * If there's an active session with a different slug, this will set pendingSession
   * @param slug - The business slug to switch to
   * @param isUserIntention - Set to true when triggered by user clicking a BusinessCard
   */
  const setSession = useCallback(
    (slug: string, isUserIntention = false) => {
      const newSession: BusinessSession = {
        slug,
        openedAt: Date.now(),
        tabId: getOrCreateTabId(),
        isUserIntention,
      };

      // Check if there's an active session with different slug
      if (currentSession && currentSession.slug !== slug) {
        setPendingSession(newSession);
        return;
      }

      // No active session or same business - proceed directly
      writeSession(newSession);
      setCurrentSession(newSession);
      setPendingSession(null);
    },
    [currentSession],
  );

  /**
   * Clear the current session
   */
  const clearSession = useCallback(() => {
    writeSession(null);
    setCurrentSession(null);
    setPendingSession(null);
  }, []);

  /**
   * Confirm switch to pending session
   */
  const confirmSwitch = useCallback(() => {
    if (!pendingSession) return;

    writeSession(pendingSession);
    setCurrentSession(pendingSession);
    setPendingSession(null);
  }, [pendingSession]);

  /**
   * Cancel switch and keep current session
   */
  const cancelSwitch = useCallback(() => {
    setPendingSession(null);
  }, []);

  /**
   * Check if there's an active session
   */
  const hasActiveSession = currentSession !== null;

  /**
   * Check if the given slug is the same as the current session
   */
  const isSameBusiness = useCallback(
    (slug: string): boolean => {
      return currentSession?.slug === slug;
    },
    [currentSession],
  );

  return {
    currentSession,
    pendingSession,
    setSession,
    clearSession,
    confirmSwitch,
    cancelSwitch,
    hasActiveSession,
    isSameBusiness,
    sessionKilledFromOtherTab,
    resetSessionKilledFlag,
  };
}
