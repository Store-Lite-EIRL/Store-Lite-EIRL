---
name: material-design-3
description: Design with Material Design 3 principles, tokens, and components. Covers color systems, typography, spacing, component patterns, and responsive layouts following the Material Design 3 specification.
---

# Material Design 3 Design System

Design interfaces with Material Design 3 principles, tokens, and component patterns.

## When to Use This Skill

Use this skill when:

- Building components or layouts following Material Design 3 specifications
- Defining color systems, typography, or spacing scales
- Creating responsive layouts and adaptive components
- Implementing Material Web Components
- Establishing design tokens and theme systems
- Working with light, dark, and high-contrast color modes
- Need guidance on Material Design 3 patterns and best practices
- Wanting to maintain consistency with MD3 2024 specifications

---

## Material Design 3 Fundamentals

### Core Principles

Material Design 3 is built on:

1. **Color**: Dynamic color systems using tokens (primary, secondary, tertiary, neutral)
2. **Typography**: Type scale with clear hierarchy (display, headline, title, body, label)
3. **Shape**: Consistent corner radius, from sharp to rounded across states
4. **Motion**: Meaningful motion with easing curves
5. **Elevation**: Visual hierarchy through surfaces and shadows
6. **Density**: Flexible spacing for different contexts

### The Design Token Hierarchy

All visual decisions flow from tokens:

```
Base Colors (Brand)
    ↓
Tonal Palette (Tones 0-100)
    ↓
Semantic Tokens (primary, secondary, tertiary, error, etc.)
    ↓
Component Tokens (button, card, input, etc.)
    ↓
State Tokens (hover, focus, disabled, etc.)
```

---

## Color System

### Token Naming Conventions

**Semantic tokens** describe role, not appearance:

```css
/* Semantic naming (MD3 standard) */
--md-sys-color-primary: #6750a4;
--md-sys-color-on-primary: #ffffff;
--md-sys-color-primary-container: #eaddff;
--md-sys-color-on-primary-container: #21005e;

--md-sys-color-secondary: #625b71;
--md-sys-color-on-secondary: #ffffff;
--md-sys-color-secondary-container: #e8def8;
--md-sys-color-on-secondary-container: #1e192b;

--md-sys-color-tertiary: #7d5260;
--md-sys-color-on-tertiary: #ffffff;
--md-sys-color-tertiary-container: #ffd8e4;
--md-sys-color-on-tertiary-container: #31111d;

--md-sys-color-error: #b3261e;
--md-sys-color-on-error: #ffffff;
--md-sys-color-error-container: #f9dedc;
--md-sys-color-on-error-container: #410e0b;

--md-sys-color-background: #fffbfe;
--md-sys-color-on-background: #1c1b1f;
--md-sys-color-surface: #fffbfe;
--md-sys-color-on-surface: #1c1b1f;
--md-sys-color-surface-variant: #e7e0ec;
--md-sys-color-on-surface-variant: #49454e;
```

### Color Modes

**Light Mode**: Base brand colors with lower tones for content
**Dark Mode**: Base brand colors with higher tones for content, darker background
**High Contrast**: Increased saturation and contrast for accessibility

```css
/* Light theme */
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-background: #fffbfe;
  --md-sys-color-surface: #fffbfe;
}

/* Dark theme */
[data-theme='dark'] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-background: #1c1b1f;
  --md-sys-color-surface: #1c1b1f;
}

/* High contrast */
[data-theme='dark-hc'] {
  --md-sys-color-primary: #f6d7ff;
  --md-sys-color-surface: #0a0a0a;
}
```

---

## Typography

### Type Scale Definition

