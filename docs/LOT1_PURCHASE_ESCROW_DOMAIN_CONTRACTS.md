# LOTE 1 — Dominio y Contratos del Flujo Escrow

## Objetivo

Este documento baja el **Lote 1** a trabajo concreto y verificable.

Su propósito es dejar cerradas las decisiones mínimas para poder pasar al **Lote 2 (modelo de datos y migraciones)** sin improvisar.

> Regla de hierro: si este lote no está realmente cerrado, avanzar al esquema sería una mala decisión técnica.

---

## Estado del Lote 1

**Estado actual:** PREPARADO PARA EJECUCIÓN  
**Estado de cierre:** PENDIENTE DE APROBACIÓN FUNCIONAL/TÉCNICA

### Qué significa esto

- **Sí se ejecutó correctamente la documentación del Lote 1.**
- **No está funcionalmente cerrado todavía**, porque varias definiciones necesitan aprobación explícita del negocio/arquitectura antes de tocar tablas y migraciones.

En otras palabras:

- el lote está **bien armado**
- el lote está **listo para trabajarse**
- el lote **todavía no habilita por sí solo** pasar al siguiente si no se aprueban sus decisiones

Y eso está bien. Peor sería mentirte y decirte “ya está” cuando todavía faltan definiciones de dominio. NO hacemos humo acá.

---

## Criterio de salida del Lote 1

El Lote 1 se considera realmente terminado cuando estas 7 tareas estén en estado `Aprobado`:

- E01-T01 Estados finales por agregado
- E01-T02 Transiciones permitidas
- E01-T03 Reglas de expiración
- E01-T04 Política de refund
- E01-T05 Política de payout
- E01-T06 Checkout invitado vs autenticado
- E01-T07 Fórmula financiera oficial

Además, deben cumplirse estas condiciones:

1. existe una única versión vigente del vocabulario de estados
2. no hay contradicciones entre orden, pago, refund y payout
3. las decisiones financieras no dependen de “ya lo vemos en código”
4. las reglas de expiración están definidas con tiempos y consecuencias
5. se sabe si `buyer_user_id` será obligatorio o no
6. está definido qué bloquea un payout
7. está definido qué dispara un refund

---

# Tablero detallado del Lote 1

## E01-T01 — Definir estados finales por agregado

### Objetivo
Definir el conjunto oficial de estados por entidad para que backend, frontend, soporte y reporting hablen el mismo idioma.

### Prioridad
**Crítica**

### Estimación
**1 sesión de definición + 1 validación**

### Owner sugerido
- Arquitectura / producto

### Dependencias
- ninguna

### Entradas
- `docs/README_PURCHASE_ESCROW_FLOW.md`
- `docs/BACKLOG_PURCHASE_ESCROW.md`

### Trabajo a realizar
Definir estados oficiales para:

- `orders`
- `payment_transactions`
- `order_confirmations`
- `order_fulfillments`
- `escrow_ledgers`
- `seller_payouts`
- `refunds`

Para cada agregado hay que marcar:

- estados activos
- estados terminales
- estados inválidos o descartados
- significado exacto de cada estado

### Propuesta base

#### `orders`
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

#### `payment_transactions`
- `pending`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refunded_partial`
- `refunded_full`

#### `order_confirmations`
- `code_generated`
- `waiting_confirmation`
- `confirmed`
- `expired`
- `invalid_attempts_exceeded`
- `invalidated`

#### `seller_payouts`
- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`
- `cancelled`

#### `refunds`
- `refund_requested`
- `refund_approved`
- `refund_processing`
- `refunded_partial`
- `refunded_full`
- `refund_failed`
- `refund_cancelled`

### Criterios de aceptación
- existe una lista única de estados por agregado
- cada estado tiene definición funcional en lenguaje claro
- se distinguen estados terminales e intermedios
- no hay nombres duplicados con significados distintos

### Estado actual
**Listo para revisión**

---

## E01-T02 — Definir transiciones permitidas

### Objetivo
Evitar saltos arbitrarios de estado y documentar la máquina de estados del negocio.

### Prioridad
**Crítica**

### Estimación
**1 a 2 sesiones**

### Owner sugerido
- Arquitectura / backend

### Dependencias
- E01-T01

### Trabajo a realizar
Por cada agregado, definir:

- estado origen
- estado destino
- actor que puede disparar el cambio
- condición necesaria
- efecto secundario

### Propuesta base

#### `orders`
- `draft -> awaiting_payment`
- `awaiting_payment -> payment_processing`
- `payment_processing -> paid_in_escrow`
- `payment_processing -> payment_failed`
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
- `disputed -> refunded_full`
- `disputed -> completed`

