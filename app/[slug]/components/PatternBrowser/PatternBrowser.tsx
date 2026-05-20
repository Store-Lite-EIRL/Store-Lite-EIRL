'use client';

import type { PatternCraftCategory, PatternCraftPattern } from '@/data/patterncraft';
import { getPatternCraftById, patternCraftByCategory } from '@/data/patterncraft';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './PatternBrowser.module.css';

interface PatternBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pattern: PatternCraftPattern) => void;
  currentPatternId?: string;
}

const CATEGORIES: {
  key: PatternCraftCategory;
  label: string;
  icon: string;
}[] = [
  { key: 'gradients', label: 'Gradientes', icon: 'gradient' },
  { key: 'geometric', label: 'Geométricos', icon: 'grid_view' },
  { key: 'decorative', label: 'Decorativos', icon: 'auto_awesome' },
  { key: 'effects', label: 'Efectos', icon: 'blur_on' },
];

function previewStyle(style: Record<string, unknown>): React.CSSProperties {
  const css: React.CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (css as any)[key] = String(value);
    }
  }
  return css;
}

/**
 * Detects if a pattern has a dark base color so we can adapt the label.
 * Checks `background` and `backgroundColor` for hex/named dark values.
 */
function isDarkPattern(style: Record<string, unknown>): boolean {
  const bg = (typeof style.background === 'string' ? style.background : '').trim();
  const bgColor = (typeof style.backgroundColor === 'string' ? style.backgroundColor : '').trim();
  const color = bgColor || bg;

  // Quick check for common dark bases
  if (!color) return false;
  if (/^#0[0-9a-f]{5}$/i.test(color)) return true; // #0xxxxx
  if (/^#1[0-9a-f]{5}$/i.test(color)) return true; // #1xxxxx
  if (/^#2[0-9a-b][0-9a-f]{4}$/i.test(color)) return true; // #2[0-b]xxxx
  if (color === '#000' || color === '#000000' || color === 'black') return true;

  // Parse hex luminance
  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1].slice(0, 2), 16);
    const g = parseInt(hexMatch[1].slice(2, 4), 16);
    const b = parseInt(hexMatch[1].slice(4, 6), 16);
    // Perceived brightness (ITU-R BT.601)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.35;
  }

  return false;
}

export function PatternBrowser({ open, onClose, onSelect, currentPatternId }: PatternBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<PatternCraftCategory>('gradients');
  const [selectedId, setSelectedId] = useState<string | null>(currentPatternId ?? null);

  // Sync selection when currentPatternId changes externally
  useEffect(() => {
    setSelectedId(currentPatternId ?? null);
  }, [currentPatternId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const patterns = useMemo(() => patternCraftByCategory[activeCategory] ?? [], [activeCategory]);

  const handleConfirm = useCallback(() => {
    if (!selectedId) return;
    const pattern = getPatternCraftById(selectedId);
    if (pattern) {
      onSelect(pattern);
    }
    onClose();
  }, [selectedId, onSelect, onClose]);

  const currentPattern = currentPatternId ? getPatternCraftById(currentPatternId) : undefined;

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 className={styles.title}>Patrones PatternCraft</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Active pattern info ── */}
        {currentPattern && (
          <div className={styles.activeInfo}>
            <span className={styles.activeLabel}>Patrón actual:</span>
            <span className={styles.activeName}>{currentPattern.name}</span>
            <button
              className={styles.clearBtn}
              onClick={() => {
                setSelectedId(null);
                onClose();
                // Inform parent to clear by calling onSelect with a null signal
                // We'll rely on parent handling
              }}
            >
              Quitar
            </button>
          </div>
        )}

        {/* ── Category tabs ── */}
        <div className={styles.tabs}>
          {CATEGORIES.map((cat) => {
            const count = patternCraftByCategory[cat.key]?.length ?? 0;
            return (
              <button
                key={cat.key}
                className={`${styles.tab} ${activeCategory === cat.key ? styles.tabActive : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span className={styles.tabIcon}>
                  <PatternCategoryIcon icon={cat.icon} />
                </span>
                <span className={styles.tabLabel}>{cat.label}</span>
                <span className={styles.tabCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Pattern grid ── */}
        <div className={styles.grid}>
          {patterns.map((pattern) => {
            const dark = isDarkPattern(pattern.style);
            return (
              <button
                key={pattern.id}
                className={`${styles.card} ${selectedId === pattern.id ? styles.cardSelected : ''}`}
                onClick={() => setSelectedId(pattern.id)}
                onDoubleClick={() => {
                  setSelectedId(pattern.id);
                  handleConfirm();
                }}
                title={pattern.name}
              >
                <div className={styles.preview} style={previewStyle(pattern.style)} />

                {pattern.hasMask && <span className={styles.maskBadge}>Fade</span>}

                <div className={`${styles.cardName} ${dark ? styles.cardNameDark : ''}`}>
                  {pattern.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.applyBtn} disabled={!selectedId} onClick={handleConfirm}>
            {selectedId === currentPatternId ? 'Mantener selección' : 'Aplicar patrón'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple SVG icons for each category (no icon library dependency)
function PatternCategoryIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'gradient':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case 'grid_view':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'auto_awesome':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
          <circle cx="6" cy="18" r="2" fill="currentColor" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
        </svg>
      );
    case 'blur_on':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="4" cy="4" r="1.5" fill="currentColor" />
          <circle cx="20" cy="4" r="1.5" fill="currentColor" />
          <circle cx="4" cy="20" r="1.5" fill="currentColor" />
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}
