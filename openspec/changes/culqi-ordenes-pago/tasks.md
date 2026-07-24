# Tasks: Culqi Órdenes de Pago

## Review Workload Forecast

| Field                   | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| Estimated changed lines | ~750–900 (code + tests)                                               |
| 400-line budget risk    | High                                                                  |
| Chained PRs recommended | Yes                                                                   |
| Suggested split         | PR 1: Schema+Migration → PR 2: Zod+API Route → PR 3: Webhook+Checkout |
| Delivery strategy       | ask-on-risk                                                           |
| Chain strategy          | pending                                                               |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                             | Likely PR | Notes                                                                        |
| ---- | ------------------------------------------------ | --------- | ---------------------------------------------------------------------------- |
| 1    | Schema + Migration + Type Exports + Schema tests | PR 1      | Base: `main`. Tests before impl (TDD).                                       |
| 2    | Zod schema + API Route + Route tests             | PR 2      | Base: `main`. Needs new table from PR 1 to function.                         |
| 3    | Webhook handler + Checkout integration + Tests   | PR 3      | Base: `main`. Needs API route from PR 2. Checkout tests are component-level. |

## Phase 1: Schema & Migration (Foundation)

- [x] 1.1 Expand `paymentMethodEnum` — add `pago_efectivo`, `billetera_movil`, `cuotealo` to pgEnum and inline `text('payment_method', { enum: [...] })` in `payments` table
- [x] 1.2 Add `payment_orders` table in `src/core/database/schema.ts` with all fields (id, businessId, culqiOrderId, amount, currency, status, paymentMethod, paymentCode, qrUrl, buyerEmail, buyerPhone, expirationDate, metadata, createdAt, updatedAt) + indexes
- [x] 1.3 Add `paymentOrdersRelations` in schema relations — belongs to business
- [x] 1.4 Export `PaymentOrder` and `NewPaymentOrder` types
- [x] 1.5 Generate migration via `pnpm db:generate` + verify SQL is safe
- [x] 1.6 Write tests: enum includes all 6 values, table columns match schema, unique constraint on culqiOrderId, FK to businesses

## Phase 2: Zod Schema & API Route (Backend)

- [x] 2.1 Add `createOrderRequestSchema` + `CreateOrderRequestInput` type export to `src/features/billing/schemas.ts`
- [x] 2.2 Write RED test: `POST /api/payment/create-order` with invalid input (missing businessId, bad email, amount < 100) returns 400
- [x] 2.3 Write RED test: successful order (Culqi mocked) returns `{ success, culqiOrderId, paymentCode, qrUrl, expirationDate }` and inserts `payment_orders` row with status `pending`
- [x] 2.4 Write RED test: Culqi API failure does NOT persist any row
- [x] 2.5 Implement `POST /api/payment/create-order` route following charge route pattern: Zod validation, fetch+decrypt culqiSecretKey, POST Culqi /v2/orders with 15s timeout, parse payment method, map response (cip_code → paymentCode, action.qr.image_url → qrUrl), INSERT payment_orders, return instructions
- [x] 2.6 GREEN: make tests pass
- [x] 2.7 REFACTOR: verify route matches existing error-handling patterns (same response shapes as charge route)

## Phase 3: Webhook Integration

- [x] 3.1 Write RED test: webhook `order.status.changed` with `paid` updates `payment_orders.status` to `paid`
- [x] 3.2 Write RED test: webhook with `expired` updates `payment_orders.status` to `expired`
- [x] 3.3 Write RED test: unknown culqiOrderId logs warning and returns `{ received: true }`
- [x] 3.4 Implement `order.status.changed` case in `app/api/webhooks/culqi/route.ts`: import `paymentOrders`, map status (paid→paid, expired→expired, cancelled→cancelled), UPDATE SET status + updatedAt, log warning for unknown IDs
- [x] 3.5 GREEN: make tests pass

## Phase 4: Checkout Integration

- [x] 4.1 In `app/[slug]/components/Checkout.tsx`: before `Culqi.open()`, if `finalTotal > YAPE_LIMITS.max` (S/1,000 — límite Yape), call `POST /api/payment/create-order` and set `Culqi.settings({ order: culqiOrderId })`. Fallback silencioso a charge-only si falla.
- [x] 4.2 In `window.culqi` callback: add `Culqi.order` branch before `Culqi.token` — show payment instructions overlay (CIP code / QR / expiration countdown) instead of charge receipt; keep existing `Culqi.token` and `Culqi.error` paths unchanged
- [x] 4.3 Implement payment instructions overlay component: shows CIP code + copiar para PagoEfectivo, QR image para Billetera Móvil, redirect link para Cuotéalo, expiration countdown timer, closeable
- [x] 4.4 Write component-level tests: overlay renders correct content per payment method, order creation triggers correctly per amount threshold, fallback on API failure
- [x] 4.5 Verify all existing charge tests still pass (`pnpm test:unit`) — 140 tests pass
