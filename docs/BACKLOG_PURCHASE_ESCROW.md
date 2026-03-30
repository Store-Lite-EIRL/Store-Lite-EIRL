# BACKLOG — Implementación de Compra Escrow / Marketplace

## Objetivo

Este backlog traduce `docs/README_PURCHASE_ESCROW_FLOW.md` en trabajo ejecutable.

La idea no es tirar tareas sueltas. La idea es respetar dependencias, reducir retrabajo y evitar que volvamos a meter todo dentro de `payments`.

---

## Principios del backlog

1. **Primero decisiones de dominio, después migraciones.**
2. **Primero fuente de verdad, después integraciones.**
3. **Primero trazabilidad, después automatización.**
4. **No tocar producción sin cerrar estados, invariantes y reglas de refund/payout.**

---

## Definición de Done global

Una épica se considera terminada cuando:

- tiene reglas funcionales explícitas
- tiene modelo de datos consistente
- tiene manejo de errores definido
- tiene observabilidad mínima
- tiene criterios de aceptación verificables
- no rompe el flujo actual sin plan de transición

---

# Roadmap recomendado

1. Épica 01 — Dominio y contratos
2. Épica 02 — Modelo de datos y migraciones
3. Épica 03 — Creación de orden y checkout
4. Épica 04 — Integración Culqi y webhooks
5. Épica 05 — Confirmación de entrega
6. Épica 06 — Escrow y payout al vendedor
7. Épica 07 — Expiración, refunds y disputas
8. Épica 08 — Backoffice, soporte y conciliación
9. Épica 09 — Seguridad, hardening y rollout

---

# Épica 01 — Dominio y contratos

## Objetivo

Cerrar el lenguaje del negocio y dejar definidos estados, transiciones y reglas. Sin esto, cualquier implementación va a nacer inconsistente.

## Tareas

### E01-T01 — Definir estados finales por agregado
- Definir estados oficiales para:
  - `orders`
  - `payment_transactions`
  - `order_confirmations`
  - `order_fulfillments`
  - `escrow_ledgers`
  - `seller_payouts`
  - `refunds`
- Documentar cuáles son terminales y cuáles intermedios.

### E01-T02 — Definir transiciones permitidas
- Especificar matriz de transición por entidad.
- Ejemplo: `awaiting_payment -> payment_processing -> paid_in_escrow`.
- Definir cuáles transiciones son automáticas y cuáles manuales.

### E01-T03 — Definir reglas de expiración
- Tiempo de vida de orden no pagada.
- Tiempo de vida del código de aceptación.
- Tiempo máximo de espera para confirmación.
- Reglas de auto-refund vs revisión manual.

### E01-T04 — Definir política de refund
- Refund total
- Refund parcial
- Refund manual
- Refund automático
- Motivos válidos
- Quién puede iniciarlo

### E01-T05 — Definir política de payout
- Cuándo nace el payout
- Cuándo se agenda
- Cuándo se ejecuta
- Cuándo se bloquea
- Casos de reproceso

### E01-T06 — Definir checkout invitado vs autenticado
- Confirmar si `buyer_user_id` puede ser nullable.
- Definir qué pasa cuando compra un usuario no logueado.

### E01-T07 — Definir fórmula financiera oficial
- subtotal
- descuentos
- impuestos
- comisión gateway
- comisión plataforma
- retenciones
- neto vendedor

## Entregables
- documento de estados y transiciones
- documento de reglas financieras
- decisiones aprobadas para expiración/refund/payout

## Dependencias
- ninguna

## Riesgos
- arrancar migraciones antes de cerrar esta épica

---

# Épica 02 — Modelo de datos y migraciones

## Objetivo

Traducir el dominio a un esquema consistente en Drizzle/Supabase.

## Tareas

### E02-T01 — Diseñar esquema lógico final
- Diagramar relaciones entre:
  - `orders`
  - `order_items`
  - `payment_transactions`
  - `payment_events`
  - `order_confirmations`
  - `order_fulfillments`
  - `escrow_ledgers`
  - `seller_payouts`
  - `refunds`

### E02-T02 — Diseñar estrategia de transición desde `payments`
- decidir si `payments`:
  - se depreca
  - se migra parcialmente
  - se mantiene temporalmente como compatibilidad
- definir plan de convivencia temporal

### E02-T03 — Agregar enums/constraints/índices
- checks de montos
- checks de expiración
- unicidad de `order_number`
- unicidad de `provider_charge_id`
- índice de consultas operativas

### E02-T04 — Diseñar migraciones incrementales
- migración 1: tablas nuevas
- migración 2: constraints/índices
- migración 3: backfill o compatibilidad
- migración 4: limpieza/deprecación

### E02-T05 — Actualizar `schema.ts`
- modelar nuevas tablas
- modelar relaciones
- modelar tipos inferidos

### E02-T06 — Regenerar `database.types.ts`
- validar que Supabase types reflejen el nuevo esquema
- dejarlo como requisito de cierre técnico

### E02-T07 — Definir datos legacy y backfill
- qué campos de `payments` sirven para backfill
- qué campos no son confiables
- qué registros quedan incompatibles

