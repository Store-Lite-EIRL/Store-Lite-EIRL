# Taskt Database Architecture Review (Pre-Implementation)

> **STATUS TRACKER (updated 2026-09-03)** — items below are marked as they are completed.
> Legend: `[RESUELTO]` = done (PR noted); `[DEUDA]` = genuine debt, still pending; `[OPCIONAL]` = future-scale improvement, can defer.

## Purpose

Architecture-level review of the current database model with focus on:

- integrity and correctness
- performance and query patterns
- flexibility and long-term maintainability
- risks to production behavior

All recommendations are written as **possible decisions** for senior approval.

## Review Metadata

- Date: 2026-03-19
- Source analyzed: `src/core/database/schema.ts` + `migrations/*.sql` + query usage in `app/*`
- Type: static review only

---

## Global Findings

1. Migration lineage appears inconsistent across files and journal state. — **[RESUELTO]** AUDIT (2026-09): 65 files total = 23 journal-tracked + 42 manual-operator. Canonical baseline decision: manual-operator chain is source of truth for non-schema.ts objects; journal frozen as history; `drizzle-kit push` FORBIDDEN. Documented in `migrations/README.md` (PR #124, merged). Never rewrite/renumber applied manual files; next prefix = next-free across ALL pending PRs (current highest: 0043).

- Evidence:
  - `migrations/meta/_journal.json` (shows entries until `0004`)
  - `migrations/0005..0009` exist but are not reflected in journal
- Risk: environments may have different schemas and behavior.
- Possible decision: define a canonical baseline migration set and reconcile all environments.

2. Subscription model has dual sources of truth. — **[RESUELTO]** AUDIT (2026-09): `businesses.plan_*` does NOT exist in schema, snapshot 0022, or types, and was verified ABSENT in both live DBs (`information_schema`: 0 plan cols on businesses; business_subscriptions has all plan_*). Migration `0009_bouncy_morg.sql` only drops constraints (does NOT add plan_*); `0013_sync_businesses_schema.sql` creates business_subscriptions (plan_* there), not on businesses. App reads plan exclusively from `business_subscriptions`. No dual truth — keep business_subscriptions; nothing to deprecate on businesses (plan_* in plan_payments is billing, not source of truth).

3. `database.types.ts` appears stale vs current schema. — **[RESUELTO]** regenerated from live project (PR #119, 2026-08). PostgrestVersion 14.5, ~35 public tables. Regeneration via `cmd /c` redirect (PowerShell `>` writes UTF-16 = binary corruption).

- Risk: silent runtime bugs and invalid assumptions in typed queries.
- Possible decision: regenerate DB types as a release gate.

---

## Table-by-Table Matrix

## `profiles`

- Integrity:
  - Good: FK to `auth.users`, unique email, age check.
  - Risk: table contains PII (`email`, `phone`, `address`, `age`) and policy history suggests broad read exposure.
- Performance:
  - Good: indexes on email and full name.
- Flexibility:
  - Moderate: lacks explicit privacy tiering per field.
- Possible decisions:
  - move public-safe profile data to a separate view/table
  - keep sensitive columns private-only by policy

## `businesses`

- Integrity:
  - Good: slug unique + format check, owner FK.
  - Risk: no guaranteed lifecycle governance for `isActive` in related flows.
- Performance:
  - Good: owner, slug, active, createdAt indexes.
- Flexibility:
  - Moderate: many nullable legal/contact columns in same table.
- Possible decisions:
  - split legal/compliance data into `business_legal_details` — **[OPCIONAL]** future-scale; nullable legal/contact columns are OK for now.
  - define strict behavior contract for `isActive` (browse/pay/chat/admin) — **[DEUDA]**

## `business_subscriptions`

- Integrity:
  - Good: status/plan enums.
  - Risk: multiple historical rows are possible without a strict “single current subscription” invariant.
- Performance:
  - Good: business, gateway, createdAt indexes.
- Flexibility:
  - Good for billing history, but needs current-row semantics.
- Possible decisions:
  - add partial unique index for current active/trial row per business — **[DEUDA]** same pattern as chat partial unique (PR #122). Needs data audit first (like chat_sessions did).
  - add lifecycle checks (`plan_end_date >= plan_start_date` when both set) — **[DEUDA]**

## `business_settings`

- Integrity:
  - Good: unique by `businessId` (1:1).
- Performance:
  - Good: indexed FK.
- Flexibility:
  - Good: JSONB allows extensibility.
  - Risk: unversioned JSON shape drift.
- Possible decisions:
  - add `settings_version` and validation rules for `preferences/customColors` — **[OPCIONAL]** low priority for current scale.

## `form_messages`

- Integrity:
  - Good: sender/email/message checks + FK.
- Performance:
  - Good: business + unread + createdAt indexes.
- Flexibility:
  - Good for simple contact form.
- Possible decisions:
  - add dedupe/rate-limiting key if spam volume becomes relevant — **[OPCIONAL]**

## `product_categories`

- Integrity:
  - Good: unique `(businessId, slug)`, name length check.
  - Risk: semantic duplicates still possible (`name` case/accent variants).
- Performance:
  - Good: business, slug, display order indexes.
- Flexibility:
  - Good enough; supports image and ordering.
- Possible decisions:
  - optional unique functional index on normalized `name` per business — **[OPCIONAL]**

## `products`

- Integrity:
  - Good: price/stock non-negative checks, currency length, FK relations.
  - Risk: no explicit check for `stars >= 0` and no stronger consistency constraints around status/state transitions.
- Performance:
  - Good: business/category/availability/displayOrder/createdAt indexes.
  - Gap: frequent listing pattern benefits from `(business_id, updated_at desc)`.
- Flexibility:
  - Good: metadata JSONB, tags array, sale status enum.
- Possible decisions:
  - add check `stars >= 0` — **[RESUELTO]** `products_stars_non_negative` (PR #120, migration 0037).
  - add composite index for storage/home sort by updatedAt — **[RESUELTO]** `idx_products_business_updated` (PR #118, migration 0036).
  - define allowed state transitions (`isAvailable`, `stock`, `saleStatus`) — **[DEUDA]**

## `product_media`

- Integrity:
  - Good: FK cascade + display order.
  - Risk: no uniqueness on `(productId, displayOrder)` can create ordering conflicts.
- Performance:
  - Good: product and display order indexes.
- Flexibility:
  - Good for image/video support.
- Possible decisions:
  - add unique `(product_id, display_order)` — **[RESUELTO]** `unique_product_media_display_order` (PR #120, migration 0037).
  - optionally track media checksum/hash for dedupe

## `product_likes`

- Integrity:
  - Good: unique `(productId, ipAddress)`.
  - Risk: IP-only identity is weak and mutable; NAT/shared IP edge cases.
- Performance:
  - Good: index by product.
- Flexibility:
  - Limited anti-abuse model.
- Possible decisions:
  - include device/session fingerprint or rolling window table for abuse controls — **[OPCIONAL]**

## `chat_sessions`

- Integrity:
  - Good: business FK and status enum.
  - Risk: no unique rule to prevent multiple concurrent active sessions per `(business, guest)`.
- Performance:
  - Good: guest and business indexes.
  - Gap: queries filter by business + status and sort by createdAt.
- Flexibility:
  - Good baseline.
- Possible decisions:
  - partial unique index for `status='active'` on `(business_id, guest_id)` — **[RESUELTO]** `uq_chat_sessions_active_per_guest` (PR #122, migration 0039). One EA Tech / SHALOM duplicate guest cleaned first.
  - add `(business_id, status, created_at desc)` index — **[RESUELTO]** `idx_chat_sessions_business_status_created` (PR #118, migration 0036).

## `messages`

- Integrity:
  - Good: session FK cascade.
  - Risk: `createdAt`, `isFromStore`, `isRead` nullable in current model; can create inconsistent records.
- Performance:
  - Good: session and createdAt indexes.
  - Gap: chat read path benefits from `(session_id, created_at)`.
- Flexibility:
  - Good simple chat schema.
- Possible decisions:
  - make booleans and timestamp `NOT NULL` — **[RESUELTO]** `isFromStore`/`isRead` now `.default(false).notNull()` (PR #121, migration 0038).
  - add composite index `(session_id, created_at)` — **[RESUELTO]** `idx_messages_session_created` (PR #118, migration 0036).

## `payments`

- Integrity:
  - Good: FKs to business/product/seller, status and method enums, unique charge id.
  - Risks:
    - no DB check for `amount > 0`
    - no DB-level invariant tying product to business in same row context
- Performance:
  - Good: business/product/seller/status/charge/createdAt indexes.
- Flexibility:
  - Good: metadata JSONB supports gateway payload extensions.
- Possible decisions:
  - add check `amount > 0` — **[RESUELTO]** `payments_amount_positive` (PR #120, migration 0037).
  - enforce stronger application-transaction validations for product-business coherence and stock reservation — **[DEUDA]**
  - define idempotency strategy around `culqiChargeId` — **[DEUDA]**

## `seller_payout_accounts`

- Integrity:
  - Good: 1:1 with seller via unique FK.
  - Risk: no format checks for critical banking fields.
- Performance:
  - Good for current usage.
- Flexibility:
  - Moderate; may need country-specific constraints later.
- Possible decisions:
  - add regex/length checks per country for document/account/CCI — **[DEUDA]** banking data touched by PII hardening item.
  - encrypt sensitive bank fields at application or database layer — **[DEUDA]**

---

## Cross-Cutting Performance Notes

1. Query patterns suggest additional composite indexes are justified:

- `products (business_id, updated_at desc)` — **[RESUELTO]** `idx_products_business_updated` (PR #118, 0036)
- `messages (session_id, created_at)` — **[RESUELTO]** `idx_messages_session_created` (PR #118, 0036)
- `chat_sessions (business_id, status, created_at desc)` — **[RESUELTO]** `idx_chat_sessions_business_status_created` (PR #118, 0036)

2. Overfetch risk in business-level layouts: — **[OPCIONAL]** app-level concern, not DB; low priority.

3. Data-type consistency: — **[OPCIONAL]** ensure currency constrained to ISO values if multi-currency expands.

---

## Cross-Cutting Reliability Notes

1. Introduce transactional boundaries for payment + inventory. — **[DEUDA]**
2. Add explicit status transition contracts for subscriptions and payments. — **[DEUDA]**
3. Ensure generated DB types are part of CI quality checks. — **[RESUELTO]** regeneration documented (PR #119); consider adding as automated CI gate later.

---

## Suggested Senior Decision Order (updated 2026-09-03 — pending items only)

Marked `[RESUELTO]` items above are DONE (chat unique #122, composite indexes #118, types #119, product_media unique + product stars + payment amount #120, messages NOT NULL #121, A1 migration baseline #124, A2 subscription source-of-truth audit, A3 subscription lifecycle CHECK #125, A4a payment/inventory safety CHECKs #126, A5a sanitize payments.status #127). Remaining genuine-debt order:

1. [DEUDA] Payment/inventory code invariants (A4b) — `FOR UPDATE` on stock reads, `culqiChargeId` dedup inside tx, `purchase-plan` idempotency key. Requires CODE + DB migration together.
2. [DEUDA] payments.status enum + pipeline normalization (A5b) — convert text→enum after normalizing charge/route.ts + culqi webhooks to V2 uppercase. Requires CODE + DB migration together.
3. [DEUDA] PII hardening (profiles broad read) + banking-field regex/encryption (seller_payout_accounts). Profiles RLS already fixed (#123).
4. [OPCIONAL] business_legal_details split, settings_version, categories normalized, product_likes anti-abuse, overfetch, currency ISO.

---

## Notes for AI Agents

- Treat each section as a separate implementation stream.
- Prefer small migration PRs with rollback notes.
- Always add forward-compatible migrations; avoid manual hotfix SQL in production.
- Regenerate and commit typed DB artifacts after schema changes.
