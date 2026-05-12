# DECISIONES APROBADAS PROPUESTAS — Cierre de Lote 1 Escrow

## Objetivo

Este documento propone el cierre del **Lote 1** con decisiones concretas para habilitar el **Lote 2**.

No es un brainstorming. Es una propuesta de arquitectura lista para adoptar como baseline del proyecto.

> Si aceptamos estas decisiones como válidas, entonces el Lote 1 puede considerarse **cerrado arquitectónicamente** y ya podríamos pasar a esquema/migraciones.

---

## Veredicto general

### Estado recomendado

**APROBADO ARQUITECTÓNICAMENTE**

### Alcance de esta aprobación

Esta aprobación cubre:

- estados
- transiciones
- expiraciones
- refund
- payout
- comprador invitado/autenticado
- fórmula financiera base

### Advertencia sana

Esto **no reemplaza** una futura validación legal/tributaria/financiera fina.
Pero para arquitectura y modelado de base de datos, esto ya es suficiente para seguir.

---

# E01-T01 — Estados finales por agregado

## Decisión

**Aprobado**

## Decisión tomada

Se adoptan estos estados como baseline oficial.

### `orders`

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

### `payment_transactions`

- `pending`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refunded_partial`
- `refunded_full`

### `order_confirmations`

- `code_generated`
- `waiting_confirmation`
- `confirmed`
- `expired`
- `invalid_attempts_exceeded`
- `invalidated`

### `order_fulfillments`

- `pending`
- `ready_for_pickup`
- `in_delivery`
- `delivered`
- `received`
- `failed`
- `cancelled`

### `escrow_ledgers`

- `holding`
- `release_pending`
- `released`
- `refund_pending`
- `refunded`

### `seller_payouts`

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

### `refunds`

- `refund_requested`
- `refund_approved`
- `refund_processing`
- `refunded_partial`
- `refunded_full`
- `refund_failed`
- `refund_cancelled`

## Justificación

Esto separa correctamente comercio, pago, fulfillment, custodia y liquidación. Bien. Así se modela un negocio real y no un Frankenstein de status mezclados.

## Impacto

- habilita enums claros
- habilita reporting consistente
- reduce ambigüedad en backend/frontend

---

# E01-T02 — Transiciones permitidas

## Decisión

**Aprobado**

## Decisión tomada

Se aprueba la lógica de transición base.

### `orders`

- `draft -> awaiting_payment`
- `awaiting_payment -> payment_processing`
- `payment_processing -> paid_in_escrow`
- `payment_processing -> payment_failed`
- `payment_failed -> awaiting_payment` _(solo mediante nuevo intento)_
- `paid_in_escrow -> awaiting_fulfillment`
- `awaiting_fulfillment -> ready_for_pickup`
- `awaiting_fulfillment -> in_delivery`
- `ready_for_pickup -> delivery_confirmed`
- `in_delivery -> delivery_confirmed`
- `delivery_confirmed -> completed`
- `paid_in_escrow -> confirmation_expired`
- `confirmation_expired -> expired_pending_refund`
- `expired_pending_refund -> refunded_full`
- `paid_in_escrow -> disputed`
- `awaiting_fulfillment -> disputed`
- `delivery_confirmed -> disputed`
- `disputed -> refunded_full`
- `disputed -> completed`
- `awaiting_payment -> cancelled`
- `draft -> cancelled`

### Reglas obligatorias

- `completed` es terminal a nivel comercial
- `refunded_full` es terminal
- `cancelled` es terminal
- `paid_in_escrow` nunca implica payout pagado
- todo refund total bloquea payout pendiente
- todo payout `paid` impide refund automático sin reversa definida

### Actores por tipo

- sistema: expiraciones, webhooks, sincronizaciones
- comprador: inicia checkout, disputa o solicitud de refund
- vendedor: actualiza fulfillment, valida código
- admin/soporte: corrige o fuerza transiciones controladas

## Justificación

La máquina de estados queda suficientemente cerrada para backend y base de datos.

## Impacto

- permite constraints lógicos y servicios más limpios
- evita saltos inventados en código

---

# E01-T03 — Reglas de expiración

## Decisión

**Aprobado**

## Decisión tomada

Se aprueban estas expiraciones base:

### Orden no pagada

- expira en **30 minutos** desde creación

### Código de aceptación

- **pickup:** expira en **7 días calendario**
- **delivery/shipment:** expira en **15 días calendario**

### Orden pagada sin confirmación

- al vencer la ventana de confirmación pasa a `confirmation_expired`
- luego pasa a `expired_pending_refund`

### Resolución posterior a expiración

- si no existe evidencia de fulfillment válida: **refund automático total**
- si existe evidencia operativa o caso conflictivo: **revisión manual** antes del refund

### Extensión de plazo

- solo `admin/soporte` puede extender plazos
- toda extensión debe auditarse

## Justificación

30 minutos para pago es estándar razonable. 7 días para pickup y 15 días para delivery es un baseline práctico y defendible para arrancar.

## Impacto

- habilita jobs automáticos
- evita órdenes zombie
- separa claramente expiración de refund

---

# E01-T04 — Política de refund

## Decisión

**Aprobado**

## Decisión tomada

Se aprueba esta política base:

### Refund total

Aplica cuando:

- el pedido expiró sin confirmación válida
- el vendedor no cumplió
- el pago fue inválido/fraudulento
- soporte/admin resuelve a favor del comprador

### Refund parcial

Aplica cuando:

- hubo cumplimiento parcial
- existe ajuste comercial
- hay acuerdo de compensación validado

### Refund automático

Solo para:

- expiración sin evidencia de fulfillment
- duplicidad/cobro inválido detectado por sistema con reglas seguras

### Refund manual

Aplica para:

- disputas
- ajustes comerciales
- casos con evidencia contradictoria

### Actores

- comprador: puede solicitar
- sistema: puede disparar automático
- admin/soporte: aprueba o rechaza
- backend financiero: ejecuta integración final

### Reglas obligatorias

- refund se separa de disputa
- refund no puede ser solo cambio de status en `orders`
- todo refund debe guardar motivo, actor, timestamps y referencia externa
- si payout ya fue pagado, el refund no puede ejecutarse automáticamente; debe entrar a revisión/reversa

## Justificación

Acá está la diferencia entre una plataforma seria y un juguete. Refund no es “le cambié el estado y ya”. Queda modelado como proceso real.

## Impacto

- habilita tabla `refunds`
- alinea soporte, finanzas y backend

---

# E01-T05 — Política de payout

## Decisión

**Aprobado**

## Decisión tomada

Se aprueba esta política base:

### Nacimiento del payout

- nace cuando la orden pasa a `delivery_confirmed`

### Momento de ejecución

- para fase inicial: **programado/manual asistido**
- SLA base: ejecutar dentro de **24 horas hábiles** luego de `completed` si no hay bloqueos

### Bloqueos del payout

- disputa abierta
- refund en curso
- cuenta payout no verificada
- inconsistencia financiera
- orden no confirmada

### Reintentos

- si falla una vez: reintento manual/operativo
- si falla dos veces: estado `failed` + intervención humana obligatoria

### Estados aprobados

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

## Justificación

Para arrancar, payout programado/manual asistido es mucho más sano que automatizar de entrada. Primero control, después velocidad.

## Impacto

- habilita `seller_payouts`
- evita liberar plata demasiado pronto
- reduce riesgo operativo inicial

---

# E01-T06 — Checkout invitado vs autenticado

## Decisión

**Aprobado**

## Decisión tomada

Se aprueba **checkout invitado controlado**.

### Regla

- `buyer_user_id` será **nullable**
- pero `buyer_email` y `buyer_phone` serán obligatorios
- toda compra invitada tendrá `tracking_token` seguro
- se podrá vincular una compra invitada a una cuenta futura

### Datos mínimos obligatorios del comprador

- email
- phone
- nombre visible si negocio lo necesita

### Tracking del invitado

- mediante token seguro no predecible
- acceso limitado al estado de su orden

## Justificación

Esto baja fricción sin destruir trazabilidad. Es el punto medio inteligente.

## Impacto

- el modelo de `orders` debe soportar comprador autenticado o invitado
- soporte debe poder buscar por order number + email/phone

---

# E01-T07 — Fórmula financiera oficial

## Decisión

**Aprobado**

## Decisión tomada

Se aprueba esta base financiera:

### Variables oficiales

- `subtotal_amount`
- `discount_amount`
- `taxable_base_amount`
- `tax_amount`
- `total_amount`
- `gateway_fee_amount`
- `platform_fee_amount`
- `adjustment_amount`
- `net_seller_amount`
- `refundable_amount`

### Fórmulas

- `taxable_base_amount = subtotal_amount - discount_amount`
- `total_amount = taxable_base_amount + tax_amount`
- `net_seller_amount = total_amount - gateway_fee_amount - platform_fee_amount - adjustment_amount`
- `refundable_amount = total_amount - non_refundable_adjustments` _(si aplica política futura)_

### Reglas base

- el impuesto se calcula sobre la base imponible
- la política por defecto será: **precio mostrado incluye impuestos solo si negocio/UX lo exige; internamente siempre se guarda desglose**
- la comisión gateway se descuenta del neto vendedor en esta primera versión
- redondeo monetario a **2 decimales**, con regla homogénea para checkout, payout y refund

### Nota importante

Si después finanzas decide que la comisión gateway la asume la plataforma, el modelo sigue sirviendo. Lo que cambiaría es la fórmula aplicada, no la arquitectura.

## Justificación

Lo importante no es acertar el último céntimo tributario hoy; lo importante es dejar un modelo que soporte desglose real sin romperse mañana.

## Impacto

- habilita columnas financieras consistentes
- elimina ambigüedad de cálculos futuros

---

# Resultado final del Lote 1

## Estado por tarea

- E01-T01 = **Aprobado**
- E01-T02 = **Aprobado**
- E01-T03 = **Aprobado**
- E01-T04 = **Aprobado**
- E01-T05 = **Aprobado**
- E01-T06 = **Aprobado**
- E01-T07 = **Aprobado**

## Veredicto

### ¿Queda cerrado el Lote 1 con esta propuesta?

**Sí.**

### ¿Se puede abrir el Lote 2?

**Sí, arquitectónicamente sí.**

### Condición

Tomamos este documento como baseline oficial del proyecto hasta que negocio/finanzas pidan un ajuste explícito.

---

# Próximo paso habilitado

Con este cierre ya se puede pasar a:

- diseño exacto de tablas
- estrategia de convivencia con `payments`
- migraciones incrementales
- actualización de `schema.ts`
- regeneración de `database.types.ts`

En otras palabras: **ya está el plano, ahora sí podemos construir.**
