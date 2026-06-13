'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '../data';

const LS_PREFIX = 'storage_extra_cols_';

function getLsKey(slug: string): string {
  return `${LS_PREFIX}${slug}`;
}

function loadFromLs(slug: string): string[] {
  try {
    const raw = localStorage.getItem(getLsKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === 'string' && k.length > 0);
  } catch {
    return [];
  }
}

function saveToLs(slug: string, columns: string[]): void {
  try {
    localStorage.setItem(getLsKey(slug), JSON.stringify(columns));
  } catch {
    /* localStorage might be full or unavailable */
  }
}

/**
 * Scans unique metadata keys across all products.
 */
function scanMetadataKeys(products: Product[]): string[] {
  const keys = new Set<string>();
  for (const p of products) {
    if (p.metadata && typeof p.metadata === 'object') {
      for (const key of Object.keys(p.metadata)) {
        if (key === '_public') continue;
        keys.add(key);
      }
    }
  }
  return Array.from(keys).sort();
}

export interface ExtraColumnsState {
  /** All unique metadata keys found across products */
  availableColumns: string[];
  /** Currently visible column names */
  visibleColumns: string[];
  /** Toggle a single column on/off */
  toggleColumn: (key: string) => void;
  /** Set multiple columns at once (e.g. "select all") */
  setVisibleColumns: (cols: string[]) => void;
}

export function useExtraColumns(slug: string, products: Product[]): ExtraColumnsState {
  const [visibleColumns, setVisibleColumnsState] = useState<string[]>(() => loadFromLs(slug));

  const availableColumns = useMemo(() => scanMetadataKeys(products), [products]);

  // Prune stale columns that no longer exist in metadata.
  // If availableColumns is empty it means products haven't loaded yet —
  // don't wipe the user's saved preferences.
  useEffect(() => {
    if (availableColumns.length === 0) return;
    setVisibleColumnsState((prev) => {
      const pruned = prev.filter((col) => availableColumns.includes(col));
      const needsUpdate = pruned.length !== prev.length || pruned.some((c, i) => c !== prev[i]);
      if (needsUpdate) {
        saveToLs(slug, pruned);
      }
      return needsUpdate ? pruned : prev;
    });
  }, [availableColumns, slug]);

  const toggleColumn = useCallback(
    (key: string) => {
      setVisibleColumnsState((prev) => {
        const next = prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key];
        saveToLs(slug, next);
        return next;
      });
    },
    [slug],
  );

  const setVisibleColumns = useCallback(
    (cols: string[]) => {
      setVisibleColumnsState(cols);
      saveToLs(slug, cols);
    },
    [slug],
  );

  return { availableColumns, visibleColumns, toggleColumn, setVisibleColumns };
}
