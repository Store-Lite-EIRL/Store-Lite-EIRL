# Migration System — Canonical Baseline (A1 decision)

This file documents the **official convention** for how migrations operate in this repo.
Adopted as the **A1 (migration reconciliation) baseline decision** after a read-only audit
of the full `migrations/` inventory (65 files: 23 journal-tracked + 42 manual-operator).

**Status:** APPROVED. This is the source of truth for future DB-schema/security changes.

---

## 1. The system is a MIX — and that is intentional

There are two coexisting families of migration files:

| Family              | Location                                               | Tracks                                                                                                | Applied via                                                              |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Drizzle journal** | `migrations/meta/_journal.json` + `*_snapshot.json`    | **Only** objects modeled in `src/core/database/schema/*.ts`                                           | Drizzle tooling / CI                                                     |
| **Manual operator** | `migrations/*.sql` (descriptive names, NOT in journal) | **Security, operator and seed** objects (RLS, policies, triggers, functions, storage, data backfills) | `scripts/apply-migration.mjs` or manual SQL (psql / Supabase SQL editor) |

**Why:** RLS policies, triggers, functions, and storage objects live **only** in manual
`.sql` files. The Drizzle journal contains **zero** `CREATE POLICY` / `ENABLE ROW LEVEL
SECURITY` / `CREATE FUNCTION` / `CREATE TRIGGER`. This split is by design.

---

## 2. Canonical baseline (what is ground truth)

- **The manual-operator chain is the canonical source of truth** for everything that is
  **not** modeled in `schema.ts` (security, operator actions, seeds, data fixes).
- **The Drizzle journal is frozen** as the historical record of `schema.ts`-modeled objects.
  It is **never re-applied, never renumbered, never re-generated against prod**.

### Files that are never touched (do NOT rewrite / renumber / delete)

- Any **applied** manual `.sql`. Renumbering an applied file would break the applied state.
- `migrations/meta/_journal.json` and existing snapshots (frozen history).
- `migrations/0000_special_crystal.sql` — **abandoned** (444-line superseded dump).
  It is dead, conflicts with the committed baseline if applied, and is **excluded** from
  any runner or baseline. Never renumber it.

---

## 3. Adding a new manual migration

1. **Pick the next-free numeric prefix** across **ALL** pending PRs (not just develop).
   - Highest applied manual prefix today: `0040`. Next is **`0041`**, then `0042`, …
2. Name the file with the prefix + descriptive kebab-case domain,
   e.g. `0041_<domain>_<action>.sql`.
3. Follow the operator style: a header comment explaining intent + `--> statement-breakpoint`
   separators if multiple statements are intended to run separately.
4. Safety rules:
   - **Idempotency preferred** where possible (`IF EXISTS` / `IF NOT EXISTS` / DO blocks)
     so re-running is safe.
   - **Destructive statements** (e.g. `DELETE`, `DROP`, `ALTER ... TYPE`) require explicit
     pre-validation of affected data and a rollback note.
   - A manual migration is **applied manually by an operator** to a DB; merging into the
     repo does **not** apply it automatically.

---

## 4. Drizzle-kit policy (CRITICAL)

> **`drizzle-kit push` against a database is FORBIDDEN.**

Because security objects live only in manual files (not in `schema.ts`), a `push` /
regenerate from `schema.ts` would **DROP the entire RLS/security layer** in one shot.

Allowed:

- `drizzle-kit generate` **locally** to produce new DDL for schema.ts-modeled changes
  (review the output; the security layer is NOT regenerated).

Forbidden:

- `drizzle-kit push` / `db:push` against any environment (dev or prod).

---

## 5. Journal freezes and known anomalies (informational)

The journal already has quirks that are **frozen by design** (not to be "fixed" by
renumbering applied files):

- idx `11` is absent from the journal; the manual file `0011_reassert_profiles_rls.sql`
  occupies that prefix in the manual chain.
- idx `18` & `19` are both tagged `0018` (a Drizzle duplicate generated as a second 0018).
- idx `21` is tagged `0020_ancient_winter_soldier`; the manual `0021_add_order_events_and_version.sql`
  occupies prefix `0021` in the manual chain.
- No snapshot exists for the journal `0023` entry.
- Prefix `00xx` collisions between journal and manual files are **expected** (e.g. `0013`,
  `0018`, `0019`, `0020`, `0022`, `0023`, `0025`). The journal prefix and the manual prefix
  diverge by design; they are **different namespaces**.

These are NOT bugs to correct and MUST NOT be renumbered (see §2). They are frozen history.

---

## 6. Applying to databases (operator)

To apply a manual migration to a DB run through the operator runner or directly:

```bash
node scripts/apply-migration.mjs migrations/0041_<domain>_<action>.sql
```

or via psql / Supabase SQL editor. The runner (`apply-migration.mjs`) is **not read-only**
and **continues after an error** — always review and pre-validate before running against a
database you care about.

> Note: merging a migration PR into `develop` does **not** apply it. Application to dev/prod
> is a deliberate manual operator step.

---

_Convention adopted under the A1 baseline decision (Store_Lite). See
`tasks-pendient/PENDING-DATABASE-DEBT.md` for the surrounding debt plan._
