# Taskt Business Logic Review (Pre-Implementation)

## Purpose
This document captures **business-logic risks** found during static analysis.
All remediations are intentionally framed as **possible solutions** pending senior approval.

## Audience
- Senior engineering reviewers
- AI agents preparing safe implementation plans

## Scope
- Tenant ownership logic (public vs private behaviors)
- Plan/subscription upgrade flow
- Storefront vs admin route expectations
- Product/storage/chat business rules
- Payment integrity consistency

## Review Context
- Date: 2026-03-19
- Type: Static review (no runtime exploit simulation)
- Status: Pending senior validation

---

## Priority Findings

### 1) Critical - Ownership is partially derived from user-controlled cookie
- Risk:
  - A manipulated `selected_business_slug` can make UI/server rendering paths treat a user as owner.
- Evidence:
  - `app/[slug]/(home)/page.tsx:49`
  - `app/[slug]/(home)/page.tsx:65`
  - `app/[slug]/product/[productId]/components/ProductDetailContent.tsx:35`
  - `app/[slug]/product/[productId]/components/ProductDetailContent.tsx:36`
- Possible solutions:
  - Compute owner state only from authenticated user + DB ownership (`business.ownerId`).
  - Keep cookie purely for UX/session routing hints, never authorization.

### 2) Critical - Cross-tenant data preload in shared business layout
- Risk:
  - Full product/category data is preloaded in `/{slug}` layout before owner/public context is resolved.
- Evidence:
  - `app/[slug]/layout.tsx:27`
  - `app/[slug]/layout.tsx:33`
  - `app/[slug]/layout.tsx:68`
  - `app/[slug]/components/BusinessProviders.tsx:31`
- Possible solutions:
  - Split owner vs storefront layouts or providers.
  - Avoid hydrating storage provider with private data for public contexts.

### 3) Critical - Admin-like tenant routes are auth-only, not owner-validated
- Risk:
  - Authenticated users may access another business’s `/storage`, `/chat`, `/settings`, `/dashboard` paths.
- Evidence:
  - `src/lib/supabase/middleware.ts:63`
  - `src/lib/supabase/middleware.ts:58`
  - `app/[slug]/chat/page.tsx:30`
- Possible solutions:
  - Enforce owner checks in route-level server components/actions.
  - Treat client redirects as UX only, not security boundaries.

### 4) Critical - Subscription upgrade flow can activate plans without verified payment
- Risk:
  - `upgradeBusinessPlan` inserts active plans with mock gateway IDs and no ownership verification.
- Evidence:
  - `app/pricing/actions.ts:8`
  - `app/pricing/actions.ts:16`
  - `app/pricing/actions.ts:32`
- Possible solutions:
  - Require authenticated owner check on `businessId`.
  - Move plan activation to verified gateway webhook flow.
  - Add idempotency key / duplicate-upgrade guard.

### 5) High - Chat business logic lacks actor boundaries
- Risk:
  - Message/session operations do not consistently enforce who is guest vs store owner.
  - `isFromStore` can be client-influenced in owner UI flows.
- Evidence:
  - `app/[slug]/chat/actions/chatActions.ts:44`
  - `app/[slug]/chat/actions/chatActions.ts:99`
  - `app/[slug]/chat/actions/chatActions.ts:113`
  - `app/[slug]/chat/components/ChatClient.tsx:267`
- Possible solutions:
  - Separate owner/guest actions and permission checks.
  - Derive sender role server-side from authenticated identity.

### 6) High - Payment consistency gaps
- Risk:
  - Product lookup is not tied to the business record in one atomic validation path.
  - No explicit stock decrement transaction in charge flow (oversell risk).
- Evidence:
  - `app/[slug]/payment/actions/paymentActions.ts:105`
  - `app/[slug]/payment/actions/paymentActions.ts:114`
  - `app/[slug]/payment/actions/paymentActions.ts:180`
- Possible solutions:
  - Validate `product.businessId === business.id`.
  - Reserve/decrement stock with transactional concurrency control.
  - Persist canonical payment intent snapshot before charging.

### 7) High - Plan promises vs backend enforcement mismatch
- Risk:
  - UI/marketing states advanced plan benefits, but backend limits/entitlements are mostly static or absent.
- Evidence:
  - `app/actions/CreateBusiness.ts:67`
  - `app/created/actions.ts:55`
  - `app/[slug]/storage/actions/products.ts:175`
  - `app/[slug]/storage/actions/imports.ts:19`
- Possible solutions:
  - Centralize entitlement policy by plan.
  - Enforce in all write paths (create business/product/import/users/features).

### 8) Medium - Business active/inactive state is weakly enforced
- Risk:
  - `isActive` exists but storefront/payment access does not consistently gate on it.
- Evidence:
  - `app/[slug]/(home)/page.tsx:35`
  - `app/[slug]/product/[productId]/components/ProductDetailContent.tsx:32`
  - `app/[slug]/payment/actions/paymentActions.ts:105`
- Possible solutions:
  - Define explicit behavior for inactive business:
    - public browsing allowed/blocked
    - checkout blocked
    - owner-only visibility mode

### 9) Medium - `selected_business_slug` redirect can cause stale-routing behavior
- Risk:
  - If cookie is stale/non-owned, user flow can bounce to wrong business URL.
- Evidence:
  - `app/list-business/page.tsx:20`
  - `app/list-business/page.tsx:23`
  - `app/list-business/components/BusinessCard.tsx:33`
- Possible solutions:
  - Validate cookie slug against current user businesses before redirect.
  - Clear invalid cookie and stay in selector page.

### 10) Medium - Subscription source-of-truth inconsistency
- Risk:
  - Legacy migration references plan columns on `businesses`, while app mainly consumes `business_subscriptions`.
- Evidence:
  - `migrations/0009_add_subscription_plans.sql:1`
  - `src/core/database/schema.ts:200`
  - `docs/SUBSCRIPTIONS.md`
- Possible solutions:
  - Pick one canonical subscription model.
  - Deprecate or migrate legacy columns and docs to remove ambiguity.

---

## Decision Checklist (Senior)

1. Should cookie-selected business ever imply ownership semantics? (`yes/no`)
2. Are chat routes owner-only, guest-only, or dual with strict actor separation?
3. What exact plan entitlements must be enforced server-side?
4. Should inactive businesses remain publicly browsable?
5. What is the canonical subscription source of truth?

---

## Notes for AI Agents
- Treat this review as advisory context only.
- Do not auto-implement all fixes at once.
- Prefer phased PRs:
  - Ownership model hardening
  - Subscription/payment flow integrity
  - Route/provider context split
  - Entitlement engine + tests

