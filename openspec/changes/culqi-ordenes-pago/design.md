# Design: Payment Orders (culqi-ordenes-pago)

## Technical Approach

Extend the existing payments architecture with a **parallel async order table** (`payment_orders`) and a new API route (`POST /api/payment/create-order`) following the exact pattern of `/api/payment/charge`. The Checkout integrates a pre-`Culqi.open()` order-creation step for amounts over S/ 2000, then uses `Culqi.settings({ order })` to bind the order to the checkout modal. The existing webhook gains an `order.status.changed` handler. Payment instructions UI renders as an inline overlay within Checkout.tsx rather than a separate routed view.

## Architecture Decisions

| Decision                           | Option A                                           | Option B                                                         | Decision                                                                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **New table vs extend `payments`** | New `payment_orders` table with its own lifecycle  | Add order columns to `payments` with nullable fields             | **A** — orders are fundamentally async (pending→paid/expired/cancelled via webhook), while charges are synchronous. Mixing them would add nullable variants and complex status logic to a table that already has 30+ columns.                                  |
| **Order generation**               | `POST /api/payment/create-order` (dedicated route) | Inline in Checkout via client-side Culqi API call                | **A** — server-side order creation keeps the Culqi secret key on the server, validates with Zod, and persists the record atomically. Same pattern as `/api/payment/charge`.                                                                                    |
| **Payment instructions UI**        | New component file in `features/payment-orders/`   | Inline section in Checkout.tsx                                   | **A** — the instructions overlay is a narrow UI concern (CIP code / QR / countdown). Extracting to a component keeps Checkout.tsx manageable while avoiding premature abstraction.                                                                             |
| **Payment method detection**       | Parse `Culqi.order.payment_method` from response   | Map from Culqi order body fields (presence of `qr_url` vs `cip`) | **A** — Culqi v4 returns `payment_method` in the order object. Using it directly is more reliable than guessing from field presence.                                                                                                                           |
| **Paid order → payment record**    | Create `payments` row when webhook fires `paid`    | Update only `payment_orders` status                              | **A** — orders represent payment intent, not actual receipt of funds. The webhook marks `payment_orders` as paid. A separate follow-up (future scope) can create a `payments` record on `paid` if needed for order fulfillment. This keeps the change minimal. |

## Data Flow

```
Checkout.tsx
  │
  │  amount > 2000 or explicit async
  │
  ├─ POST /api/payment/create-order ─────────────────┐
  │   │  Zod validation                               │
  │   │  Fetch businessSettings.culqiSecretKey         │
  │   │  Decrypt secret key                            │
  │   │  POST https://api.culqi.com/v2/orders          │
  │   │  ├─ body: { amount, currency_code,             │
  │   │  │   order_number, client_details,             │
  │   │  │   expiration_date, confirm: false }         │
  │   │  └─ headers: Authorization: Bearer {key}       │
  │   │                                                │
  │   │  INSERT payment_orders (status: pending)        │
  │   │                                                │
  │   └─ return { success, culqiOrderId,               │
  │                paymentCode, qrUrl, expirationDate }  │
  │                                                      │
  ├─ Culqi.settings({ order: culqiOrderId })
  ├─ Culqi.open()
  │
  └─ window.culqi()
       │
       ├─ Culqi.order.payment_method  →  Show instructions overlay
       │    ├─ pago_efectivo: CIP code + bank logos + countdown
       │    ├─ billetera_movil: QR image + scan instructions + countdown
       │    └─ cuotealo: redirect confirmation
       │
       ├─ Culqi.token  →  Existing charge flow (unchanged)
       │
       └─ Culqi.error  →  Show error alert (unchanged)

Culqi Webhook
  │
  └─ POST /api/webhooks/culqi
       │
       ├─ charge.paid         →  Update payments (existing)
       ├─ charge.failed       →  Update payments (existing)
       ├─ refund.created      →  Update payments (existing)
       └─ order.status.changed
            └─ status: paid | expired | cancelled
                 └─ UPDATE payment_orders SET status, updatedAt
```

## Sequence Diagrams

### Create Order Flow

```
Client                   Server                  Culqi API              DB
  │                        │                       │                     │
  │  POST /create-order    │                       │                     │
  │───────────────────────►│                       │                     │
  │                        │  Zod validation        │                     │
  │                        │  Generate order_number │                     │
  │                        │  Load + decrypt key    │                     │
  │                        │                       │                     │
  │                        │  POST /v2/orders      │                     │
  │                        │──────────────────────►│                     │
  │                        │                       │                     │
  │                        │  { id, payment_method, │                     │
  │                        │    payment_code,       │                     │
  │                        │    qr_url, ... }       │                     │
  │                        │◄──────────────────────│                     │
  │                        │                       │                     │
  │                        │  INSERT payment_orders │                     │
  │                        │──────────────────────────────────────────►│
  │                        │                       │                     │
  │  { culqiOrderId,       │                       │                     │
  │    paymentCode,        │                       │                     │
  │    qrUrl,              │                       │                     │
  │    expirationDate }    │                       │                     │
  │◄───────────────────────│                       │                     │
```

