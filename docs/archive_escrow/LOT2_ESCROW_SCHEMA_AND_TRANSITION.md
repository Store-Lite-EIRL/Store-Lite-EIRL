# LOTE 2 — Diseño Exacto de Tablas y Estrategia de Transición desde `payments`

## Objetivo

Traducir el baseline aprobado del Lote 1 a un diseño de base de datos exacto, implementable y migrable.

Este documento define:

- tablas nuevas
- columnas exactas
- enums
- relaciones
- constraints
- índices
- estrategia de convivencia con `payments`
- orden recomendado de migraciones

> Acá ya no estamos filosofando. Acá estamos diseñando la estructura real que después va a bajar a `schema.ts`, migraciones y tipos.

---

## Veredicto del Lote 2

### Estado

**LISTO PARA IMPLEMENTACIÓN TÉCNICA**

### Qué significa

- sí hay suficiente definición para modelar el nuevo esquema
- sí se puede pasar a Drizzle/migraciones
- no hace falta seguir pateando decisiones base

Todavía pueden aparecer ajustes chicos, obvio. Pero el diseño ya está lo suficientemente cerrado para construir sin humo.

---

# Decisión macro de transición

## Decisión

**No reemplazar `payments` de golpe.**

## Estrategia elegida

Aplicar una transición por convivencia temporal:

1. crear tablas nuevas del modelo escrow
2. mantener `payments` operativa temporalmente
3. empezar a escribir en el modelo nuevo para el flujo nuevo
4. usar `payments` como legacy/compatibilidad y fuente parcial de backfill
5. deprecar `payments` cuando el flujo nuevo esté estable

## Por qué

Porque intentar reemplazar `payments` en una sola migración es exactamente la clase de apuro que rompe datos, soporte y producción.

---

# Modelo exacto propuesto

## 1. Tabla `orders`

## Propósito

Fuente de verdad comercial de una compra.

## Columnas

- `id` uuid pk default random
- `order_number` text not null unique
- `buyer_user_id` uuid null fk -> `profiles.id`
- `buyer_email` text not null
- `buyer_phone` text not null
- `buyer_name` text null
- `buyer_tracking_token` text not null unique
- `business_id` uuid not null fk -> `businesses.id`
- `seller_user_id` uuid not null fk -> `profiles.id`
- `status` order_status_enum not null
- `currency` text not null default `PEN`
- `subtotal_amount` decimal(10,2) not null
- `discount_amount` decimal(10,2) not null default `0`
- `taxable_base_amount` decimal(10,2) not null
- `tax_amount` decimal(10,2) not null default `0`
- `total_amount` decimal(10,2) not null
- `gateway_fee_amount` decimal(10,2) not null default `0`
- `platform_fee_amount` decimal(10,2) not null default `0`
- `adjustment_amount` decimal(10,2) not null default `0`
- `net_seller_amount` decimal(10,2) not null
- `refundable_amount` decimal(10,2) not null
- `payment_expires_at` timestamptz null
- `confirmation_expires_at` timestamptz null
- `paid_at` timestamptz null
- `delivery_confirmed_at` timestamptz null
- `completed_at` timestamptz null
- `cancelled_at` timestamptz null
- `refunded_at` timestamptz null
- `disputed_at` timestamptz null
- `metadata` jsonb not null default '{}'
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `subtotal_amount >= 0`
- `discount_amount >= 0`
- `taxable_base_amount >= 0`
- `tax_amount >= 0`
- `total_amount > 0`
- `gateway_fee_amount >= 0`
- `platform_fee_amount >= 0`
- `net_seller_amount >= 0`
- `refundable_amount >= 0`
- `char_length(currency) = 3`
- `payment_expires_at > created_at` cuando no sea null
- `confirmation_expires_at > created_at` cuando no sea null

## Índices

- unique `order_number`
- unique `buyer_tracking_token`
- `idx_orders_buyer_user_created_at (buyer_user_id, created_at desc)`
- `idx_orders_business_created_at (business_id, created_at desc)`
- `idx_orders_seller_created_at (seller_user_id, created_at desc)`
- `idx_orders_status_created_at (status, created_at desc)`

## Notas

- `buyer_tracking_token` resuelve el checkout invitado controlado
- `orders` reemplaza la idea vieja de usar `payments` como fuente comercial

---

## 2. Tabla `order_items`

## Propósito

Registrar los productos comprados dentro de una orden.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null fk -> `orders.id`
- `product_id` uuid null fk -> `products.id` on delete set null
- `product_title_snapshot` text not null
- `product_brand_snapshot` text null
- `product_metadata_snapshot` jsonb not null default '{}'
- `quantity` integer not null default 1
- `unit_price_amount` decimal(10,2) not null
- `discount_amount` decimal(10,2) not null default `0`
- `tax_amount` decimal(10,2) not null default `0`
- `subtotal_amount` decimal(10,2) not null
- `total_amount` decimal(10,2) not null
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `quantity > 0`
- `unit_price_amount >= 0`
- `subtotal_amount >= 0`
- `total_amount >= 0`

