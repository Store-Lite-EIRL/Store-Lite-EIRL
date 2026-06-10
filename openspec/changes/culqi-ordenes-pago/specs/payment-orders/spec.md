# Delta for Payment Orders

New capability — no existing spec. Full spec created at `openspec/specs/payment-orders/spec.md`.

## ADDED Requirements

See `openspec/specs/payment-orders/spec.md` for the complete specification.

### R1: Payment Orders Database Table

The system MUST store a `payment_orders` table with: `id` (UUID PK), `businessId` (FK → businesses), `culqiOrderId` (text, unique), `amount` (decimal), `currency` (text, default `PEN`), `status` (enum: `pending`, `paid`, `expired`, `cancelled`), `paymentMethod` (text enum: `pago_efectivo`, `billetera_movil`, `cuotealo`), `paymentCode` (text, nullable — CIP), `qrUrl` (text, nullable), `buyerEmail` (text), `buyerPhone` (text, nullable), `expirationDate` (timestamp), `metadata` (jsonb, default `{}`), `createdAt`, `updatedAt`.

#### Scenario: Create order record

- GIVEN a valid Culqi order API response has been received
- WHEN the system persists it
- THEN a row MUST exist in `payment_orders` with status `pending`

#### Scenario: Duplicate culqiOrderId rejected

- GIVEN a `payment_orders` row with a given `culqiOrderId`
- WHEN another insert uses the same value
- THEN the database MUST reject with a unique constraint violation

### R2: POST /api/payment/create-order

The endpoint MUST accept a Zod-validated body, call `POST https://api.culqi.com/v2/orders`, persist the response, and return payment instructions.

Input: `{ amount (number, céntimos), currency (default PEN), email (email), phone (optional), businessId (UUID), productId (optional UUID), description (optional) }`.

#### Scenario: Successful order — PagoEfectivo returns CIP

- GIVEN valid input including `amount: 5000`, `email: buyer@test.com`
- WHEN `POST /api/payment/create-order` is called
- THEN it MUST return `{ success: true, culqiOrderId, paymentCode, qrUrl, expirationDate }`
- AND `payment_orders` MUST have a row with `status: pending`, `paymentMethod` matching the Culqi response

#### Scenario: Invalid input rejected

- GIVEN a request with missing `businessId` or invalid `email`
- WHEN `POST /api/payment/create-order` is called
- THEN it MUST return HTTP 400 with a Zod validation error

#### Scenario: Culqi API failure

- GIVEN a valid request but Culqi returns a non-2xx response
- WHEN `POST /api/payment/create-order` is called
- THEN it MUST return the Culqi error details
- AND MUST NOT persist any `payment_orders` row

### R3: Checkout Order Integration

Before `Culqi.open()`, the Checkout MUST call `POST /api/payment/create-order` for async payment flows, and pass the resulting `culqiOrderId` to `Culqi.settings({ order })`.

#### Scenario: Sync methods skip order creation

- GIVEN the buyer pays with card, yape, or plin
- WHEN `handlePayment` executes
- THEN it MUST NOT call `create-order`
- AND the existing charge flow MUST proceed unchanged

#### Scenario: Async methods trigger order creation

- GIVEN the checkout is ready to open Culqi
- WHEN the selected payment flow requires async methods
- THEN `POST /api/payment/create-order` MUST be called before `Culqi.open()`
- AND `Culqi.settings({ order: culqiOrderId })` MUST be set

### R4: Culqi.order Callback Handling

The `window.culqi` callback MUST distinguish `Culqi.order` (async result) from `Culqi.token` (sync charge).

#### Scenario: Show payment instructions after async order

- GIVEN the buyer completed an async payment in the Culqi modal
- WHEN `window.culqi` fires with `Culqi.order` present and no `Culqi.token`
- THEN the system MUST display payment instructions (CIP code / QR / expiration) instead of the charge receipt

#### Scenario: Error from Culqi order

- GIVEN the Culqi modal returns an error for an async method
- WHEN `window.culqi` fires with `Culqi.error`
- THEN the system MUST display the error message to the buyer

### R5: Webhook — order.status.changed

The Culqi webhook MUST handle `order.status.changed` events and update `payment_orders.status`.

#### Scenario: Order paid via webhook

- GIVEN a `payment_orders` row with status `pending`
- WHEN a webhook event `order.status.changed` arrives with status `paid`
- THEN the row MUST update to status `paid` and `updatedAt` refreshed

#### Scenario: Order expired via webhook

- GIVEN a `payment_orders` row with status `pending`
- WHEN a webhook event `order.status.changed` arrives with status `expired`
- THEN the row MUST update to status `expired`

#### Scenario: Unknown Culqi order ID in webhook

- GIVEN a webhook event references a `culqiOrderId` not in `payment_orders`
- WHEN the webhook processes it
- THEN it MUST log a warning and return `{ received: true }` without error

### R6: Payment Method Enum Expansion

The `payment_method` pgEnum and the inline `text('payment_method', { enum: [...] })` in the `payments` table MUST include `pago_efectivo`, `billetera_movil`, and `cuotealo`.

#### Scenario: Enum values updated

- GIVEN the database schema definition
- WHEN `paymentMethodEnum` is inspected
- THEN it MUST include `card`, `yape`, `plin`, `pago_efectivo`, `billetera_movil`, `cuotealo`

#### Scenario: Payments table column updated

- GIVEN the `payments` table `payment_method` column
- WHEN its enum values are inspected
- THEN they MUST match the expanded enum

### R7: Payment Instructions UI

The checkout MUST display a payment instructions view after order creation for async methods.

#### Scenario: PagoEfectivo shows CIP code

- GIVEN an order was created with `paymentMethod: pago_efectivo`
- WHEN the payment instructions UI renders
- THEN it MUST display the CIP code prominently, bank names, and expiration countdown

#### Scenario: Billetera Móvil shows QR

- GIVEN an order was created with `paymentMethod: billetera_movil`
- WHEN the payment instructions UI renders
- THEN it MUST display the QR code image and expiration date

#### Scenario: Instructions modal is closable

- GIVEN the payment instructions UI is visible
- WHEN the buyer clicks close
- THEN the modal MUST dismiss
- AND the buyer can return to the storefront
