# Taskt Importants - Security Review (Pre-Implementation)

## Purpose
This document captures **observed security risks** from a static review of the current codebase.
All remediations are intentionally written as **possible solutions** for senior validation before any code changes.

## Audience
- Senior engineers / security reviewers
- AI agents that need structured context before proposing patches

## Scope
- Static code review only (no dynamic pentest, no runtime exploitation proof)
- Focus areas: authz/authn, webhooks, payments, uploads, chat flows, RLS policies, security headers

## Confidence Model
- **High confidence**: issue directly visible in code paths and business logic
- **Medium confidence**: depends on deployment config / policy application state

---

## Findings Summary

### 1) Critical - Culqi webhook signature is not verified
- Severity: `critical`
- Confidence: `high`
- Risk:
  - A forged request could mark payments as `paid` or `failed` without a real provider event.
- Evidence:
  - `app/api/webhooks/culqi/route.ts:13`
  - `app/api/webhooks/culqi/route.ts:25`
  - `app/api/webhooks/culqi/route.ts:50`
- Possible solutions:
  - Verify `Culqi-Signature` using the webhook secret before processing payload.
  - Reject invalid/missing signature with `401/403`.
  - Use raw body for deterministic signature verification.
  - Add anti-replay controls (timestamp tolerance + event id deduplication).

### 2) Critical - Missing ownership checks in storage/product server actions (IDOR risk)
- Severity: `critical`
- Confidence: `high`
- Risk:
  - Authenticated users could modify products/categories of other businesses if they know `slug`/IDs.
- Evidence:
  - `app/[slug]/storage/actions/products.ts:175`
  - `app/[slug]/storage/actions/products.ts:268`
  - `app/[slug]/storage/actions/products.ts:420`
  - `app/[slug]/storage/actions/categories.ts:39`
  - `app/[slug]/storage/actions/imports.ts:19`
  - `app/[slug]/storage/isolatedUpdateAction.ts:40`
- Possible solutions:
  - Require authenticated user at the start of each server action.
  - Resolve business by `slug` and enforce `business.ownerId === user.id`.
  - Reject unauthorized requests consistently (`403`) and log security-relevant context.
  - Add unit/integration tests for cross-tenant access attempts.

### 3) Critical - Chat actions allow unauthorized reads/writes and role spoofing
- Severity: `critical`
- Confidence: `high`
- Risk:
  - Any caller can potentially send messages as store (`isFromStore=true`), list sessions, read messages, or delete sessions.
- Evidence:
  - `app/[slug]/chat/actions/chatActions.ts:44`
  - `app/[slug]/chat/actions/chatActions.ts:54`
  - `app/[slug]/chat/actions/chatActions.ts:99`
  - `app/[slug]/chat/actions/chatActions.ts:113`
- Possible solutions:
  - Split actions by actor (`guest` vs `store-owner`) and enforce permissions server-side.
  - Never trust `isFromStore` from client input; derive sender role from authenticated identity.
  - Validate session ownership before read/write/delete.
  - Add audit trail fields (`createdBy`, actor type, source).

### 4) High - Payment amount is client-influenced (price tampering risk)
- Severity: `high`
- Confidence: `high`
- Risk:
  - User-controlled `amountSoles` could diverge from authoritative product price.
- Evidence:
  - `app/[slug]/payment/actions/paymentActions.ts:40`
  - `app/[slug]/payment/actions/paymentActions.ts:95`
  - `app/[slug]/payment/actions/paymentActions.ts:128`
  - `app/[slug]/payment/actions/paymentActions.ts:183`
- Possible solutions:
  - Ignore amount from client; compute total server-side using DB price and rules (quantity/discount/tax/shipping).
  - Validate currency and minimum/maximum bounds.
  - Persist a server-side payment intent snapshot before charging.

### 5) High - Business media deletion paths miss ownership checks
- Severity: `high`
- Confidence: `high`
- Risk:
  - Authenticated user may delete logo/cover of other businesses by passing `businessId`.
- Evidence:
  - `app/actions/business.ts:181`
  - `app/actions/business.ts:331`
- Possible solutions:
  - Apply same ownership verification already used in update flows.
  - Use one shared authorization guard utility to avoid drift.

### 6) High - Service role upload/delete actions without robust authz + weak file validation
- Severity: `high`
- Confidence: `high`
- Risk:
  - Service role bypasses RLS; without strict checks this becomes a privileged abuse surface.
  - Weak content validation increases malicious file upload risk.
- Evidence:
  - `app/[slug]/storage/actions/uploads.ts:41`
  - `app/[slug]/storage/actions/uploads.ts:85`
  - `app/[slug]/storage/actions/uploads.ts:24`
- Possible solutions:
  - Require authenticated user and ownership check before any service-role operation.
  - Enforce MIME + extension allowlist (`image/jpeg`, `image/png`, `image/webp`).
  - Enforce strict max size and reject SVG/HTML uploads.
  - Consider virus/malware scan for uploaded assets in production workflows.

### 7) High - Public RLS policy on `profiles` may expose PII
- Severity: `high`
- Confidence: `medium` (depends on whether migration is applied exactly as written)
- Risk:
  - Public read on profiles can expose sensitive fields (email/address/phone/age).
- Evidence:
  - `migrations/0007_fix_profiles_rls.sql:25`
  - `src/core/database/schema.ts:79`
  - `src/core/database/schema.ts:83`
  - `src/core/database/schema.ts:84`
  - `src/core/database/schema.ts:85`
- Possible solutions:
  - Remove broad `USING (true)` from profiles table.
  - Expose only a sanitized public view/table for storefront needs.
  - Keep sensitive columns private to owner/admin policies.

### 8) Medium - Missing baseline hardening headers
- Severity: `medium`
- Confidence: `high`
- Risk:
  - Reduced protection against clickjacking, some XSS classes, and data leakage.
- Evidence:
  - `next.config.ts:3`
  - `middleware.ts:25`
- Possible solutions:
  - Define security headers: `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` (or CSP `frame-ancestors`), `Strict-Transport-Security` (prod HTTPS).
  - Start CSP in report-only mode, then enforce after telemetry tuning.

---

## Not Observed in This Review
- No explicit backdoor pattern found (static inspection).
- No direct `dangerouslySetInnerHTML` / `eval` sink identified in the reviewed paths.

## Suggested Review Order (Senior)
1. Webhook authenticity and replay controls
2. Authorization invariants for all server actions (multi-tenant boundaries)
3. Payment integrity (server-authoritative pricing)
4. Chat authorization model and sender identity hardening
5. Storage service-role guardrails
6. RLS policy tightening for profile data
7. Security header baseline

## Suggested Validation Before Coding
- Confirm business-required public data for storefront (minimal field contract).
- Confirm Culqi webhook signing algorithm and operational rotation plan.
- Confirm tenancy model: what actions are owner-only vs public vs guest.
- Confirm logging policy to avoid sensitive payload leakage.

## Notes for AI Agents
- Treat every fix above as a **proposal**, not an approved change.
- Do not refactor unrelated modules while patching security-critical paths.
- Prefer small, auditable PRs by risk domain:
  - PR1: webhook verification
  - PR2: storage/product/category/import authz
  - PR3: chat authz + sender derivation
  - PR4: payment amount authority
  - PR5: RLS + header hardening
- Add tests for abuse cases (cross-tenant IDs, forged webhook, tampered amount).

---

## Review Metadata
- Review type: static analysis
- Date: 2026-03-19
- Environment: Next.js + Supabase + Drizzle
- Status: pending senior validation before implementation
