# Proposal: Public Theme Toggle

## Intent

Storefront visitors have no way to switch between light/dark themes independently of their OS preference or the business's configured scheme. Add a floating action button (FAB) that lets viewers toggle themes and persists their choice across page reloads.

## Scope

### In Scope

- ThemeToggle component: bottom-right FAB with sun/moon icon
- localStorage persistence under `storefront-theme` key
- Viewer-only visibility (hidden when `isStaff` is true)
- Reactive `activeScheme` — overridable by user toggle while respecting business default as fallback
- CSS-only transitions, no animation library

### Out of Scope

- System-preference detection via matchMedia
- Admin/editor experience changes (StorefrontEditor untouched)
- Analytics tracking
- Animation libraries

## Capabilities

### New Capabilities

- `public-theme-toggle`: Visitor-controlled dark/light theme switcher for the storefront view, persisted to localStorage

### Modified Capabilities

None — this is a pure additive feature.

## Approach

1. Create `app/[slug]/components/ThemeToggle.tsx` — a client component with:
   - Internal state initialized from `localStorage.getItem('storefront-theme')` or `null` (follow business default)
   - FAB at `position: fixed; bottom: 1.75rem; right: 1.75rem` with sun/dark mode icons
   - `aria-label`, keyboard navigation, MD3 colors via CSS vars
2. Modify `BusinessPageContent.tsx`:
   - Add `viewerTheme` state (`'light' | 'dark' | null`) that overrides `activeScheme` when set
   - On mount, read localStorage — if a preference exists, seed `viewerTheme`
   - Replace `const activeScheme` with reactive expression: `viewerTheme ?? previewScheme ?? (effectiveTheme as StorefrontColorScheme)`
   - Render `<ThemeToggle>` inside the existing `!isStaff` block (line ~529)
3. `useEffect` that syncs CSS vars already runs on `activeScheme` changes — no additional wiring needed

## Affected Areas

| Area                                           | Impact   | Description                                                   |
| ---------------------------------------------- | -------- | ------------------------------------------------------------- |
| `app/[slug]/BusinessPageContent.tsx`           | Modified | Add `viewerTheme` state, update `activeScheme`, render toggle |
| `app/[slug]/components/ThemeToggle.tsx`        | New      | Toggle FAB component                                          |
| `app/[slug]/components/ThemeToggle.module.css` | New      | Toggle FAB styles                                             |

## Risks

| Risk                                                     | Likelihood | Mitigation                                                                                        |
| -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| Theme flash on page load (FOUC) before localStorage read | Medium     | Acceptable — theme is a cosmetic preference, not structural layout                                |
| Admin preview scheme conflicts with viewer toggle        | Low        | `previewScheme` is `undefined` for viewers; viewerTheme only applies when `previewScheme` is null |

## Rollback Plan

Revert the two file changes (BusinessPageContent.tsx edits + delete ThemeToggle.tsx). Literal `git revert` of the feature commit — no data migrations needed.

## Dependencies

None — everything uses existing ThemeContext (`effectiveTheme`, `setTheme`) and CSS var infrastructure.

## Success Criteria

- [ ] FAB renders at bottom-right only when viewing (not editing)
- [ ] Clicking toggles between light/dark with smooth CSS transition
- [ ] Choice persists across page reload (localStorage)
- [ ] Reverting to business default resets localStorage value
- [ ] FAB uses MD3 CSS vars for colors matching current scheme
- [ ] `aria-label` present and button is keyboard-focusable