## Índices

- `idx_order_items_order_id`
- `idx_order_items_product_id`

## Notas

- el snapshot evita que cambios futuros del producto rompan historial

---

## 3. Tabla `payment_transactions`

## Propósito

Representar cada intento o transacción contra Culqi.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null fk -> `orders.id`
- `provider` text not null default `culqi`
- `payment_method` payment_method_enum not null
- `source_type` text null
- `provider_charge_id` text null unique
- `provider_order_id` text null
- `provider_reference_code` text null
- `provider_tracking_id` text null
- `idempotency_key` text not null unique
- `status` payment_transaction_status_enum not null
- `currency` text not null default `PEN`
- `requested_amount` decimal(10,2) not null
- `authorized_amount` decimal(10,2) null
- `captured_amount` decimal(10,2) null
- `refunded_amount` decimal(10,2) not null default `0`
- `failure_code` text null
- `failure_message` text null
- `raw_request` jsonb not null default '{}'
- `raw_response` jsonb not null default '{}'
- `processed_at` timestamptz null
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `requested_amount > 0`
- `refunded_amount >= 0`
- `char_length(currency) = 3`

## Índices

- `idx_payment_transactions_order_id`
- `idx_payment_transactions_provider_charge_id`
- `idx_payment_transactions_status_created_at (status, created_at desc)`
- unique `idempotency_key`

## Notas

- una orden puede tener múltiples intentos
- `provider_charge_id` puede ser null antes de la respuesta del gateway

---

## 4. Tabla `payment_events`

## Propósito

Auditoría inmutable de eventos externos e internos.

## Columnas

- `id` uuid pk default random
- `payment_transaction_id` uuid not null fk -> `payment_transactions.id`
- `event_type` text not null
- `event_source` text not null
- `event_status` text null
- `external_event_id` text null
- `payload` jsonb not null default '{}'
- `occurred_at` timestamptz not null
- `created_at` timestamptz not null default now

## Índices

- `idx_payment_events_transaction_occurred_at (payment_transaction_id, occurred_at desc)`
- `idx_payment_events_external_event_id`

## Nota

- idealmente agregar unique parcial para `external_event_id` cuando aplique

---

## 5. Tabla `order_confirmations`

## Propósito

Controlar el código de aceptación.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null unique fk -> `orders.id`
- `code_hash` text not null
- `code_last4` text null
- `status` order_confirmation_status_enum not null
- `attempts_count` integer not null default `0`
- `max_attempts` integer not null default `5`
- `expires_at` timestamptz not null
- `confirmed_by_seller_user_id` uuid null fk -> `profiles.id`
- `confirmed_at` timestamptz null
- `invalidated_at` timestamptz null
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `attempts_count >= 0`
- `max_attempts > 0`
- `expires_at > created_at`

## Índices

- unique `order_id`
- `idx_order_confirmations_status_expires_at (status, expires_at)`

---

## 6. Tabla `order_fulfillments`

## Propósito

Registrar el proceso operativo de entrega/recojo.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null unique fk -> `orders.id`
- `fulfillment_type` fulfillment_type_enum not null
- `status` order_fulfillment_status_enum not null
- `scheduled_at` timestamptz null
- `ready_at` timestamptz null
- `delivered_at` timestamptz null
- `received_at` timestamptz null
- `handled_by_user_id` uuid null fk -> `profiles.id`
- `notes` text null
- `evidence` jsonb not null default '{}'
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Índices

- unique `order_id`
- `idx_order_fulfillments_status_created_at (status, created_at desc)`

---

## 7. Tabla `escrow_ledgers`

## Propósito

Estado financiero interno de custodia para una orden.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null unique fk -> `orders.id`
- `status` escrow_status_enum not null
- `currency` text not null default `PEN`
- `gross_amount` decimal(10,2) not null
- `held_amount` decimal(10,2) not null
- `releasable_amount` decimal(10,2) not null default `0`
- `released_amount` decimal(10,2) not null default `0`
- `refunded_amount` decimal(10,2) not null default `0`
- `hold_started_at` timestamptz not null default now
- `release_scheduled_at` timestamptz null
- `released_at` timestamptz null
- `refund_started_at` timestamptz null
- `refunded_at` timestamptz null
- `metadata` jsonb not null default '{}'
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `gross_amount >= 0`
- `held_amount >= 0`
- `releasable_amount >= 0`
- `released_amount >= 0`
- `refunded_amount >= 0`

