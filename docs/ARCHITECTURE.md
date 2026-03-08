# Architecture

This project uses Next.js App Router and a feature-oriented organization in `src/`.

## Current status (2026-03-04)

The architecture is in transition from a broad template to an implemented product scope.

Implemented feature modules:
- `src/features/auth` (active)
- `src/features/products` (types currently in use)

Scaffolded but not implemented yet:
- `src/features/analytics`
- `src/features/dashboard`
- `src/features/notifications`
- `src/features/profile`
- `src/features/search`
- `src/features/settings`
- `src/features/users`

## Real source layout

```text
src/
  core/        # db client/schema and providers
  features/    # business feature modules
  lib/         # external integrations (supabase, material)
  shared/      # reusable UI, context, utils
  styles/      # global/component/material styles
  config/      # runtime config (env)
  types/       # global type declarations
  utils/       # utility helpers not tied to a feature
```

## Runtime layout

```text
app/
  (main)/      # storefront and main pages
  [slug]/      # tenant/business routes
  actions/     # server actions
```

## Dependency direction

Expected direction:

```text
app -> features -> shared -> core -> lib
```

Notes:
- `app/` still contains some business logic being migrated gradually to `src/features`.
- During migration, imports between `app/` and `src/` coexist.

## Migration guideline

When adding or refactoring functionality:
1. Put domain logic in `src/features/<feature>`.
2. Keep UI primitives in `src/shared/components/ui`.
3. Keep infrastructure concerns in `src/core` and `src/lib`.
4. Keep `app/` focused on routing, composition, and server boundaries.

## Why this document changed

Previous versions described many modules as if fully implemented.  
This version reflects what is actually present in code today to avoid architecture drift.