## Entregables
- modelo lógico aprobado
- migraciones versionadas
- `schema.ts` alineado
- `database.types.ts` regenerado

## Dependencias
- Épica 01 cerrada

## Riesgos
- drift entre schema, migraciones y tipos

---

# Épica 03 — Creación de orden y checkout

## Objetivo

Separar la creación de orden del pago y dejar el inicio del flujo correctamente modelado.

## Tareas

### E03-T01 — Crear servicio de creación de orden
- validar producto
- validar stock
- congelar precio
- guardar snapshot de producto
- calcular montos base

### E03-T02 — Crear `order_items`
- soportar 1 item hoy
- diseñar para múltiples items mañana

### E03-T03 — Reservar o validar stock
- decidir si habrá reserva dura o validación al pagar
- registrar estrategia elegida

### E03-T04 — Exponer endpoint/server action para iniciar checkout
- recibir orden
- crear intento de pago
- devolver datos necesarios al frontend

### E03-T05 — Registrar metadata de correlación
- order id
- business id
- product id
- buyer id o buyer email

## Entregables
- orden persistida antes del pago
- cálculo de montos consistente
- correlación order/payment definida

## Dependencias
- Épica 02

---

# Épica 04 — Integración Culqi y webhooks

## Objetivo

Hacer confiable el cobro con Culqi y la sincronización de estados.

## Tareas

### E04-T01 — Formalizar servicio de creación de cargo/transacción
- crear `payment_transactions`
- registrar request/response relevantes
- guardar tracking ids

### E04-T02 — Implementar idempotencia
- generar `idempotency_key`
- evitar doble cargo por reintentos

### E04-T03 — Diseñar metadata oficial enviada a Culqi
- `order_id`
- `business_id`
- `buyer_reference`
- versión del flujo

### E04-T04 — Implementar webhook seguro
- validar autenticidad
- evitar eventos duplicados
- registrar evento en `payment_events`
- actualizar transacción y orden

### E04-T05 — Manejar errores y reintentos
- charge fallido
- timeout
- webhook tardío
- evento duplicado
- inconsistencia entre respuesta síncrona y webhook

### E04-T06 — Registrar auditoría completa
- payload crudo sanitizado
- estado previo
- estado nuevo
- actor/fuente

## Entregables
- cargos trazables
- webhooks idempotentes
- orden y transacción sincronizadas

## Dependencias
- Épica 03

---

# Épica 05 — Confirmación de entrega

## Objetivo

Construir el mecanismo de aceptación por código sin agujeros de seguridad.

## Tareas

### E05-T01 — Generar código de aceptación
- generar código aleatorio
- almacenar hash
- definir expiración
- guardar últimos 4 dígitos si hace falta soporte

### E05-T02 — Diseñar UX/flujo operativo
- dónde ve el código el comprador
- cómo lo ingresa el vendedor
- mensajes de error
- intentos permitidos

### E05-T03 — Implementar validación de código
- verificar hash
- verificar expiración
- bloquear por excesos de intento
- registrar evento

### E05-T04 — Registrar fulfillment
- pickup / delivery / shipment
- fechas operativas
- usuario responsable
- evidencia si aplica

### E05-T05 — Actualizar orden tras confirmación
- `delivery_confirmed`
- `completed`
- disparar cola/acción de payout

## Entregables
- confirmación segura
- trazabilidad de intentos
- vínculo correcto entre entrega y payout

## Dependencias
- Épica 04

---

# Épica 06 — Escrow y payout al vendedor

## Objetivo

Modelar y ejecutar la liberación del dinero al vendedor después de la confirmación.

## Tareas

### E06-T01 — Crear ledger de escrow
- registrar monto retenido
- registrar monto liberable
- registrar monto liberado
- registrar monto refundado

### E06-T02 — Formalizar cálculo neto al vendedor
- comisión gateway
- comisión plataforma
- impuestos/retenciones
- ajustes manuales si existieran

### E06-T03 — Crear servicio de payout
- crear `seller_payouts`
- asociar cuenta de payout
- programar ejecución