```css
--md-sys-typescale-display-large: font-size: 57px;
line-height: 64px;
letter-spacing: -0.25px;
font-weight: 400;

--md-sys-typescale-display-medium: font-size: 45px;
line-height: 52px;
letter-spacing: 0px;
font-weight: 400;

--md-sys-typescale-display-small: font-size: 36px;
line-height: 44px;
letter-spacing: 0px;
font-weight: 400;

--md-sys-typescale-headline-large: font-size: 32px;
line-height: 40px;
letter-spacing: 0px;
font-weight: 400;

--md-sys-typescale-headline-medium: font-size: 28px;
line-height: 36px;
letter-spacing: 0px;
font-weight: 400;

--md-sys-typescale-headline-small: font-size: 24px;
line-height: 32px;
letter-spacing: 0px;
font-weight: 400;

--md-sys-typescale-title-large: font-size: 22px;
line-height: 28px;
letter-spacing: 0px;
font-weight: 500;

--md-sys-typescale-title-medium: font-size: 16px;
line-height: 24px;
letter-spacing: 0.15px;
font-weight: 500;

--md-sys-typescale-title-small: font-size: 14px;
line-height: 20px;
letter-spacing: 0.1px;
font-weight: 500;

--md-sys-typescale-body-large: font-size: 16px;
line-height: 24px;
letter-spacing: 0.15px;
font-weight: 400;

--md-sys-typescale-body-medium: font-size: 14px;
line-height: 20px;
letter-spacing: 0.25px;
font-weight: 400;

--md-sys-typescale-body-small: font-size: 12px;
line-height: 16px;
letter-spacing: 0.4px;
font-weight: 400;

--md-sys-typescale-label-large: font-size: 14px;
line-height: 20px;
letter-spacing: 0.1px;
font-weight: 500;

--md-sys-typescale-label-medium: font-size: 12px;
line-height: 16px;
letter-spacing: 0.5px;
font-weight: 500;

--md-sys-typescale-label-small: font-size: 11px;
line-height: 16px;
letter-spacing: 0.5px;
font-weight: 500;
```

---

## Component Patterns

### Buttons

```css
/* Filled Button (default) */
md-filled-button {
  --md-sys-color-primary: var(--md-sys-color-primary);
  --md-sys-color-on-primary: var(--md-sys-color-on-primary);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
}

/* Outlined Button */
md-outlined-button {
  border: 1px solid var(--md-sys-color-outline);
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
}

/* Text Button */
md-text-button {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
}

/* Elevated Button */
md-elevated-button {
  background-color: var(--md-sys-color-surface-dim);
  color: var(--md-sys-color-primary);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
}

/* FAB (Floating Action Button) */
md-fab {
  --md-sys-color-primary: var(--md-sys-color-primary);
  border-radius: 16px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Input Fields

```css
/* Filled Text Input */
md-filled-text-field {
  --md-sys-color-primary: var(--md-sys-color-primary);
  --md-sys-color-on-surface: var(--md-sys-color-on-surface);
  width: 100%;
  border-radius: 4px 4px 0px 0px;
  background-color: var(--md-sys-color-surface-variant);
  padding: 8px 16px;
  font-size: 16px;
  min-height: 56px;
}

/* Outlined Text Input */
md-outlined-text-field {
  --md-sys-color-outline: var(--md-sys-color-outline);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 16px;
  min-height: 56px;
}
```

### Cards

```css
/* Elevated Card */
md-card-elevated {
  background-color: var(--md-sys-color-surface);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
}

/* Outlined Card */
md-card-outlined {
  background-color: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 12px;
  padding: 16px;
}

/* Filled Card */
md-card-filled {
  background-color: var(--md-sys-color-surface-variant);
  border-radius: 12px;
  padding: 16px;
}
```

### Navigation

```css
/* Navigation Bar */
md-navigation-bar {
  background-color: var(--md-sys-color-surface);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  height: 80px;
}

/* Navigation Rail */
md-navigation-drawer {
  background-color: var(--md-sys-color-surface);
  width: 360px;
  padding: 12px;
  border-right: 1px solid var(--md-sys-color-outline-variant);
}

/* Navigation Tabs */
md-tabs {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  gap: 8px;
}
```

---

## Spacing System

### Spacing Scale

```css
/* Spacing tokens (multiples of 4px) */
--md-sys-spacing-0: 0px;
--md-sys-spacing-1: 4px;
--md-sys-spacing-2: 8px;
--md-sys-spacing-3: 12px;
--md-sys-spacing-4: 16px;
--md-sys-spacing-5: 20px;
--md-sys-spacing-6: 24px;
--md-sys-spacing-7: 28px;
--md-sys-spacing-8: 32px;
--md-sys-spacing-9: 36px;
--md-sys-spacing-10: 40px;
--md-sys-spacing-11: 44px;
--md-sys-spacing-12: 48px;
--md-sys-spacing-16: 64px;
--md-sys-spacing-20: 80px;
--md-sys-spacing-24: 96px;
```

### Responsive Spacing

```css
/* Mobile-first approach */
.container {
  padding: var(--md-sys-spacing-4); /* 16px */
}

