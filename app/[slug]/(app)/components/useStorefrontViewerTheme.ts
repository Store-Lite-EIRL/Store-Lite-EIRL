'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import { useCallback, useEffect, useRef, useState } from 'react';

export type StorefrontViewerTheme = 'light' | 'dark';

interface UseStorefrontViewerThemeOptions {
  slug: string;
  /** When true (customize editor open), global->storefront reverse sync is suppressed. */
  editorOpen: boolean;
}

function readStoredTheme(slug: string): StorefrontViewerTheme | null {
  try {
    const stored = localStorage.getItem(`storefront-theme-${slug}`);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(slug: string, theme: StorefrontViewerTheme) {
  try {
    localStorage.setItem(`storefront-theme-${slug}`, theme);
  } catch {
    // Safari private mode - no-op
  }
}

/**
 * Owns the storefront viewer light/dark preference and its sync with the global
 * ThemeContext theme.
 *
 * Sync contract (ONE source of truth = ThemeContext; explicit user actions are the
 * only writer back into it):
 * - The viewer theme is read from localStorage on mount and drives the storefront
 *   scheme, but it does NOT write back into the global context automatically.
 * - handleViewerThemeToggle is the only auto writer: an explicit user toggle updates
 *   both the local viewer theme and the global theme exactly once.
 * - Global -> viewer reverse sync fires when the global effective theme CHANGED while
 *   the editor is closed, and it writes the viewer value at most once per global
 *   change (tracked with a ref).
 * Because the viewer never writes back automatically, the two ping-pong effects from
 * the original BusinessPageContent can no longer oscillate.
 */
export function useStorefrontViewerTheme({ slug, editorOpen }: UseStorefrontViewerThemeOptions) {
  const { effectiveTheme, setTheme } = useTheme();
  const [viewerTheme, setViewerTheme] = useState<StorefrontViewerTheme | null>(null);

  // Refs let the reverse-sync effect react ONLY to global changes, never to viewer
  // changes, so an explicit toggle can never be reverted by a stale global value.
  const viewerThemeRef = useRef<StorefrontViewerTheme | null>(viewerTheme);
  viewerThemeRef.current = viewerTheme;

  const handledEffectiveRef = useRef(effectiveTheme);

  useEffect(() => {
    const stored = readStoredTheme(slug);
    if (stored !== null) {
      setViewerTheme(stored);
    }
  }, [slug]);

  useEffect(() => {
    if (viewerTheme === null) return;
    persistTheme(slug, viewerTheme);
  }, [viewerTheme, slug]);

  // Reverse sync: global theme change -> storefront viewer. Every global change is
  // consumed exactly once (tracked with a ref). The effect only ever WRITES the
  // viewer value; nothing writes back into the global context automatically, so
  // the two ping-pong effects from the original BusinessPageContent can no longer
  // oscillate and a viewer value can never be reverted by its own stale write.
  useEffect(() => {
    if (handledEffectiveRef.current === effectiveTheme) return;
    handledEffectiveRef.current = effectiveTheme;
    if (editorOpen) return;
    if (viewerThemeRef.current === effectiveTheme) return;
    setViewerTheme(effectiveTheme);
  }, [effectiveTheme, editorOpen]);

  const handleViewerThemeToggle = useCallback(() => {
    const next: StorefrontViewerTheme = viewerThemeRef.current === 'dark' ? 'light' : 'dark';
    setViewerTheme(next);
    setTheme(next);
  }, [setTheme]);

  return {
    viewerTheme,
    setViewerTheme,
    handleViewerThemeToggle,
    effectiveTheme,
    setTheme,
  };
}
