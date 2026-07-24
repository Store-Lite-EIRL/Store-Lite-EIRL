# Design: Public Theme Toggle

## Technical Approach

Add a controlled `ThemeToggle` FAB component inside the existing `!isStaff` block of `BusinessPageContentUI`. The component receives the current scheme and emits toggle events; the parent owns the `viewerTheme` state, reads/writes `localStorage`, and recomputes `activeScheme`.

## Architecture Decisions

### Decision: Controlled component (parent-owns-state)

| Option                                                  | Tradeoff                                                                                                    | Decision |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Self-contained (state + localStorage in child)          | Child reads localStorage on mount, parent must wait for callback to resolve scheme — adds timing complexity | ❌       |
| Controlled (parent owns state, child is presentational) | Parent initializes from localStorage in useEffect, passes currentScheme as prop — no timing race            | ✅       |

**Rationale**: The parent computes `activeScheme` _before_ rendering. If ThemeToggle owned the state, the parent would render once with `null` (wrong scheme), then re-render after the child signals the stored value. Controlled avoids this flash.

### Decision: localStorage reads in parent, writes in callback

Both read and write happen in `BusinessPageContentUI`. ThemeToggle never touches `localStorage` — it's a pure button. This keeps the component testable and reusable.

### Decision: CSS transitions on `.storefrontThemeRoot` not on `:root`

The existing `useEffect` syncs theme CSS vars to `document.documentElement`, but the component content renders inside a `<div className={styles.storefrontThemeRoot}>`. Adding `transition` to that container localizes the animation without affecting global elements.

## Data Flow

```
[localStorage]
   │
   ├── mount: read 'storefront-theme' → set viewerTheme
   │
   ▼
BusinessPageContentUI
   │
   ├── activeScheme = viewerTheme ?? previewScheme ?? effectiveTheme
   ├── passes activeScheme ↓ as currentScheme prop
   │
   ▼
ThemeToggle (renders sun/moon icon)
   │
   └── onClick → onToggle callback → setViewerTheme(next) + localStorage.setItem()
        ↓
   activeScheme recomputes → themeStyles regenerates → useEffect syncs CSS vars → UI animates
```

## Interfaces / Contracts

```typescript
// ThemeToggle.tsx
interface ThemeToggleProps {
  currentScheme: 'light' | 'dark';
  onToggle: () => void;
}

// In BusinessPageContentUI
const [viewerTheme, setViewerTheme] = useState<'light' | 'dark' | null>(null);

// On mount
useEffect(() => {
  try {
    const stored = localStorage.getItem('storefront-theme');
    if (stored === 'light' || stored === 'dark') setViewerTheme(stored);
  } catch {
    /* Safari private mode */
  }
}, []);

// Toggle handler
const handleViewerThemeToggle = useCallback(() => {
  setViewerTheme((prev) => {
    const next = prev === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('storefront-theme', next);
    } catch {
      /* noop */
    }
    return next;
  });
}, []);

// Modified active scheme
const activeScheme = viewerTheme ?? previewScheme ?? (effectiveTheme as StorefrontColorScheme);
```

## Component Tree (viewer mode)

```
<BusinessPageContentUI>                        ← state owner
  <div className={styles.storefrontThemeRoot}> ← CSS transition target
    {sections...}
  </div>
  <FloatingCartButton />                       ← existing
  <CartDrawer />
  <FloatingChatFab />                          ← existing, conditional
  <ThemeToggle                                 ← NEW
    currentScheme={activeScheme}
    onToggle={handleViewerThemeToggle}
  />
  <BasicContactDialog />
  <LookupOrderModal />
</BusinessPageContentUI>
```

## CSS Strategy

| Concern          | Approach                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positioning      | `ThemeToggle.module.css`: `position: fixed; bottom: 24px; right: 24px; z-index: 50` — between cart (z:1000) and chat (z:900)                         |
| Icon             | Inline SVG path for sun (light) / moon (dark), 24×24px                                                                                               |
| Hover/active     | Match FloatingChatFab pattern: `::before` overlay, scale transform                                                                                   |
| Theme transition | Add `transition: background-color 300ms ease, box-shadow 300ms ease, color 300ms ease` to `.storefrontThemeRoot` in `BusinessPageContent.module.css` |
| Button colors    | Use `--md-sys-color-surface-container-highest` for bg, `--md-sys-color-primary` for icon fill                                                        |
| Animation        | `slideIn` keyframes matching FloatingCartButton pattern                                                                                              |

## File Changes

| File                                           | Action | Description                                                         |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `app/[slug]/components/ThemeToggle.tsx`        | Create | Client component, controlled, inline SVG icons                      |
| `app/[slug]/components/ThemeToggle.module.css` | Create | FAB styles, fixed position, transitions                             |
| `app/[slug]/BusinessPageContent.tsx`           | Modify | Add `viewerTheme` state + effect + handler + import + render toggle |
| `app/[slug]/BusinessPageContent.module.css`    | Modify | Add `transition` on `.storefrontThemeRoot`                          |

## Integration Points

1. **Import** in `BusinessPageContent.tsx`: `import { ThemeToggle } from './components/ThemeToggle';`
2. **State** at line ~186 alongside `previewScheme`: add `viewerTheme` state
3. **Effect** after existing useEffect (line 496): mount effect for localStorage read
4. **Computation** at line 372: change `activeScheme` to include `viewerTheme ??`
5. **Render** after line 548 inside `!isStaff` block: `<ThemeToggle currentScheme={activeScheme} onToggle={handleViewerThemeToggle} />`

## Edge Cases

| Case                                           | Handling                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | --- | --------------------------- |
| Safari private mode                            | `localStorage.setItem` in try/catch — no crash, toggle works for session                      |
| No stored preference                           | `viewerTheme` stays `null` → falls through to `effectiveTheme` (business default)             |
| Theme flash on load                            | Acceptable — cosmetic only, no layout CLS                                                     |
| Admin editing                                  | `isStaff` is true → toggle not rendered; `viewerTheme` stays `null` → `previewScheme` governs |
| Staff member viewing own storefront logged out | `isStaff` is false → toggle renders. Staff can use toggle like any visitor.                   |
| localStorage corrupted (non-valid value)       | Strict check `=== 'light'                                                                     |     | === 'dark'` ignores garbage |

## Testing Strategy

| Layer       | What                                        | Approach                                                         |
| ----------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Unit        | ThemeToggle renders correct icon per scheme | Render with `currentScheme='dark'`, assert moon SVG present      |
| Unit        | `onToggle` fires on click                   | `fireEvent.click` on button, assert callback called              |
| Integration | localStorage read on mount                  | Mock `localStorage.getItem`, assert `viewerTheme` initializes    |
| Integration | Toggle persists and recomputes activeScheme | Click toggle → assert scheme flips + localStorage written        |
| E2E         | Full flow                                   | Playwright: visit storefront → toggle → reload → scheme persists |

## Migration / Rollout

No migration required. Zero-config additive feature.

## Open Questions

None.