#### Reglas de transición importantes
- `completed` no vuelve a `awaiting_fulfillment`
- `refunded_full` es terminal
- `payment_failed` es terminal salvo nuevo intento con otra transacción
- `paid_in_escrow` no significa payout ejecutado

### Criterios de aceptación
- existe matriz de transición por agregado
- cada transición tiene actor y condición
- se identifican transiciones prohibidas
- queda claro qué cambios son automáticos y cuáles manuales

### Estado actual
**Listo para revisión**

---

## E01-T03 — Definir reglas de expiración

### Objetivo
Cerrar la política temporal del flujo. Un sistema sin expiraciones definidas termina lleno de órdenes zombie.

### Prioridad
**Crítica**

### Estimación
**1 sesión**

### Owner sugerido
- Producto / operaciones / arquitectura

### Dependencias
- E01-T01
- E01-T02

### Trabajo a realizar
Definir con tiempos concretos:

- expiración de orden no pagada
- expiración del código de aceptación
- expiración de la ventana de confirmación
- tiempo de espera antes de refund automático o revisión manual

### Propuesta base

- orden creada sin pago: expira en **30 minutos**
- código de aceptación: expira en **7 días** para pickup y **15-30 días** para envío, según política final
- orden pagada sin confirmación: pasa a revisión o refund al vencer la ventana de confirmación
- si existe evidencia de entrega incompleta: pasa a revisión manual antes de refund

### Decisiones a cerrar
- ¿el mismo plazo aplica para pickup y delivery?
- ¿el refund al vencer será automático o condicionado?
- ¿qué actor puede extender el plazo?

### Criterios de aceptación
- cada expiración tiene duración definida
- cada expiración tiene consecuencia definida
- se sabe qué proceso automático la evalúa
- se sabe cuándo entra soporte/manual review

### Estado actual
**Pendiente de aprobación de negocio**

---

## E01-T04 — Definir política de refund

### Objetivo
Determinar cuándo, cómo y quién puede devolver dinero.

### Prioridad
**Crítica**

### Estimación
**1 sesión**

### Owner sugerido
- Producto / finanzas / backend

### Dependencias
- E01-T02
- E01-T03

### Trabajo a realizar
Definir:

- refund total
- refund parcial
- refund automático
- refund manual
- causales válidas
- actores autorizados
- estados del refund
- relación entre refund y payout

### Propuesta base

#### Refund total
Aplica cuando:
- no se confirmó entrega
- la orden expiró sin resolución favorable al vendedor
- hubo fraude o cobro inválido

#### Refund parcial
Aplica cuando:
- hay ajuste comercial
- hubo entrega parcial
- hay compensación limitada

#### Actores posibles
- sistema
- soporte/admin
- comprador (solicita)
- backend financiero (ejecuta)

### Reglas obligatorias
- no puede existir `refunded_full` si ya hubo payout `paid` sin política de reversa definida
- todo refund debe dejar trazabilidad de motivo y actor
- refund y disputa no son lo mismo

### Criterios de aceptación
- existen causales válidas documentadas
- se distingue solicitud, aprobación y ejecución
- queda claro cuándo bloquea payout
- queda claro cuándo puede ser automático

### Estado actual
**Pendiente de aprobación de negocio/finanzas**

---

## E01-T05 — Definir política de payout

### Objetivo
Definir las reglas de liberación de fondos al vendedor.

### Prioridad
**Crítica**

### Estimación
**1 sesión**

### Owner sugerido
- Finanzas / operaciones / arquitectura

### Dependencias
- E01-T02
- E01-T04
- E01-T07

### Trabajo a realizar
Definir:

- cuándo nace el payout
- si se ejecuta inmediato o programado
- qué bloquea el payout
- cómo se reprocesa un payout fallido
- qué estados tendrá

### Propuesta base

- el payout **nace** cuando la entrega fue confirmada
- el payout **no debe nacer** solo porque el comprador pagó
- el payout puede pasar por `pending -> scheduled -> processing -> paid`
- el payout se bloquea por:
  - disputa abierta
  - refund en curso
  - cuenta payout no verificada
  - inconsistencia financiera

### Decisiones a cerrar
- ¿el payout será manual al inicio o automático?
- ¿en cuánto tiempo se paga al vendedor luego de `completed`?
- ¿qué hacemos si el payout falla dos veces?

### Criterios de aceptación
- se sabe exactamente qué evento crea el payout
- se saben los bloqueos funcionales
- se sabe el SLA esperado de liberación
- se sabe la estrategia de retry/falla

### Estado actual
**Pendiente de aprobación operativa/financiera**

---

## E01-T06 — Definir checkout invitado vs autenticado

### Objetivo
Cerrar si el comprador debe existir como usuario formal o si permitiremos invitado.

