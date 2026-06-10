# Tasks: Public Theme Toggle

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~120        |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Component Creation

- [x] 1.1 **Create `app/[slug]/components/ThemeToggle.tsx`** — Client component with `'use client'`, receives `currentScheme: 'light' | 'dark'` and `onToggle: () => void`. Renders a `<button>` with `position: fixed; bottom: 1.75rem; right: 1.75rem` styles. Icon: inline sun SVG when `currentScheme === 'light'`, moon SVG when `'dark'`. Dynamic `aria-label`: `"Cambiar a modo oscuro"` (light→dark) / `"Cambiar a modo claro"` (dark→light). Keyboard-focusable by default (native `<button>`). Must not touch localStorage.
- [x] 1.2 **Create `app/[slug]/components/ThemeToggle.module.css`** — FAB styles: `z-index: 50` (below cart z:1000, chat z:900), 56×56px, border-radius 28px, `--md-sys-color-primary-container` bg, `--md-sys-color-on-primary-container` icon fill, `focus-visible` ring.

## Phase 2: Core Implementation

- [x] 2.1 **Add `viewerTheme` state and localStorage effect in `BusinessPageContent.tsx`** — Added `const [viewerTheme, setViewerTheme] = useState<'light' | 'dark' | null>(null);` after `previewScheme`. Added mount `useEffect` reading `localStorage.getItem('storefront-theme')` with validation, wrapped in try/catch. Added persist `useEffect` writing to localStorage on `viewerTheme` change.
- [x] 2.2 **Add toggle handler** — Added `handleViewerThemeToggle = useCallback(...)` that flips `viewerTheme` between `'light'` and `'dark'`.
- [x] 2.3 **Update `activeScheme` priority** — Changed to use `resolveActiveScheme(viewerTheme, previewScheme, effectiveTheme)` pure function with priority: viewer > preview > effective.
- [x] 2.4 **Import and render ThemeToggle in viewer mode** — Added import and rendered `<ThemeToggle currentScheme={activeScheme} onToggle={handleViewerThemeToggle} />` inside `!isStaff` block.

## Phase 3: Transitions

- [x] 3.1 **Add CSS transition to `.storefrontThemeRoot`** — Added `transition: background-color 300ms ease, box-shadow 300ms ease, color 300ms ease;` to `.storefrontThemeRoot`. Also added `root.style.transition` and `document.body.style.transition` for smooth html/body transitions.

## Phase 4: Verification

- [x] 4.1 **Verified via vitest and tsc**: 92 tests passing (80 existing + 8 ThemeToggle + 4 schemeResolution). tsc --noEmit: no new errors (pre-existing errors in unrelated files).
