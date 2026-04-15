# README — Flujo de Compra Escrow / Marketplace

## Objetivo

Este documento define el flujo de compra objetivo para productos vendidos por negocios dentro de la plataforma cuando el dinero **no se libera inmediatamente al vendedor**, sino que primero queda en custodia de la plataforma hasta que la entrega sea confirmada.

Este README existe para evitar ambigüedad funcional, de base de datos y de implementación.

> Idea central: **la compra, el cobro, la entrega y la liquidación al vendedor son procesos distintos**. No deben modelarse como si fueran una sola cosa.

---

## Contexto del negocio

Ejemplo base:

- Un usuario público quiere comprar un CPU de **S/ 2,000.00**.
- Métodos como Yape u otros pueden no aplicar para ciertos montos o reglas del negocio.
- El pago se realiza con **tarjeta** mediante **Culqi**.
- El dinero entra primero a la **cuenta merchant de la plataforma**.
- El vendedor/negocio recibe notificación de que existe una compra pagada.
- El comprador recoge el producto o coordina entrega.
- El comprador comparte un **código de aceptación**.
- El vendedor registra ese código.
- La plataforma confirma la operación y recién allí **libera el dinero al vendedor**.
- Si la compra no se confirma dentro del tiempo permitido, se inicia el flujo de **expiración/reembolso**.

---

## Principio de arquitectura

El sistema no debe tratar esto como un simple `payment`.

Hay al menos **cinco dominios distintos**:

1. **Orden de compra**
2. **Transacción con la pasarela (Culqi)**
3. **Custodia / escrow**
4. **Confirmación de entrega**
5. **Payout / liquidación al vendedor**

Si todo eso se mete en una sola tabla, después aparecen errores de reconciliación, refunds incompletos, estados ambiguos y deuda técnica.

---

## Flujo funcional completo

## 1. Creación de la intención de compra

El comprador selecciona un producto y genera una intención de compra.

Acciones del sistema:

- validar que el producto exista
- validar que esté disponible
- validar stock
- congelar el precio de compra
- capturar snapshot del producto
- definir ventana de expiración inicial
- determinar métodos de pago permitidos

Resultado esperado:

- se crea una **orden** con estado inicial
- todavía no existe compra completada, solo intención

Estado sugerido de orden:

- `draft`
- `awaiting_payment`

---

## 2. Inicio de pago con Culqi

El frontend tokeniza la tarjeta con Culqi.

El backend:

- recibe token / source id
- crea cargo o transacción contra Culqi
- envía metadata para reconciliación
- registra idempotency key
- guarda request/response relevantes

Resultado esperado:

- si Culqi aprueba: la orden pasa a pagada en custodia
- si Culqi falla: la orden queda fallida o expirada

Estados sugeridos:

### Orden

- `payment_processing`
- `paid_in_escrow`
- `payment_failed`

### Transacción de pago

