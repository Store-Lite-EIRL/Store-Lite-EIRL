'use client';

import type {
  StorefrontBackground,
  StorefrontBackgroundType,
  StorefrontColorConfig,
  StorefrontColorScheme,
  StorefrontTheme,
} from '@/core/storefront';
import { normalizeStorefrontTheme, patternToCssOverlay, randomHexColor } from '@/core/storefront';
import type { PatternCraftPattern } from '@/data/patterncraft';
import { getPatternCraftById } from '@/data/patterncraft';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { updateStorefrontTheme } from '../settings/actions';
import { PatternBrowser } from './PatternBrowser';
import styles from './StorefrontEditor.module.css';

interface StorefrontEditorProps {
  business: { id: string; slug: string };
  storefrontTheme: StorefrontTheme;
  onThemeChange: (theme: StorefrontTheme) => void;
  onPreviewSchemeChange?: (scheme: StorefrontColorScheme | undefined) => void;
  detectedColorScheme: StorefrontColorScheme;
  /** The scheme currently active on the page (from toggle or OS default). */
  currentScheme?: StorefrontColorScheme;
  plan?: string;
}

// NOTE: Built-in overlays (dots, lines, etc.) and custom CSS textarea were removed in V2.
// PatternCraft is now the only decorative pattern option.

const FONT_OPTIONS = [
  { value: 'google-sans', label: 'Predeterminado' },
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
] as const;

const SCHEME_TABS: { value: StorefrontColorScheme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const THEME_BG_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#8b5cf6',
  '#ffffff',
  '#111827',
];

