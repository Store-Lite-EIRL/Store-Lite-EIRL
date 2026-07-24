# Public Theme Toggle Specification

## Purpose

Allow storefront visitors to switch between light and dark themes independently of OS preference or the business's configured scheme, with their choice persisted across page reloads.

## Requirements

### Requirement: Theme Toggle FAB

A floating action button (FAB) MUST be rendered at the bottom-right of the public storefront view (not in admin editing mode) that toggles between `light` and `dark` themes on click.

#### Scenario: Toggle from light to dark

- GIVEN the visitor is viewing the storefront in light mode
- WHEN they click the theme toggle FAB
- THEN the storefront transitions to dark mode with a 300ms CSS transition on `background-color` and `background-image`
- AND the icon updates to the moon symbol

#### Scenario: Toggle from dark to light

- GIVEN the visitor is viewing the storefront in dark mode
- WHEN they click the theme toggle FAB
- THEN the storefront transitions to light mode with a 300ms CSS transition
- AND the icon updates to the sun symbol

#### Scenario: FAB is hidden in admin editing mode

- GIVEN a staff user is editing the storefront (`isStaff` is true)
- WHEN the storefront renders
- THEN the theme toggle FAB MUST NOT appear
- AND the admin preview scheme overrides any stored preference

#### Scenario: Default fallback when no preference is stored

- GIVEN a visitor has no stored theme preference (first visit or localStorage cleared)
- AND the business has configured a default scheme (e.g. `light`)
- WHEN the storefront renders
- THEN the visible theme is the business's configured scheme
- AND the FAB icon shows the opposite-mode symbol

### Requirement: localStorage Persistence

The chosen theme MUST be persisted to `localStorage` under the key `storefront-theme` and restored on subsequent visits.

#### Scenario: Preference survives page reload

- GIVEN a visitor has toggled the theme to `dark`
- WHEN they reload or navigate to another page on the same storefront
- THEN the storefront renders in dark mode

#### Scenario: Safari private mode does not break the toggle

- GIVEN the visitor is using Safari in private browsing mode (localStorage writes throw)
- WHEN they click the theme toggle FAB
- THEN the theme switches visually
- AND no console error appears (write is wrapped in try/catch)
- AND the toggle remains functional for the session

#### Scenario: Clearing localStorage resets to business default

- GIVEN a visitor has a stored preference of `dark`
- WHEN they clear their browser localStorage for the domain
- AND they reload the storefront
- THEN the visible theme reverts to the business's configured scheme

### Requirement: Priority Resolution

The effective scheme MUST follow this priority: stored user preference > admin preview scheme > business-configured effective-theme.

#### Scenario: User preference takes precedence over business default

- GIVEN the business scheme is `light`
- AND the visitor has previously selected `dark` (stored in localStorage)
- WHEN the storefront renders
- THEN the visible theme is `dark`

### Requirement: Accessibility

The toggle FAB MUST be keyboard-operable and provide proper screen reader labels.

#### Scenario: Keyboard activation

- GIVEN the toggle FAB is focused (tabindex 0)
- WHEN the visitor presses Enter or Space
- THEN the theme toggles

#### Scenario: Dynamic aria-label

- GIVEN the storefront is in light mode
- WHEN the FAB renders
- THEN its `aria-label` is `"Cambiar a modo oscuro"`
- WHEN the visitor toggles to dark mode
- THEN the `aria-label` updates to `"Cambiar a modo claro"`