### E06-T04 — Implementar estados de payout
- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`

### E06-T05 — Manejar fallas operativas
- cuenta bancaria inválida
- rechazo bancario
- payout duplicado
- payout bloqueado por disputa/refund

### E06-T06 — Notificar al vendedor
- payout creado
- payout pagado
- payout fallido

## Entregables
- dinero retenido y liberado de forma trazable
- cálculo neto consistente
- payout desacoplado del pago inicial

## Dependencias
- Épica 05

---

# Épica 07 — Expiración, refunds y disputas

## Objetivo

Resolver los casos donde la compra no termina bien. Acá es donde los sistemas flojos se rompen, así que hay que ponerse las pilas.

## Tareas

### E07-T01 — Automatizar expiración de confirmación
- detectar órdenes vencidas
- marcar estado correspondiente
- decidir auto refund o revisión

### E07-T02 — Crear entidad y servicio de refunds
- registrar solicitud
- registrar aprobación
- registrar ejecución
- registrar respuesta del proveedor

### E07-T03 — Integrar refund con Culqi
- refund total
- refund parcial
- tracking de respuesta

### E07-T04 — Sincronizar refund con order/escrow/payout
- actualizar orden
- actualizar ledger
- evitar payout si el refund avanza
- revertir payout pendiente si aplica

### E07-T05 — Diseñar base de disputas
- aunque inicialmente sea mínimo, dejar contrato
- actor que abre disputa
- razón
- evidencia
- resultado

### E07-T06 — Notificaciones y soporte
- avisos al comprador
- avisos al vendedor
- acciones para soporte/admin

## Entregables
- expiración operativa
- refunds trazables
- base preparada para disputas

## Dependencias
- Épica 06

---

# Épica 08 — Backoffice, soporte y conciliación

## Objetivo

Dar visibilidad y herramientas operativas. Porque si todo vive enterrado en tablas, soporte queda ciego.

## Tareas

### E08-T01 — Panel de órdenes
- buscar por order id
- ver estados
- ver montos
- ver comprador/vendedor

### E08-T02 — Panel de pagos/transacciones
- ver charge id
- ver tracking id
- ver eventos
- ver reintentos

### E08-T03 — Panel de confirmaciones
- estado del código
- expiración
- intentos fallidos

### E08-T04 — Panel de payouts
- pendientes
- en proceso
- pagados
- fallidos

### E08-T05 — Panel de refunds
- solicitados
- aprobados
- ejecutados
- fallidos

### E08-T06 — Conciliación operativa
- comparar orden vs transacción vs escrow vs payout vs refund
- detectar huecos o inconsistencias

## Entregables
- herramientas mínimas de soporte
- conciliación visible
- trazabilidad de punta a punta

## Dependencias
- Épicas 04, 05, 06 y 07

---

# Épica 09 — Seguridad, hardening y rollout

## Objetivo

Cerrar el sistema para producción sin dejar ventanas tontas.

## Tareas

### E09-T01 — Hardening de datos sensibles
- cifrado o protección de cuentas bancarias
- sanitización de logs
- acceso por rol

### E09-T02 — RLS / permisos
- quién puede ver órdenes
- quién puede ver payouts
- quién puede confirmar entrega
- quién puede iniciar refunds

### E09-T03 — Alertas y monitoreo
- webhook fallido
- payout fallido
- refund fallido
- órdenes expiradas acumuladas

### E09-T04 — Plan de rollout
- feature flags si aplica
- convivencia con flujo actual
- migración gradual
- rollback strategy

### E09-T05 — QA funcional y técnica
- casos felices
- casos de error
- reintentos
- expiraciones
- reconciliación

## Entregables
- rollout seguro
- monitoreo mínimo
- permisos cerrados

## Dependencias
- todas las anteriores

---

# Backlog priorizado inmediato

## Sprint / Lote 1 — Obligatorio antes de tocar pagos

- E01-T01 Definir estados finales por agregado
- E01-T02 Definir transiciones permitidas
- E01-T03 Definir reglas de expiración
- E01-T04 Definir política de refund
- E01-T05 Definir política de payout
- E01-T06 Definir checkout invitado vs autenticado
- E01-T07 Definir fórmula financiera oficial

## Sprint / Lote 2 — Base técnica

- E02-T01 Diseñar esquema lógico final
- E02-T02 Diseñar estrategia de transición desde `payments`
- E02-T03 Agregar enums/constraints/índices
- E02-T04 Diseñar migraciones incrementales
- E02-T05 Actualizar `schema.ts`
- E02-T06 Regenerar `database.types.ts`

## Sprint / Lote 3 — Flujo mínimo end-to-end

- E03-T01 Crear servicio de creación de orden
- E04-T01 Formalizar servicio de creación de cargo/transacción
- E04-T02 Implementar idempotencia
- E04-T04 Implementar webhook seguro
- E05-T01 Generar código de aceptación
- E05-T03 Implementar validación de código
- E06-T01 Crear ledger de escrow
- E06-T03 Crear servicio de payout
- E07-T01 Automatizar expiración de confirmación
- E07-T02 Crear entidad y servicio de refunds

---

# Riesgos de ejecución

1. Empezar por Culqi sin haber cerrado estados.
2. Migrar tablas sin plan de compatibilidad con `payments`.
3. No regenerar `database.types.ts`.
4. No modelar idempotencia desde el día uno.
5. Hacer payout sin ledger o sin conciliación.
6. Diseñar refund como simple cambio de status.

---

# Criterio para arrancar implementación

Podemos empezar a implementar cuando estén cerrados estos mínimos:

- estados y transiciones aprobados
- estrategia de convivencia con `payments`
- fórmula financiera aprobada
- política de expiración/refund/payout aprobada

Sin eso, programar sería correr sin plano. Y ya sabés cómo termina eso: parche arriba de parche.

---

# Próximo paso recomendado

Convertir el **Lote 1** en tareas técnicas detalladas con:

- owner
- prioridad
- estimación
- dependencias
- criterio de aceptación

Ese debería ser el siguiente documento o la siguiente sesión.
