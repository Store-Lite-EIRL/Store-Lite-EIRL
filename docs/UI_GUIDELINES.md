# Material Design 3 (MD3) - UI Development Guidelines

This document codifies the mental model and rules for all UI development in this project. The goal is to build interfaces that feel like native Google applications, strictly adhering to Material Design 3 (MD3).

## 1. Components First, Divs Last

Generic `<div>` layouts and raw CSS structural blocks should be avoided unless absolutely necessary for a high-level shell wrap. We emphasize using our own UI primitives that wrap standard MD3 web components (`<md-*>`).

All these primitives live in `src/shared/components/ui/`.

**Do use:**
- `Card` (Elevated, Outlined, Filled) for section containers.
- `List` and `ListItem` for structured data rows, settings options, and navigation.
- `Chips` for status tags, small selections, or descriptors.
- `Divider` to separate semantic blocks.
- `Button`, `IconButton`, `TextButton`, `FilledTonalButton` for actions.

**Do NOT use:**
- Custom `div` styling mimicking cards or lists (e.g., `border rounded-md p-4` or equivalent CSS hashes).
- Third-party component libraries' visual logic (like shadcn/ui) if it conflicts with MD3.
- Raw `<button>` or custom styled buttons.

## 2. Token System Usage

Always use MD3 tokens instead of hardcoded hex colors or arbitrary sizing, so that the UI supports Light/Dark mode and dynamic theming natively.

- **Backgrounds:** `var(--md-sys-color-surface)` / `var(--md-sys-color-surface-container-low)`
- **Text (Primary):** `var(--md-sys-color-on-surface)`
- **Text (Secondary):** `var(--md-sys-color-on-surface-variant)`
- **Borders/Lines:** `var(--md-sys-color-outline)` / `var(--md-sys-color-outline-variant)`
- **Typography:** Always apply standard tracking and specific fonts: `var(--md-sys-typescale-headline-small-font)` or `var(--md-sys-typescale-body-medium-font)`

## 3. High-Fidelity Dashboards

When creating complex pages (like `/settings`):
1. **Shell layout:** Use an MD3 Navigation Drawer pattern for sidebars (clickable pill-shaped list items acting as links or tabs).
2. **Surfaces:** Use `Card` to wrap logical groups of information. Avoid flat un-boxed data unless heavily guided by typographies.
3. **Data Rows:** Standardize mapping over data with `List` components. Use slots (`slot="start"`, `slot="headline"`, `slot="supporting-text"`) properly instead of trying to flex-box elements inside a `ListItem`.
4. **Interactive States:** Provide clear visual feedback on hover/active states using `color-mix` with `var(--md-sys-color-on-surface)` at specific percentages (8% hover, 12% active etc.) where MD3 web components don't already handle it for you.

## 4. Why this matters

By relying on pre-built MD3 components:
- We immediately gain rippling effects, proper accessibility (A11Y), focus management, and responsive states.
- The UI becomes cohesive. A setting row looks the same as a dashboard row, creating continuity.
- Development speed increases since CSS adjustments are minimal and focused only on macro-layouts (like CSS Grid or general Flexbox spacing).

This document acts as our single source of truth for developing the visual frontend layer.