## Índices

- unique `order_id`
- `idx_escrow_ledgers_status_created_at (status, created_at desc)`

---

## 8. Tabla `seller_payouts`

## Propósito

Registrar la liquidación al vendedor.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null unique fk -> `orders.id`
- `seller_user_id` uuid not null fk -> `profiles.id`
- `seller_payout_account_id` uuid not null fk -> `seller_payout_accounts.id`
- `status` seller_payout_status_enum not null
- `currency` text not null default `PEN`
- `gross_amount` decimal(10,2) not null
- `gateway_fee_amount` decimal(10,2) not null default `0`
- `platform_fee_amount` decimal(10,2) not null default `0`
- `tax_withholding_amount` decimal(10,2) not null default `0`
- `adjustment_amount` decimal(10,2) not null default `0`
- `net_amount` decimal(10,2) not null
- `scheduled_at` timestamptz null
- `processed_at` timestamptz null
- `paid_at` timestamptz null
- `failed_at` timestamptz null
- `failure_reason` text null
- `provider_reference` text null
- `metadata` jsonb not null default '{}'
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `gross_amount >= 0`
- `net_amount >= 0`
- `char_length(currency) = 3`

## Índices

- unique `order_id`
- `idx_seller_payouts_seller_status_created_at (seller_user_id, status, created_at desc)`
- `idx_seller_payouts_status_created_at (status, created_at desc)`

---

## 9. Tabla `refunds`

## Propósito

Registrar devoluciones como proceso independiente.

## Columnas

- `id` uuid pk default random
- `order_id` uuid not null fk -> `orders.id`
- `payment_transaction_id` uuid not null fk -> `payment_transactions.id`
- `status` refund_status_enum not null
- `reason` text not null
- `requested_by_actor_type` text not null
- `requested_by_actor_id` uuid null
- `requested_amount` decimal(10,2) not null
- `approved_amount` decimal(10,2) null
- `executed_amount` decimal(10,2) null
- `provider_refund_id` text null
- `provider_tracking_id` text null
- `processed_at` timestamptz null
- `metadata` jsonb not null default '{}'
- `created_at` timestamptz not null default now
- `updated_at` timestamptz not null default now

## Constraints

- `requested_amount > 0`
- `approved_amount >= 0` cuando no sea null
- `executed_amount >= 0` cuando no sea null

## Índices

- `idx_refunds_order_id`
- `idx_refunds_transaction_id`
- `idx_refunds_status_created_at (status, created_at desc)`

---

# Enums exactos a crear

## `order_status_enum`

- `draft`
- `awaiting_payment`
- `payment_processing`
- `paid_in_escrow`
- `awaiting_fulfillment`
- `ready_for_pickup`
- `in_delivery`
- `delivery_confirmed`
- `completed`
- `payment_failed`
- `confirmation_expired`
- `expired_pending_refund`
- `refunded_partial`
- `refunded_full`
- `cancelled`
- `disputed`

## `payment_transaction_status_enum`

