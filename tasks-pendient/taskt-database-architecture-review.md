# Taskt Database Architecture Review (Pre-Implementation)

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

1. Migration lineage appears inconsistent across files and journal state.
- Evidence:
  - `migrations/meta/_journal.json` (shows entries until `0004`)
  - `migrations/0005..0009` exist but are not reflected in journal
- Risk: environments may have different schemas and behavior.
- Possible decision: define a canonical baseline migration set and reconcile all environments.

2. Subscription model has dual sources of truth.
- Evidence:
  - `business_subscriptions` table in schema
  - `migrations/0009_add_subscription_plans.sql` adds `plan_*` columns to `businesses`
- Risk: business logic divergence and ambiguous reads/writes.
- Possible decision: keep only one model (recommended `business_subscriptions`) and deprecate the other.

3. `database.types.ts` appears stale vs current schema.
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
  - split legal/compliance data into `business_legal_details`
  - define strict behavior contract for `isActive` (browse/pay/chat/admin)

## `business_subscriptions`
- Integrity:
  - Good: status/plan enums.
  - Risk: multiple historical rows are possible without a strict “single current subscription” invariant.
- Performance:
  - Good: business, gateway, createdAt indexes.
- Flexibility:
  - Good for billing history, but needs current-row semantics.
- Possible decisions:
  - add partial unique index for current active/trial row per business
  - add lifecycle checks (`plan_end_date >= plan_start_date` when both set)

## `business_settings`
- Integrity:
  - Good: unique by `businessId` (1:1).
- Performance:
  - Good: indexed FK.
- Flexibility:
  - Good: JSONB allows extensibility.
  - Risk: unversioned JSON shape drift.
- Possible decisions:
  - add `settings_version` and validation rules for `preferences/customColors`

## `form_messages`
- Integrity:
  - Good: sender/email/message checks + FK.
- Performance:
  - Good: business + unread + createdAt indexes.
- Flexibility:
  - Good for simple contact form.
- Possible decisions:
  - add dedupe/rate-limiting key if spam volume becomes relevant

## `product_categories`
- Integrity:
  - Good: unique `(businessId, slug)`, name length check.
  - Risk: semantic duplicates still possible (`name` case/accent variants).
- Performance:
  - Good: business, slug, display order indexes.
- Flexibility:
  - Good enough; supports image and ordering.
- Possible decisions:
  - optional unique functional index on normalized `name` per business

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
  - add composite index for storage/home sort by updatedAt
  - define allowed state transitions (`isAvailable`, `stock`, `saleStatus`)

## `product_media`
- Integrity:
  - Good: FK cascade + display order.
  - Risk: no uniqueness on `(productId, displayOrder)` can create ordering conflicts.
- Performance:
  - Good: product and display order indexes.
- Flexibility:
  - Good for image/video support.
- Possible decisions:
  - add unique `(product_id, display_order)`
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
  - include device/session fingerprint or rolling window table for abuse controls

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
  - partial unique index for `status='active'` on `(business_id, guest_id)`
  - add `(business_id, status, created_at desc)` index

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
  - make booleans and timestamp `NOT NULL`
  - add composite index `(session_id, created_at)`

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
  - add check `amount > 0`
  - enforce stronger application-transaction validations for product-business coherence and stock reservation
  - define idempotency strategy around `culqiChargeId`

## `seller_payout_accounts`
- Integrity:
  - Good: 1:1 with seller via unique FK.
  - Risk: no format checks for critical banking fields.
- Performance:
  - Good for current usage.
- Flexibility:
  - Moderate; may need country-specific constraints later.
- Possible decisions:
  - add regex/length checks per country for document/account/CCI
  - encrypt sensitive bank fields at application or database layer

---

## Cross-Cutting Performance Notes

1. Query patterns suggest additional composite indexes are justified:
- `products (business_id, updated_at desc)`
- `messages (session_id, created_at)`
- `chat_sessions (business_id, status, created_at desc)`

2. Overfetch risk in business-level layouts:
- avoid loading full product/media datasets unless route requires it.

3. Data-type consistency:
- ensure currency is constrained to known ISO values if multi-currency expands.

---

## Cross-Cutting Reliability Notes

1. Introduce transactional boundaries for payment + inventory.
2. Add explicit status transition contracts for subscriptions and payments.
3. Ensure generated DB types are part of CI quality checks.

---

## Suggested Senior Decision Order

1. Migration reconciliation and canonical schema baseline
2. Subscription source-of-truth decision
3. Payment/inventory transactional invariants
4. Chat/session integrity constraints
5. Performance index pack
6. PII and banking-field hardening

---

## Notes for AI Agents
- Treat each section as a separate implementation stream.
- Prefer small migration PRs with rollback notes.
- Always add forward-compatible migrations; avoid manual hotfix SQL in production.
- Regenerate and commit typed DB artifacts after schema changes.