/* Tablet and up */
@media (min-width: 600px) {
  .container {
    padding: var(--md-sys-spacing-6); /* 24px */
  }
}

/* Desktop and up */
@media (min-width: 1200px) {
  .container {
    padding: var(--md-sys-spacing-8); /* 32px */
  }
}
```

---

## Elevation & Shadows

### Shadow System

```css
/* Elevation 0 (no shadow) */
--md-sys-elevation-0: none;

/* Elevation 1 */
--md-sys-elevation-1: 0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24);

/* Elevation 2 */
--md-sys-elevation-2: 0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23);

/* Elevation 3 */
--md-sys-elevation-3: 0px 10px 20px rgba(0, 0, 0, 0.19), 0px 3px 6px rgba(0, 0, 0, 0.23);

/* Elevation 4 */
--md-sys-elevation-4: 0px 15px 25px rgba(0, 0, 0, 0.15), 0px 5px 10px rgba(0, 0, 0, 0.05);

/* Elevation 5 */
--md-sys-elevation-5: 0px 20px 35px rgba(0, 0, 0, 0.12), 0px 3px 8px rgba(0, 0, 0, 0.16);
```

---

## State Patterns

### Interactive States

```css
/* Hover state */
button:hover {
  opacity: 0.92;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
}

/* Focus state */
button:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

/* Disabled state */
button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

/* Active/pressed state */
button:active {
  opacity: 0.88;
}
```

---

## Responsive Layout Patterns

### Grid System (12-column)

```css
/* Container */
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--md-sys-spacing-4);
  max-width: 1280px;
  margin: 0 auto;
}

/* Full width */
.grid-item-full {
  grid-column: 1 / -1;
}

/* Half width */
.grid-item-half {
  grid-column: span 6;
}

/* Third width */
.grid-item-third {
  grid-column: span 4;
}

/* Quarter width */
.grid-item-quarter {
  grid-column: span 3;
}

/* Responsive grid */
@media (max-width: 900px) {
  .grid-item-third {
    grid-column: span 6;
  }
  .grid-item-half {
    grid-column: span 12;
  }
}

@media (max-width: 600px) {
  .grid-item-full,
  .grid-item-half,
  .grid-item-third,
  .grid-item-quarter {
    grid-column: 1 / -1;
  }
}
```

---

## Common Design Patterns

### Dialog/Modal Pattern

```css
md-dialog {
  --md-sys-color-surface: var(--md-sys-color-surface);
  border-radius: 28px;
  max-width: 560px;
  padding: 24px;
  box-shadow: 0px 12px 16px -4px rgba(0, 0, 0, 0.1);
}

md-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.32);
}
```

### Bottom Sheet Pattern

```css
md-bottom-sheet {
  --md-sys-color-surface: var(--md-sys-color-surface);
  border-radius: 28px 28px 0 0;
  max-height: 60vh;
  padding: 16px 24px;
  box-shadow: 0px 12px 16px -4px rgba(0, 0, 0, 0.1);
}
```

### List Pattern

```css
md-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

md-list-item {
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--md-sys-color-surface);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

md-list-item:hover {
  background-color: var(--md-sys-color-surface-variant);
}
```

---

## Implementation Checklist

When designing with MD3:

- [ ] Define semantic tokens for your theme
- [ ] Establish color modes (light, dark, high-contrast)
- [ ] Create typography scale classes
- [ ] Set spacing variables for responsive design
- [ ] Define elevation/shadow tokens
- [ ] Implement state variations (hover, focus, disabled)
- [ ] Test color contrast (WCAG AA minimum 4.5:1 for text)
- [ ] Validate responsive layout at breakpoints
- [ ] Document token usage for the team
- [ ] Audit for consistency across components

---

## Key Resources

- [Material Design 3 Official Documentation](https://m3.material.io/)
- [Material Design Color System](https://m3.material.io/styles/color/overview)
- [Material Design Typography](https://m3.material.io/styles/typography/overview)
- [Material Web Components](https://github.com/material-components/material-web)
- [Material Design Figma File](https://www.figma.com/community/file/1035203688168986460)

---

## Design Decision Template

For every component or pattern decision:

1. **What is the user doing?** (Context)
2. **Why does this material decision matter?** (Intent)
3. **Which MD3 tokens apply?** (Technical)
4. **How does this maintain consistency?** (System)
5. **What states must be supported?** (Completeness)

If you cannot answer these questions, your design is incomplete.