export function StorefrontEditor({
  business,
  storefrontTheme,
  onThemeChange,
  onPreviewSchemeChange,
  detectedColorScheme,
  currentScheme,
  plan,
}: StorefrontEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [isPatternBrowserOpen, setIsPatternBrowserOpen] = useState(false);
  // The scheme state (light/dark) persists across open/close cycles because
  // this component stays mounted. The user's last tab selection remains active,
  // and onPreviewSchemeChange keeps the page preview showing that scheme even
  // after the editor closes. No reset logic needed here.
  const [scheme, setScheme] = useState<StorefrontColorScheme>('light');
  const panelRef = useRef<HTMLDivElement>(null);

  const currentConfig: StorefrontColorConfig = storefrontTheme[scheme];
  const bg = currentConfig.background;
  const fillType: StorefrontBackgroundType = bg?.type ?? 'solid';
  const fillColors = bg?.colors ?? ['#ffffff'];
  const fillColorCount = fillColors.length;
  const cssOverlay = bg?.cssOverlay;
  const hasPattern = !!cssOverlay?.patternId;
  // Show toggle as ON when there's any active overlay (PatternCraft or legacy built-in)
  const hasActiveOverlay = hasPattern || !!bg?.overlay;

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Sync the editor's internal scheme tab to whatever scheme is active on the
  // page (from the floating toggle or OS default) whenever the editor opens.
  useEffect(() => {
    if (!open) return;
    setScheme(currentScheme ?? detectedColorScheme);
  }, [open, currentScheme, detectedColorScheme]);

  // Close handler — keeps the last selected preview scheme so the page
  // stays in the scheme the user was editing after the editor closes.
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  // Update the color config for the current scheme (light or dark)
  const updateConfig = useCallback(
    (configPatch: Partial<StorefrontColorConfig>) => {
      const next: StorefrontTheme = {
        ...storefrontTheme,
        [scheme]: { ...storefrontTheme[scheme], ...configPatch },
      };
      onThemeChange(normalizeStorefrontTheme(next));
    },
    [storefrontTheme, scheme, onThemeChange],
  );

  // Update top-level theme properties (fontFamily)
  const updateTheme = useCallback(
    (patch: Partial<StorefrontTheme>) => {
      onThemeChange(normalizeStorefrontTheme({ ...storefrontTheme, ...patch }));
    },
    [storefrontTheme, onThemeChange],
  );

  // ── Fill helpers ──────────────────────────────────────────────

  const setBg = useCallback(
    (patch: Partial<StorefrontBackground>) => {
      const current: StorefrontBackground = {
        type: fillType,
        colors: fillColors,
      };
      // Preserve cssOverlay (PatternCraft pattern) when changing fill colors
      if (cssOverlay) {
        current.cssOverlay = cssOverlay;
      }
      updateConfig({ background: { ...current, ...patch } });
    },
    [fillType, fillColors, cssOverlay, updateConfig],
  );

  const handleColorChange = (index: number, color: string) => {
    const next = [...fillColors];
    next[index] = color;
    setBg({ colors: next });
  };

  const setColorCount = (count: number) => {
    if (count === fillColorCount) return;
    let colors: string[];
    if (count > fillColorCount) {
      colors = [...fillColors];
      while (colors.length < count) colors.push(randomHexColor());
    } else {
      colors = fillColors.slice(0, count);
    }
    // Auto-switch type: 1 = solid, 2+ = gradient
    const newType: StorefrontBackgroundType = count === 1 ? 'solid' : 'gradient';
    setBg({ type: newType, colors });
  };

  // ── Pattern toggle ────────────────────────────────────────────

  const toggleOverlay = (enable: boolean) => {
    if (enable) {
      // Toggle ON → open the browser to pick a pattern
      // If there was already a cssOverlay, it stays in the config
      if (!cssOverlay) {
        setIsPatternBrowserOpen(true);
      }
    } else {
      // Toggle OFF → remove pattern overlay, keep fill
      updateConfig({
        background: { type: fillType, colors: fillColors },
      });
    }
  };

  // ── PatternCraft browser ──────────────────────────────────────

  const handlePatternCraftSelect = useCallback(
    (pattern: PatternCraftPattern) => {
      const overlay = patternToCssOverlay(pattern);
      updateConfig({
        background: {
          type: fillType,
          colors: fillColors,
          cssOverlay: overlay,
        },
      });
    },
    [fillType, fillColors, updateConfig],
  );

  const handleRemovePatternCraft = useCallback(() => {
    // Clear cssOverlay but keep fill
    updateConfig({
      background: { type: fillType, colors: fillColors },
    });
  }, [fillType, fillColors, updateConfig]);

  // ── Global actions ───────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const result = await updateStorefrontTheme(
        business.id,
        business.slug,
        storefrontTheme,
        scheme,
        plan || 'business_pro',
      );
      if (result.success) {
        setFeedback({ message: 'Guardado correctamente' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ message: result.error || 'Error al guardar', error: true });
      }
    } catch {
      setFeedback({ message: 'Error inesperado', error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    updateConfig({ background: undefined });
  };

  const handleRandom = () => {
    // Randomiza solo colores de relleno. El patrón PatternCraft se mantiene igual.
    const next: StorefrontBackground = {
      type: fillType,
      colors: fillColors.map(() => randomHexColor()),
    };
    if (cssOverlay) {
      next.cssOverlay = { ...cssOverlay };
    }
    updateConfig({ background: next });
  };

  return (
    <>
      {/* FAB */}
      <button className={styles.fab} onClick={() => setOpen(true)} aria-label="Personalizar tienda">
        <Icon>settings</Icon>
      </button>

      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={handleClose} />}

      {/* Panel */}
      <div ref={panelRef} className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Personalizar tienda</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            <Icon>close</Icon>
          </button>
        </div>

        <div className={styles.panelBody}>
          {/* ── Toggle modo claro/oscuro ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Personaliza para:</h3>
            <div className={styles.schemeTabs}>
              {SCHEME_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={`${styles.schemeTab} ${scheme === tab.value ? styles.schemeTabActive : ''}`}
                  onClick={() => {
                    setScheme(tab.value);
                    onPreviewSchemeChange?.(tab.value);
                  }}
                >
                  {tab.value === 'light' ? <Icon>light_mode</Icon> : <Icon>dark_mode</Icon>}
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Paleta de colores ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Colores</h3>
            <div className={styles.colorList}>
              {(['primary', 'secondary', 'accent'] as const).map((key) => {
                const color = currentConfig.palette[key];
                return (
                  <div key={key} className={styles.colorRow}>
                    <div className={styles.colorPreviewWrap}>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const next = { ...currentConfig.palette, [key]: e.target.value };
                          updateConfig({ palette: next });
                        }}
                        className={styles.colorInput}
                      />
                      <span className={styles.colorPreview} style={{ backgroundColor: color }} />
                    </div>
                    <div className={styles.colorMeta}>
                      <span className={styles.colorLabel}>{key}</span>
                      <span className={styles.colorHex}>{color}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Tipografía ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Tipografía</h3>
            <div className={styles.fontGrid}>
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.fontOption} ${storefrontTheme.fontFamily === opt.value ? styles.fontOptionActive : ''}`}
                  onClick={() => updateTheme({ fontFamily: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Fondo ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Fondo</h3>

            {/* ── RELLENO (sólido / degradado) ── */}
            <div className={styles.colorCountRow}>
              <span className={styles.label}>
                {fillColorCount === 1 ? 'Sólido' : `Degradado (${fillColorCount} colores)`}
              </span>
              <div className={styles.colorCountGrid}>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    className={`${styles.colorCountBtn} ${fillColorCount === n ? styles.colorCountBtnActive : ''}`}
                    onClick={() => setColorCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Color pickers del relleno */}
            <div className={styles.colorList}>
              {fillColors.slice(0, fillColorCount).map((color, i) => (
                <div key={i} className={styles.colorRow}>
                  <div className={styles.colorPreviewWrap}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(i, e.target.value)}
                      className={styles.colorInput}
                    />
                    <span className={styles.colorPreview} style={{ backgroundColor: color }} />
                  </div>
                  <div className={styles.colorMeta}>
                    <span className={styles.colorLabel}>
                      {fillColorCount === 1 ? 'Fondo' : `Color ${i + 1}`}
                    </span>
                    <span className={styles.colorHex}>{color}</span>
                  </div>
                  {/* Suggested palette chips */}
                  <div className={styles.colorChips}>
                    {THEME_BG_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        className={`${styles.colorChip} ${c === color ? styles.colorChipActive : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorChange(i, c)}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── TOGGLE PATRÓN DECORATIVO ── */}
            <div className={styles.toggleRow}>
              <span className={styles.label}>Patrón decorativo</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={hasActiveOverlay}
                  onChange={(e) => toggleOverlay(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            {/* ── CONTROLES DEL PATRÓN ── */}
            {hasActiveOverlay && (
              <>
                {/* Active pattern info */}
                {cssOverlay?.patternId ? (
                  <div className={styles.patternCraftActive}>
                    <span className={styles.patternCraftActiveIcon}>✦</span>
                    <span>
                      Patrón:{' '}
                      <strong>
                        {getPatternCraftById(cssOverlay.patternId)?.name ?? cssOverlay.patternId}
                      </strong>
                    </span>
                    <button
                      className={styles.patternCraftRemoveBtn}
                      onClick={handleRemovePatternCraft}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className={styles.patternCraftActive}>
                    <span className={styles.patternCraftActiveIcon}>✦</span>
                    <span>Patrón decorativo activo</span>
                  </div>
                )}

                {/* Button to open PatternCraft browser */}
                <div className={styles.colorActions}>
                  <button
                    className={styles.randomBtn}
                    onClick={() => setIsPatternBrowserOpen(true)}
                    style={{ flex: 1 }}
                  >
                    <Icon>auto_awesome</Icon>
                    {cssOverlay?.patternId ? 'Cambiar patrón' : 'Seleccionar patrón'}
                  </button>
                </div>
              </>
            )}

            {/* Acciones de color */}
            <div className={styles.colorActions}>
              <button className={styles.randomBtn} onClick={handleRandom}>
                <Icon>shuffle</Icon>
                Random
              </button>
              <button className={styles.resetBtn} onClick={handleReset}>
                <Icon>restart_alt</Icon>
                Restablecer
              </button>
            </div>
          </section>
        </div>

        {/* Footer del panel */}
        <div className={styles.panelFooter}>
          {feedback && (
            <span className={`${styles.feedback} ${feedback.error ? styles.feedbackError : ''}`}>
              {feedback.message}
            </span>
          )}
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── PatternCraft Browser ── */}
      <PatternBrowser
        open={isPatternBrowserOpen}
        onClose={() => setIsPatternBrowserOpen(false)}
        onSelect={handlePatternCraftSelect}
        currentPatternId={cssOverlay?.patternId}
      />
    </>
  );
}