- `pending`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refunded_partial`
- `refunded_full`

---

## 3. Custodia del dinero

Una vez que el cargo fue aprobado, **el dinero no se entrega al vendedor**.

El dinero pasa a estar en estado de custodia lógica dentro de la plataforma.

Esto significa:

- el comprador ya pagó
- la plataforma ya cobró
- el vendedor todavía no debe recibir liquidación final
- la orden queda a la espera de entrega/confirmación

Estado sugerido de orden:

- `awaiting_fulfillment`
- `ready_for_pickup`
- `in_delivery`

Estado sugerido de escrow:

- `holding`
- `release_pending`
- `released`
- `refund_pending`
- `refunded`

---

## 4. Notificación al vendedor

Cuando el pago fue exitoso, el vendedor/negocio debe ser notificado.

La notificación debe incluir al menos:

- número de orden
- producto comprado
- monto pagado
- comprador
- fecha límite de entrega/confirmación
- instrucciones operativas

Importante:

- el vendedor ve que la compra fue pagada
- pero **no debe interpretarse como dinero ya liquidado a su cuenta bancaria**

---

## 5. Generación del código de aceptación

Después del pago se genera un código de aceptación / confirmación.

Reglas sugeridas:

- visible solo al comprador
- almacenado únicamente como hash
- un solo código activo por orden
- con fecha de expiración
- con contador de intentos fallidos
- opcionalmente rotación del código bajo reglas controladas

Estados sugeridos de confirmación:

- `code_generated`
- `waiting_confirmation`
- `confirmed`
- `expired`
- `invalid_attempts_exceeded`

---

## 6. Entrega o recojo del producto

El producto puede entregarse por:

- recojo en tienda
- entrega coordinada
- envío

El sistema debe registrar evidencia operativa mínima:

- tipo de fulfillment
- fecha pactada
- fecha efectiva
- quién atendió
- observaciones
- evidencia opcional (foto, firma, documento)

---

## 7. Confirmación por código

El comprador comparte el código de aceptación al vendedor.

El vendedor lo ingresa en la plataforma.

El backend:

- busca la orden
- verifica hash
- valida expiración
- valida número de intentos
- marca confirmación de entrega
- dispara flujo de liberación de fondos

Resultado esperado:

- la orden queda completada
- el escrow pasa a liberación
- se genera el payout al vendedor

Estados sugeridos:

### Orden

- `delivery_confirmed`
- `completed`

### Payout

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

---

## 8. Liberación del dinero al vendedor

La plataforma calcula cuánto dinero corresponde al vendedor.

Cálculos mínimos:

- subtotal producto
- descuentos
- impuestos
- comisión plataforma
- comisión gateway
- retenciones u otros ajustes
- monto neto al vendedor

Fórmula conceptual:

`net_seller_amount = total_paid - platform_fee - gateway_fee - tax_withholdings - adjustments`

Cuando la compra es válida:

- se crea un registro de payout
- se agenda o ejecuta transferencia bancaria
- se audita el resultado

---

## 9. Expiración de la compra

Si el comprador no confirma la entrega dentro del plazo definido, la orden no puede quedar colgada para siempre.

Debe existir política explícita para:

- expiración del código
- expiración de la ventana de entrega
- expiración de la custodia
- revisión manual o automática

Estados sugeridos:

- `confirmation_expired`
- `expired_pending_refund`
- `expired_under_review`
- `expired_closed`

---

## 10. Reembolso

Si no se confirma la entrega, si hay incidencia o si el negocio no cumple, debe existir flujo de refund.

Tipos de refund:

- refund total
- refund parcial
- refund manual
- refund automático por expiración

Datos mínimos a guardar:

- motivo
- actor que lo inició
- fecha
- monto solicitado
- monto aprobado
- monto ejecutado
- respuesta de Culqi
- tracking id

Estados sugeridos:

- `refund_requested`
- `refund_approved`
- `refund_processing`
- `refunded_partial`
- `refunded_full`
- `refund_failed`

---

## Entidades recomendadas

## 1. `orders`

Representa la compra de negocio.

Campos mínimos sugeridos:

- `id`
- `order_number`
- `buyer_user_id` (nullable solo si se permite checkout invitado)
- `buyer_email`
- `buyer_phone`
- `business_id`
- `seller_user_id`
- `status`
- `currency`
- `subtotal_amount`
- `discount_amount`
- `tax_amount`
- `platform_fee_amount`
- `gateway_fee_amount`
- `total_amount`
- `net_seller_amount`
- `expires_at`
- `paid_at`
- `completed_at`
- `cancelled_at`
- `refunded_at`
- `created_at`
- `updated_at`
- `metadata`

Notas:

- `orders` es la fuente de verdad del proceso comercial
- no debe depender del payload crudo de Culqi para existir

---

## 2. `order_items`

Permite escalar a compras con múltiples productos.

Campos sugeridos:

- `id`
- `order_id`
- `product_id`
- `product_snapshot`
- `quantity`
- `unit_price_amount`
- `subtotal_amount`
- `discount_amount`
- `tax_amount`
- `total_amount`

Nota:

Aunque hoy compres un solo CPU, diseñar con `order_items` evita rehacer la base después.

---

## 3. `payment_transactions`

Representa la interacción financiera con Culqi.

Campos sugeridos:

- `id`
- `order_id`
- `provider` (`culqi`)
- `payment_method`
- `provider_charge_id`
- `provider_order_id`
- `provider_reference_code`
- `provider_tracking_id`
- `idempotency_key`
- `status`
- `currency`
- `requested_amount`
- `authorized_amount`
- `captured_amount`
- `refunded_amount`
- `raw_request`
- `raw_response`
- `processed_at`
- `created_at`
- `updated_at`

Nota:

Una orden podría tener reintentos. Por eso no conviene que todo viva en una única fila genérica de pagos.

---

## 4. `payment_events`

Auditoría de eventos del gateway y del sistema.

Campos sugeridos:

- `id`
- `payment_transaction_id`
- `event_type`
- `event_source` (`webhook`, `system`, `admin`, `buyer`, `seller`)
- `event_status`
- `payload`
- `occurred_at`
- `created_at`

Ejemplos de eventos:

- `charge.created`
- `charge.succeeded`
- `charge.failed`
- `refund.created`
- `refund.succeeded`
- `webhook.received`
- `delivery.code.confirmed`

---

## 5. `order_confirmations`

Controla el código de aceptación y su validación.

Campos sugeridos:

- `id`
- `order_id`
- `code_hash`
- `code_last4`
- `status`
- `attempts_count`
- `max_attempts`
- `expires_at`
- `confirmed_by_seller_user_id`
- `confirmed_at`
- `invalidated_at`
- `created_at`
- `updated_at`

---

## 6. `order_fulfillments`

Registra el avance operativo de la entrega.

Campos sugeridos:

- `id`
- `order_id`
- `fulfillment_type` (`pickup`, `delivery`, `shipment`)
- `status`
- `scheduled_at`
- `ready_at`
- `delivered_at`
- `received_at`
- `handled_by_user_id`
- `notes`
- `evidence`
- `created_at`
- `updated_at`

---

## 7. `escrow_ledgers`

Representa la custodia lógica del dinero.

Campos sugeridos:

- `id`
- `order_id`
- `status`
- `gross_amount`
- `held_amount`
- `releasable_amount`
- `released_amount`
- `refunded_amount`
- `currency`
- `hold_started_at`
- `release_scheduled_at`
- `released_at`
- `refund_started_at`
- `refunded_at`
- `created_at`
- `updated_at`

Nota:

No reemplaza la contabilidad externa real, pero sí modela el estado financiero interno del negocio.

---

## 8. `seller_payouts`

Liquida el dinero al vendedor.

Campos sugeridos:

- `id`
- `order_id`
- `seller_user_id`
- `seller_payout_account_id`
- `status`
- `gross_amount`
- `platform_fee_amount`
- `gateway_fee_amount`
- `tax_withholding_amount`
- `adjustment_amount`
- `net_amount`
- `currency`
- `scheduled_at`
- `processed_at`
- `paid_at`
- `failed_at`
- `failure_reason`
- `provider_reference`
- `metadata`
- `created_at`
- `updated_at`

---

## 9. `refunds`

Separa el refund como entidad propia.

Campos sugeridos:

- `id`
- `order_id`
- `payment_transaction_id`
- `status`
- `reason`
- `requested_by_actor_type`
- `requested_by_actor_id`
- `requested_amount`
- `approved_amount`
- `executed_amount`
- `provider_refund_id`
- `provider_tracking_id`
- `processed_at`
- `created_at`
- `updated_at`
- `metadata`

---

## Estados recomendados

## Estados de `orders`

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

---

## Estados de `payment_transactions`

- `pending`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refunded_partial`
- `refunded_full`