### Webhook Status Transition

```
Culqi                    Server                  DB
  │                        │                     │
  │  POST /webhook         │                     │
  │  { type:               │                     │
  │    "order.status.      │                     │
  │     changed",          │                     │
  │    data: { id,         │                     │
  │      status: "paid" }} │                     │
  │───────────────────────►│                     │
  │                        │  Verify signature    │
  │                        │  Dedup check         │
  │                        │                     │
  │                        │  UPDATE payment_orders│
  │                        │  SET status='paid',  │
  │                        │      updatedAt=now() │
  │                        │  WHERE culqiOrderId= │
  │                        │    event.data.id     │
  │                        │──────────────────────►
  │                        │                     │
  │  { received: true }    │                     │
  │◄───────────────────────│                     │
```

## File Changes

| File                                    | Action | Description                                                                                                                              |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/database/schema.ts`           | Modify | Add `payment_orders` table + type exports; expand `paymentMethodEnum` to include new values; update `payments.paymentMethod` inline enum |
| `drizzle/*` (migration)                 | New    | Migration for `payment_orders` table and enum changes                                                                                    |
| `app/api/payment/create-order/route.ts` | Create | POST handler: Zod validation, Culqi API call, DB insert, response                                                                        |
| `src/features/billing/schemas.ts`       | Modify | Add `createOrderRequestSchema` Zod schema                                                                                                |
| `app/[slug]/components/Checkout.tsx`    | Modify | Add pre-`Culqi.open()` order creation, `Culqi.settings({ order })`, `Culqi.order` callback handling, payment instructions overlay        |
| `app/api/webhooks/culqi/route.ts`       | Modify | Add `order.status.changed` case handler                                                                                                  |

## Interfaces / Contracts

### Zod Schema (in `src/features/billing/schemas.ts`)

```typescript
export const createOrderRequestSchema = z.object({
  amount: z.number().int().min(100, 'Monto mínimo S/ 1.00 (100 céntimos)'),
  currency: z.string().default('PEN'),
  email: z.string().email('Email no válido'),
  phone: z.string().optional().nullable(),
  businessId: z.string().uuid('ID de negocio inválido'),
  productId: z.string().uuid('ID de producto inválido').optional(),
  description: z.string().optional(),
});
export type CreateOrderRequestInput = z.infer<typeof createOrderRequestSchema>;
```

### API Response Shapes

**POST /api/payment/create-order — Success (200)**:

```typescript
{
  success: true,
  culqiOrderId: string,
  paymentCode: string | null,    // CIP for PagoEfectivo
  qrUrl: string | null,          // QR for Billetera Móvil
  expirationDate: string,        // ISO timestamp
}
```

**POST /api/payment/create-order — Error (400/500)**:

```typescript
{ error: string }
// or
{ error: string, details?: string }
```

### Culqi Order Response Interface

```typescript
interface CulqiOrderResponse {
  object: 'order';
  id: string; // culqiOrderId
  amount: number;
  currency_code: string;
  payment_method: string; // 'pago_efectivo' | 'billetera_movil' | 'cuotealo'
  order_number: string;
  client_details: { email: string; phone?: string };
  expiration_date: number; // unix timestamp
  status: string;
  metadata?: Record<string, unknown>;

  // PagoEfectivo fields
  cip_code?: string; // paymentCode
  cip_cc_agent?: string;
  cip_cc_user?: string;

  // Billetera Móvil fields
  action?: { qr?: { image_url?: string } };

  // Cuotéalo fields
  url_redirect?: string;
}
```

### Webhook Event Shape

```typescript
interface CulqiWebhookOrderEvent {
  id?: string;
  type?: 'order.status.changed';
  data?: {
    id?: string; // culqiOrderId
    status?: 'paid' | 'expired' | 'cancelled';
  };
}
```

## Database Schema (Drizzle)

In `src/core/database/schema.ts`:

**Enum expansion**:

```typescript
export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'yape',
  'plin',
  'pago_efectivo',
  'billetera_movil',
  'cuotealo',
]);
```

**Payments table inline enum** — update `line 552`:

```typescript
paymentMethod: text('payment_method', {
  enum: ['card', 'yape', 'plin', 'pago_efectivo', 'billetera_movil', 'cuotealo'],
}).notNull(),
```

**New table**:

```typescript
export const paymentOrders = pgTable(
  'payment_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'restrict' }),
    culqiOrderId: text('culqi_order_id').notNull().unique(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('PEN'),
    status: text('status', {
      enum: ['pending', 'paid', 'expired', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    paymentMethod: text('payment_method', {
      enum: ['pago_efectivo', 'billetera_movil', 'cuotealo'],
    }).notNull(),
    paymentCode: text('payment_code'), // CIP
    qrUrl: text('qr_url'),
    buyerEmail: text('buyer_email').notNull(),
    buyerPhone: text('buyer_phone'),
    expirationDate: timestamp('expiration_date', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    culqiOrderIdIdx: index('idx_payment_orders_culqi_order_id').on(table.culqiOrderId),
    businessIdIdx: index('idx_payment_orders_business_id').on(table.businessId),
    statusIdx: index('idx_payment_orders_status').on(table.status),
  }),
);
```

**Type exports**:

```typescript
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type NewPaymentOrder = typeof paymentOrders.$inferInsert;
```

## Server/Client Component Boundaries

| Layer      | Boundary                                | Component/Role                                                       |
| ---------- | --------------------------------------- | -------------------------------------------------------------------- |
| **Server** | `app/api/payment/create-order/route.ts` | POST handler — Zod validation, Culqi API call, DB insert             |
| **Server** | `app/api/webhooks/culqi/route.ts`       | Webhook handler — signature verification, DB update                  |
| **Client** | `app/[slug]/components/Checkout.tsx`    | `'use client'` — handles payment flow, shows instructions overlay    |
| **Shared** | `src/core/database/schema.ts`           | Schema definitions — imported by both server and client (type only)  |
| **Shared** | `src/features/billing/schemas.ts`       | Zod schemas — used server-side for validation, client-side for types |

The new `POST /api/payment/create-order` route runs entirely on the server. The Checkout calls it via `fetch()` before `Culqi.open()`. The payment instructions UI runs client-side in React state.

## Error Handling

| Scenario                         | Where                 | Response                                                                           |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| Invalid input                    | `create-order` route  | 400 `{ error: Zod message }`                                                       |
| Missing/invalid Culqi secret key | `create-order` route  | 400 `{ error: 'Configuración inválida...' }` (same pattern as charge route)        |
| Culqi API returns error          | `create-order` route  | Return Culqi error details, NOT persist any row (404/500 depending on Culqi error) |
| Culqi API network failure        | `create-order` route  | 500 `{ error: 'Error interno...' }` (caught by try/catch)                          |
| Webhook unknown order ID         | Webhook route         | Log warning, return `{ received: true }` (no error)                                |
| Webhook signature invalid        | Webhook route         | 401 (existing handler covers this)                                                 |
| Checkout fetch fails             | Checkout.tsx          | Show alert error, don't open Culqi                                                 |
| Culqi.order returns error        | Checkout.tsx callback | Show error alert (same as existing `Culqi.error` handling)                         |

## Testing Strategy

| Layer           | What to Test                          | Approach                                                                                    |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Unit**        | `createOrderRequestSchema` Zod schema | Valid/invalid inputs, email format, amount bounds                                           |
| **Unit**        | `payment_orders` table definition     | Column types match schema, unique constraint on `culqiOrderId`, FK to businesses            |
| **Unit**        | `paymentMethodEnum` expansion         | Enum includes all 6 values                                                                  |
| **Unit**        | Culqi order response parser           | Extract payment method, CIP/QR from different response shapes                               |
| **Unit**        | Webhook `order.status.changed` logic  | Status mapping (paid→paid, expired→expired, cancelled→cancelled), unknown order ID handling |
| **Integration** | `POST /api/payment/create-order`      | Mock Culqi API + DB, verify row inserted only on success                                    |
| **Integration** | Webhook handler                       | POST valid/invalid events, verify DB updates                                                |
| **E2E**         | Checkout flow                         | (Future — manual QA for now, Culqi modal cannot be automated easily)                        |
| **Mutation**    | Webhook dedup                         | Same event delivered twice → second is skipped                                              |

## Migration / Rollout

1. **Schema migration**: Run `pnpm db:migrate` after the schema changes. The pgEnum expansion via Drizzle generates `ALTER TYPE ... ADD VALUE` which is safe (no table rewrite).
2. **No data migration**: New table starts empty. Existing payments are unaffected.
3. **Rollback**: Remove the `order` parameter from `Culqi.settings()`, delete `/api/payment/create-order`, revert schema changes via down migration. The webhook ignores unknown event types already.

## Open Questions

- [ ] Culqi v4 `payment_method` in the order response: confirm the exact field name (docs show `payment_method` but we need to verify with real API)
- [ ] Checkout integration timing: should we always create an order when `open()` is called (simpler) or only when the customer picks an async method inside the Culqi modal? Current design: pre-create for amounts > 2000 (likelihood of async) and pass order to settings. The modal auto-selects.

## OpenSpec Rules Compliance

- ✅ Sequence diagrams included for create-order and webhook flows
- ✅ Architecture decisions documented with rationale (ADR table)
- ✅ Server/client component boundaries explicitly mapped
