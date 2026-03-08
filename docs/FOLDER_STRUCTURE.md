# Folder Structure (Current)

This document describes the current, real folder structure.

## Top-level

```text
app/            # Next.js App Router routes and page composition
src/            # Shared, feature, core, and integration code
docs/           # Project documentation
migrations/     # SQL migrations
public/         # static assets
scripts/        # utility scripts
```

## `src/`

```text
src/
  core/
    database/   # drizzle schema and db client
    providers/  # provider exports

  features/
    auth/       # implemented
    products/   # implemented (types)
    analytics/  # scaffold only
    dashboard/  # scaffold only
    notifications/ # scaffold only
    profile/    # scaffold only
    search/     # scaffold only
    settings/   # scaffold only
    users/      # scaffold only

  lib/
    material-design/
    supabase/

  shared/
    components/
      ui/
      layout/
      navigation/
      feedback/
    context/
    utils/
    index.ts

  styles/
  config/
  types/
  utils/
```

## `app/`

```text
app/
  (main)/       # home/storefront composition
  [slug]/       # tenant routes (storage, product, settings, chat)
  actions/      # server actions
  auth/         # auth pages/callback
  created/      # business creation flow
  list-business/# business list/management
```

## Practical rule

Use this rule when deciding placement:
- Route/page orchestration: `app/`
- Domain/business logic: `src/features/`
- Shared UI primitives: `src/shared/components/ui`
- Infrastructure: `src/core` and `src/lib`