- `pending`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refunded_partial`
- `refunded_full`

## `order_confirmation_status_enum`

- `code_generated`
- `waiting_confirmation`
- `confirmed`
- `expired`
- `invalid_attempts_exceeded`
- `invalidated`

## `fulfillment_type_enum`

- `pickup`
- `delivery`
- `shipment`

## `order_fulfillment_status_enum`

- `pending`
- `ready_for_pickup`
- `in_delivery`
- `delivered`
- `received`
- `failed`
- `cancelled`

## `escrow_status_enum`

- `holding`
- `release_pending`
- `released`
- `refund_pending`
- `refunded`

## `seller_payout_status_enum`

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

## `refund_status_enum`

- `refund_requested`
- `refund_approved`
- `refund_processing`
- `refunded_partial`
- `refunded_full`
- `refund_failed`
- `refund_cancelled`

## `actor_type_enum` _(opcional ahora, recomendado después)_

- `system`
- `buyer`
- `seller`
- `admin`
- `support`

---

# Relaciones principales

- `businesses 1:N orders`
- `profiles (seller) 1:N orders`
- `profiles (buyer) 1:N orders` _(opcional si autenticado)_
- `orders 1:N order_items`
- `orders 1:N payment_transactions`
- `payment_transactions 1:N payment_events`
- `orders 1:1 order_confirmations`
- `orders 1:1 order_fulfillments`
- `orders 1:1 escrow_ledgers`
- `orders 1:1 seller_payouts`
- `orders 1:N refunds`
- `payment_transactions 1:N refunds`

---

# Qué hacer con `payments`

## Estado de `payments`

**Legacy temporal**

## Decisión exacta

- no eliminarla en el primer release
- no extenderla con más lógica escrow
- no usarla como fuente de verdad nueva
- mantenerla solo para:
  - flujos existentes ya desplegados
  - lectura legacy
  - backfill parcial
  - compatibilidad temporal

## Qué NO hacer

- no seguir agregando columnas a `payments` para “zafar”
- no usar `payments` para payout nuevo
- no usar `payments` para refund nuevo
- no meter `orders` adentro de `payments`

Eso sería volver al mismo error conceptual. No, hermano. Ya aprendimos la lección.

---

# Mapeo de backfill desde `payments`

## Campos aprovechables

- `payments.business_id -> orders.business_id`
- `payments.product_id -> order_items.product_id`
- `payments.seller_user_id -> orders.seller_user_id`
- `payments.amount -> orders.total_amount`
- `payments.currency -> orders.currency`
- `payments.payment_method -> payment_transactions.payment_method`
- `payments.culqi_charge_id -> payment_transactions.provider_charge_id`
- `payments.culqi_reference_code -> payment_transactions.provider_reference_code`
- `payments.culqi_tracking_id -> payment_transactions.provider_tracking_id`
- `payments.buyer_email -> orders.buyer_email`
- `payments.buyer_phone -> orders.buyer_phone`
- `payments.delivery_code_hash -> order_confirmations.code_hash`
- `payments.delivery_code_expires_at -> order_confirmations.expires_at`
- `payments.created_at -> created_at`
- `payments.updated_at -> updated_at`
- `payments.metadata -> metadata parcial`

## Campos que NO alcanzan solos

- `buyer_user_id`
- `order_number`
- `buyer_tracking_token`
- `subtotal_amount`
- `tax_amount`
- `platform_fee_amount`
- `gateway_fee_amount`
- `net_seller_amount`
- `escrow ledger`
- `seller payout`
- `refunds`
- `payment_events`
- `order_fulfillments`

## Conclusión del backfill

Se puede hacer **backfill parcial**, no perfecto.

Eso significa:

- algunas órdenes legacy quedarán migradas con bandera `legacy_imported = true` en metadata
- varios montos desglosados deberán inferirse como `0` o `amount total` si no existen datos históricos reales
- refunds/payouts legacy probablemente quedarán incompletos o como solo lectura

---

# Orden recomendado de migraciones

## Migración 1 — Enums y tablas nuevas

Crear:

- enums nuevos
- `orders`
- `order_items`
- `payment_transactions`
- `payment_events`
- `order_confirmations`
- `order_fulfillments`
- `escrow_ledgers`
- `seller_payouts`
- `refunds`

## Migración 2 — Índices y constraints avanzados

Agregar:

- índices compuestos
- checks de montos
- uniques por tracking/order number/idempotency

## Migración 3 — Adaptación de servicios

- escribir flujo nuevo en tablas nuevas
- mantener lectura legacy donde haga falta

## Migración 4 — Backfill parcial desde `payments`

- migrar históricos compatibles
- marcar registros incompletos como legacy

## Migración 5 — Deprecación progresiva

- remover dependencia funcional de `payments`
- convertir `payments` en legacy read-only

## Migración 6 — Eliminación futura _(solo cuando ya no se use)_

- archive o drop de `payments`

---

# Recomendaciones para `schema.ts`

## Cambios recomendados

1. mantener `paymentMethodEnum`
2. deprecar `paymentStatusEnum` actual
3. crear enums nuevos separados
4. no mezclar tablas legacy con tablas nuevas en la misma sección conceptual
5. marcar `payments` explícitamente como legacy en comentario técnico

## Organización sugerida del archivo

- enums
- tablas core existentes
- tablas commerce escrow nuevas
- tablas legacy
- relaciones
- type exports

---

# Riesgos técnicos del Lote 2

1. intentar compatibilidad total con `payments`
2. querer backfill perfecto sin datos suficientes
3. no modelar `buyer_tracking_token`
4. no separar `refunds` y `seller_payouts`
5. no hacer idempotency unique en `payment_transactions`
6. dejar payout como campo dentro de `orders`

---

# Resultado esperado al terminar implementación del Lote 2

Cuando el Lote 2 se implemente de verdad, deberíamos tener:

- nuevo esquema escrow modelado en Drizzle
- migraciones incrementales seguras
- `payments` en modo legacy controlado
- tipos de Supabase regenerados
- base lista para Lote 3

---

# Veredicto final

## ¿Quedó listo el Lote 2 como diseño?

**Sí.**

## ¿Se puede implementar después de este documento?

**Sí.**

## ¿Se resolvió la transición desde `payments`?

**Sí, con convivencia temporal y backfill parcial.**

Ese es el camino sano. No el heroísmo de cambiar todo de golpe.