### Prioridad
**Alta**

### Estimación
**1 sesión corta**

### Owner sugerido
- Producto / arquitectura

### Dependencias
- ninguna

### Trabajo a realizar
Definir:

- si `buyer_user_id` será obligatorio
- si habrá compras como invitado
- si el invitado podrá rastrear orden
- cómo se resuelve identidad mínima del comprador

### Alternativas

#### Opción A — Solo autenticado
**Ventajas**
- mejor trazabilidad
- mejor soporte
- mejor historial de compras

**Desventajas**
- más fricción en checkout

#### Opción B — Invitado permitido
**Ventajas**
- menos fricción
- más conversión potencial

**Desventajas**
- identidad más débil
- más complejidad en soporte, tracking y seguridad

### Recomendación técnica
Si quieren empezar ordenado, recomiendo:

- permitir **invitado controlado**, pero exigir:
  - `buyer_email`
  - `buyer_phone`
  - token de seguimiento seguro
  - posibilidad futura de vincular la compra a cuenta

### Criterios de aceptación
- queda definido si `buyer_user_id` es nullable
- queda definido el mecanismo de tracking del invitado
- queda definido el set mínimo de datos del comprador

### Estado actual
**Pendiente de decisión de producto**

---

## E01-T07 — Definir fórmula financiera oficial

### Objetivo
Evitar cálculos inconsistentes entre checkout, base de datos, payout y refund.

### Prioridad
**Crítica**

### Estimación
**1 sesión**

### Owner sugerido
- Finanzas / arquitectura / backend

### Dependencias
- ninguna

### Trabajo a realizar
Definir:

- subtotal
- descuentos
- impuestos
- comisión gateway
- comisión plataforma
- retenciones
- monto total cobrado
- neto vendedor
- monto refundable

### Propuesta base

#### Variables
- `subtotal_amount`
- `discount_amount`
- `tax_amount`
- `gateway_fee_amount`
- `platform_fee_amount`
- `adjustment_amount`
- `total_amount`
- `net_seller_amount`

#### Fórmulas
- `taxable_base = subtotal_amount - discount_amount`
- `total_amount = taxable_base + tax_amount`
- `net_seller_amount = total_amount - gateway_fee_amount - platform_fee_amount - adjustment_amount`

### Decisiones a cerrar
- si el impuesto va incluido en precio o se suma encima
- si la comisión gateway la absorbe plataforma o vendedor
- si habrá redondeo bancario y cómo se maneja
- si el refund devuelve comisión al comprador o no

### Criterios de aceptación
- existe glosario financiero único
- las fórmulas están escritas y aprobadas
- se define política de redondeo
- payout y refund usan la misma base de cálculo

### Estado actual
**Pendiente de aprobación financiera**

---

# Resumen de preparación del Lote 1

## Resultado de esta ejecución

Queda preparado el Lote 1 con:

- tareas detalladas
- prioridades
- estimaciones
- owners sugeridos
- dependencias
- criterios de aceptación
- propuestas base para acelerar definición

## Veredicto

### ¿Se ejecutó correctamente?
**Sí.** Se ejecutó correctamente como **documentación de ejecución y checklist de cierre**.

### ¿Ya está cerrado para pasar al siguiente lote?
**Todavía no.**

### ¿Qué falta para habilitar Lote 2?
Falta aprobar explícitamente:

1. estados finales
2. matriz de transiciones
3. política de expiración
4. política de refund
5. política de payout
6. decisión invitado/autenticado
7. fórmula financiera oficial

---

# Gate para pasar al Lote 2

## Se puede pasar al siguiente lote solo si:

- E01-T01 = Aprobado
- E01-T02 = Aprobado
- E01-T03 = Aprobado
- E01-T04 = Aprobado
- E01-T05 = Aprobado
- E01-T06 = Aprobado
- E01-T07 = Aprobado

Si alguno queda en duda, hay que resolverlo primero.

---

# Recomendación inmediata

El siguiente paso correcto es tomar este documento y convertirlo en una **decisión de dominio aprobada**.

La forma más sana de seguir es:

1. revisar y cerrar este Lote 1
2. marcar cada tarea como `Aprobado` / `Pendiente` / `Requiere decisión`
3. recién después abrir el Lote 2

---

# Conclusión

El Lote 1 ya quedó **bajado, estructurado y listo para validación**.

Eso significa que hicimos bien el trabajo arquitectónico previo.

Pero no te voy a vender humo: **todavía no corresponde pasar al siguiente lote como si ya estuviera cerrado**. Primero hay que aprobar estas decisiones.

Y eso está PERFECTO, porque así evitamos construir castillos sobre arena.