---

## Estados de `order_confirmations`

- `code_generated`
- `waiting_confirmation`
- `confirmed`
- `expired`
- `invalid_attempts_exceeded`
- `invalidated`

---

## Estados de `seller_payouts`

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

---

## Estados de `refunds`

- `refund_requested`
- `refund_approved`
- `refund_processing`
- `refunded_partial`
- `refunded_full`
- `refund_failed`
- `refund_cancelled`

---

## Reglas de negocio que deben quedar explícitas

## Regla 1 — El dinero entra primero a la plataforma

Nunca se debe modelar como transferencia directa comprador -> vendedor.

Flujo correcto:

`comprador -> Culqi -> cuenta merchant/plataforma -> payout posterior al vendedor`

---

## Regla 2 — El vendedor no cobra al momento del pago

Pago exitoso no implica payout exitoso.

- `paid_in_escrow` != `paid_to_seller`

---

## Regla 3 — El código de aceptación debe ir hasheado

Nunca guardar el código en texto plano.

---

## Regla 4 — Debe existir trazabilidad completa

Cada cambio relevante debe poder auditarse.

Ejemplo:

- quién cambió el estado
- cuándo
- por qué
- con qué payload externo

---

## Regla 5 — Debe existir idempotencia

Para evitar dobles cargos y dobles updates:

- `idempotency_key` por intento de pago
- control de webhooks duplicados
- control de reintentos operativos

---

## Regla 6 — La compra debe poder expirar

No puede existir una orden pagada indefinidamente sin resolución.

Debe definirse:

- plazo de confirmación
- política de auto refund
- política de revisión manual

---

## Regla 7 — Los montos deben estar desglosados

No alcanza con guardar `amount`.

Debe existir desglose mínimo:

- subtotal
- descuento
- impuesto
- comisión pasarela
- comisión plataforma
- neto vendedor
- refund

---

## Recomendaciones de base de datos

## Constraints sugeridos

- `amount > 0`
- `quantity > 0`
- `net_amount >= 0`
- `expires_at > created_at`
- unicidad de `provider_charge_id`
- unicidad de `order_number`
- un solo código activo por orden
- payout no creado si la orden no fue confirmada

---

## Índices sugeridos

- `orders (buyer_user_id, created_at desc)`
- `orders (business_id, created_at desc)`
- `orders (status, created_at desc)`
- `payment_transactions (order_id)`
- `payment_transactions (provider_charge_id)`
- `payment_events (payment_transaction_id, created_at desc)`
- `order_confirmations (order_id, status)`
- `seller_payouts (seller_user_id, status, created_at desc)`
- `refunds (order_id, status)`

---

## Campos sensibles

Deben tener tratamiento especial:

- cuentas bancarias
- CCI
- documento de identidad
- payloads financieros crudos
- hashes de código de entrega

Buenas prácticas:

- cifrado en reposo si aplica
- acceso restringido por roles
- nunca exponer en frontend
- logs sanitizados

---

## Riesgos actuales detectados en el proyecto

Con el esquema actual, el proyecto tiene estas brechas:

1. `payments` mezcla orden, pago y confirmación.
2. No existe `buyer_user_id` real en el flujo de pagos actual.
3. No existe entidad clara de payout al vendedor.
4. No existe entidad clara de refund.
5. No existe historial/auditoría financiera completa.
6. `database.types.ts` está desfasado respecto a `schema.ts`.

---

## Propuesta de implementación por etapas

## Etapa 1 — Diseño y decisión de dominio

Definir y aprobar:

- estados finales
- reglas de expiración
- reglas de refund
- reglas de payout
- compra invitada vs compra autenticada

---

## Etapa 2 — Modelo de datos

Crear migraciones para:

- `orders`
- `order_items`
- `payment_transactions`
- `payment_events`
- `order_confirmations`
- `order_fulfillments`
- `escrow_ledgers`
- `seller_payouts`
- `refunds`

---

## Etapa 3 — Integración operativa

Implementar:

- creación de orden
- integración Culqi
- webhook seguro
- generación de código
- validación de código
- liberación a payout
- refund manual/automático

---

## Etapa 4 — Observabilidad y conciliación

Agregar:

- logs auditables
- herramientas de soporte
- conciliación con Culqi
- panel de seguimiento de órdenes y payouts

---

## Decisión recomendada

La plataforma debe migrar desde un modelo de **`payments` como tabla central** hacia un modelo donde:

- `orders` = proceso comercial
- `payment_transactions` = integración financiera con Culqi
- `order_confirmations` = aceptación de entrega
- `escrow_ledgers` = custodia lógica
- `seller_payouts` = pago al vendedor
- `refunds` = devoluciones

Ese enfoque refleja el negocio real y reduce errores futuros.

---

## Próximo paso sugerido

A partir de este README, el siguiente trabajo debe ser dividir la solución en tareas concretas:

1. definición de estados
2. diseño del esquema Drizzle
3. migraciones
4. actualización de tipos
5. servicios de pago
6. webhooks
7. lógica de confirmación
8. payouts
9. refunds
10. panel operativo

---

## Resumen ejecutivo

Este proyecto necesita pasar de un modelo de pago simple a un modelo **marketplace con escrow**.

La compra correcta no es:

`pago -> listo`

La compra correcta es:

`orden -> pago -> custodia -> entrega -> confirmación -> payout / refund`

Si esta separación no se respeta en la base de datos, el sistema va a quedar ambiguo, frágil y difícil de escalar.
