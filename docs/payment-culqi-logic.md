# store.lite – Payment System Architecture

## Overview

This document defines the **payment architecture, security rules, and business logic** for the **store.lite** platform.

The platform allows **public users (non-registered)** to purchase products from **private users (store owners)** using digital payment methods such as:

- Yape
- Plin
- Debit/Credit Cards

Payments are processed through **Culqi**, which acts as the payment processor and security layer between the platform and financial networks.

The platform itself manages:

- Orders
- Payment records
- Delivery verification
- Seller payouts
- Disputes and refunds

Payments are **immutable records** and **must never be deleted**.

---

# Important Architecture Constraint

## Why payments cannot go directly from buyer to seller

The payment flow **cannot send funds directly from buyer to seller** using Culqi.

Actual payment flow:

```id="arch1"
buyer
   ↓
Culqi payment gateway
   ↓
store.lite merchant account
   ↓
store.lite bank account
   ↓
payout to seller
```

Reason:

Payment gateways operate under **merchant-of-record models**.
The platform receiving the payment is legally responsible for:

- chargebacks
- fraud
- refunds
- financial reporting

Therefore the payment must first land in the **platform merchant account**.

This model is called an **Aggregator Model** and is used by platforms such as:

- marketplaces
- delivery platforms
- SaaS platforms
- gig economy platforms

Because of this, store.lite **must maintain a business bank account dedicated to platform operations**. Personal bank accounts must not be used.

---

# Payment Flow

## Public Purchase

Public users can purchase products **without registering an account**.

Flow:

1. User visits a product page.
2. Clicks **Pay**.
3. Chooses payment method (Yape, Plin, card).
4. Payment processed through Culqi.
5. Platform receives payment confirmation via webhook.
6. Payment record created.
7. Voucher generated.
8. Delivery confirmation system activated.

---

# Payment Status Lifecycle

Each payment has a lifecycle status.

```id="arch2"
pending
paid
not_delivered
delivered
completed
failed
disputed
refund_requested
refunded
```

Status meaning:

| Status           | Meaning                                 |
| ---------------- | --------------------------------------- |
| pending          | Order created but payment not completed |
| paid             | Payment confirmed                       |
| not_delivered    | Seller has not confirmed delivery       |
| delivered        | Seller marked as delivered              |
| completed        | Buyer confirmed with delivery code      |
| failed           | Payment rejected                        |
| disputed         | Buyer opened dispute                    |
| refund_requested | Refund process started                  |
| refunded         | Refund executed                         |

---

# Payment Database Table

Table: `payments`

Payments are **permanent records** and must never be deleted.

```id="arch3"
payments
-------
id (uuid)
order_id
store_id
seller_user_id
amount
currency
payment_method
culqi_charge_id
culqi_reference_code
buyer_email
buyer_phone
status
delivery_code_hash
delivery_code_expires_at
created_at
updated_at
metadata
```

Important fields:

**culqi_charge_id**

Unique transaction identifier returned by Culqi.

**culqi_reference_code**

Reference number shown in payment voucher.

**delivery_code_hash**

Hashed version of the buyer delivery confirmation code.

---

# Delivery Confirmation System

After payment is successful the platform generates a **10-digit delivery confirmation code**.

Example:

```id="arch4"
4938201745
```

Rules:

- Visible **only to buyer**
- Stored **hashed in database**
- Seller cannot view the code
- Used to confirm successful delivery

---

# Delivery Code Expiration

Delivery codes expire **after 30 days**.

```id="arch5"
delivery_code_expires_at = created_at + 30 days
```

Reason:

Products may take time to ship across:

- provinces
- international locations

---

# Expiration Warnings

Both users receive warnings.

## Buyer warning

If code expires:

- delivery cannot be confirmed
- dispute process may be required
- credibility score may decrease

## Seller warning

If code expires:

- order will be marked unresolved
- seller may accumulate unresolved deliveries
- possible credibility impact

---

# Voucher Generation

After payment confirmation a **digital voucher** is generated.

Voucher includes:

- store name
- order id
- product name
- payment amount
- payment method
- Culqi reference code
- purchase date
- delivery confirmation code

Voucher formats:

- HTML receipt
- downloadable PDF
- optional QR verification

---

# Seller Payment Requirements

Only **Premium sellers** can receive payouts.

Seller financial data must be stored in a separate table.

Table: `seller_payout_accounts`

```id="arch6"
seller_payout_accounts
----------------------
id
seller_user_id
full_name
document_type
document_number
bank_name
bank_account_number
bank_cci
country
created_at
updated_at
verified
```

Important rule:

**Card data must never be stored.**

Only bank payout data should be stored.

---

# Webhook Handling

Culqi sends events to the platform when payment status changes.

Example endpoint:

```id="arch7"
POST /api/payments/webhook
```

Handled events:

```id="arch8"
charge.created
charge.paid
charge.failed
refund.created
```

Webhook handler must:

1. Verify Culqi signature
2. Find payment using `culqi_charge_id`
3. Update payment status
4. Generate voucher
5. Notify seller

---

# Payment Security Rules

The payment system must enforce:

1. Payment records are immutable.
2. Delivery codes stored **hashed**.
3. Webhooks must verify authenticity.
4. Duplicate webhook events must be ignored.
5. Payment logs must be stored for audit.

---

# Platform Wallet & Security (Escrow Model)

store.lite acts as a **financial intermediary and Escrow provider**.

### Security of the "Double Deposit":

1. **Confianza del Comprador:** El dinero no se va al vendedor de inmediato. Queda "atrapado" en la cuenta de la plataforma.
2. **Garantía del Vendedor:** El vendedor ve que el estado es `paid` (pagado) y sabe que la plataforma ya tiene el dinero, por lo que puede despachar con seguridad.
3. **Liberación de Fondos:** Solo cuando el comprador entrega el **Código de Confirmación de 10 dígitos** al vendedor, y este lo ingresa en la plataforma, el sistema marca el pago como `completed` y programa el **Payout** al vendedor.

Payment flow:

```id="arch9"
buyer (Yape/Card)
   ↓
Culqi (Token + Charge)
   ↓
store.lite Platform Account (Estado: paid/not_delivered)
   ↓
[Validación de Código de Entrega]
   ↓
platform wallet ledger (Estado: completed)
   ↓
seller payout (Transferencia Bancaria)
```

---

# Future Improvements

Potential extensions:

- automatic seller payouts
- escrow system
- fraud detection scoring
- automatic dispute resolution
- seller credibility scoring

---

# Summary

store.lite delegates payment processing to **Culqi** while managing:

- order lifecycle
- payment records
- delivery confirmation
- seller payouts
- dispute handling

This architecture ensures **secure, scalable, and auditable payments** while minimizing financial risk.
