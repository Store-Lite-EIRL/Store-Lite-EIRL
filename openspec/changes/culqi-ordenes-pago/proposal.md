# Proposal: culqi-ordenes-pago

## Intent

Enable asynchronous payment methods in Culqi Checkout v4 — PagoEfectivo (cash deposit), Billeteras Móviles (QR), and Cuotéalo (installments without card). These require Culqi Órdenes de Pago (`POST /v2/orders`) to generate payment codes and QR codes, and an `order` parameter in `Culqi.settings()`.

## Scope

### In Scope

- New `payment_orders` DB table (status tracking, payment codes, QR URLs)
- `POST /api/payment/create-order` — creates Culqi order, persists record
- `Culqi.settings({ order })` integration in storefront Checkout.tsx
- `Culqi.order` callback handling in Checkout.tsx
- Webhook case for `order.status.changed` (paid / expired / cancelled)
- `payment_method` enum expansion: add `pago_efectivo`, `billetera_movil`, `cuotealo`
- Payment instructions UI: show CIP code / QR / expiration date after order creation

### Out of Scope

- Culqi Checkout Custom v5 migration (future concern)
- Refund flows for orders (charges only, for now)
- Order cancellation/resend UI in the dashboard
- Plin integration (already works via charges)

## Capabilities

### New Capabilities

- `payment-orders`: Asynchronous Culqi Órdenes de Pago — create, display payment codes/QR, handle webhook status transitions

### Modified Capabilities

None — no existing spec changes at the capability level.

## Approach

1. **Schema**: Add `payment_orders` table with fields: culqiOrderId, amount, status (pending/paid/expired/cancelled), paymentMethod, paymentCode (CIP), qrUrl, buyerEmail, buyerPhone, expirationDate, metadata
2. **Backend API**: `POST /api/payment/create-order` validates with Zod, calls `POST https://api.culqi.com/v2/orders` with `confirm: false`, saves response, returns payment instructions
3. **Checkout integration**: Before `Culqi.open()`, call `create-order` API, pass `order: culqiOrderId` to `Culqi.settings()`. Handle `Culqi.order` in the global callback for sync flow (charge) or async flow (CIP/QR display)
4. **Webhook**: Add `order.status.changed` handler → update `payment_orders` status. On `paid`, create a charge record or link to an existing payment
5. **UI**: After order creation, show payment instructions modal with CIP code, QR image, and expiration countdown. Poll or webhook to detect paid status
6. **Enum**: Expand `paymentMethodEnum` pgEnum and the inline `text('payment_method', { enum: [...] })` in the payments table

## Affected Areas

| Area                                    | Impact   | Description                                                                 |
| --------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `src/core/database/schema.ts`           | Modified | New `payment_orders` table; expand `payment_method` enums                   |
| `drizzle/*` (migrations)                | New      | Migration for new table and enum changes                                    |
| `app/api/payment/create-order/route.ts` | New      | POST endpoint for Culqi order creation                                      |
| `app/[slug]/components/Checkout.tsx`    | Modified | `Culqi.settings({ order })`, `Culqi.order` handler, payment instructions UI |
| `app/api/webhooks/culqi/route.ts`       | Modified | Add `order.status.changed` case                                             |
| `src/features/billing/schemas.ts`       | Modified | Add Zod schema for create-order request                                     |

## Risks

| Risk                                                                | Likelihood | Mitigation                                                                         |
| ------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `CULQI_WEBHOOK_SECRET` not set in production                        | Medium     | Log warning; signature verification already skips in dev                           |
| Orders are async — user may not return to site after CIP/QR display | Medium     | Show clear instructions + expiration countdown; webhook updates payment regardless |
| Checkout v4 deprecation by Culqi                                    | Low        | Abstract Culqi calls behind a service layer; migration is out of scope             |
| CIP codes expire (typically 1–3 days)                               | Low        | Show expiration date prominently; webhook marks expired orders                     |

## Rollback Plan

Revert the `order` parameter from `Culqi.settings()` and the `create-order` API call in Checkout.tsx. Remove `payment_orders` table and enum additions via a down migration. Webhook will ignore unknown event types (already handled).

## Dependencies

- Drizzle Kit migration (`pnpm db:migrate` or `pnpm db:push`) for schema changes
- `CULQI_WEBHOOK_SECRET` should be set in production for signature verification

## Success Criteria

- [ ] `POST /api/payment/create-order` returns valid Culqi order with `paymentCode` and/or `qrUrl`
- [ ] PagoEfectivo shows CIP code in the checkout UI; Billetera Móvil shows QR
- [ ] Webhook receives `order.status.changed` and updates `payment_orders` table
- [ ] `payment_method` enum includes `pago_efectivo`, `billetera_movil`, `cuotealo` in both the pgEnum and the payments table inline enum
- [ ] All existing tests pass (`pnpm test:unit`) and new tests cover the order flow
