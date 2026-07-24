# BACKLOG â€” ImplementaciÃ³n de Compra Escrow / Marketplace

## Objetivo

Este backlog traduce `docs/README_PURCHASE_ESCROW_FLOW.md` en trabajo ejecutable.

La idea no es tirar tareas sueltas. La idea es respetar dependencias, reducir retrabajo y evitar que vUrbanomos a meter todo dentro de `payments`.

---

## Principios del backlog

1. **Primero decisiones de dominio, despuÃ©s migraciones.**
2. **Primero fuente de verdad, despuÃ©s integraciones.**
3. **Primero trazabilidad, despuÃ©s automatizaciÃ³n.**
4. **No tocar producciÃ³n sin cerrar estados, invariantes y reglas de refund/payout.**

---

## DefiniciÃ³n de Done global

Una Ã©pica se considera terminada cuando:

- tiene reglas funcionales explÃ­citas
- tiene modelo de datos consistente
- tiene manejo de errores definido
- tiene observabilidad mÃ­nima
- tiene criterios de aceptaciÃ³n verificables
- no rompe el flujo actual sin plan de transiciÃ³n

---

# Roadmap recomendado

1. Ã‰pica 01 â€” Dominio y contratos
2. Ã‰pica 02 â€” Modelo de datos y migraciones
3. Ã‰pica 03 â€” CreaciÃ³n de orden y checkout
4. Ã‰pica 04 â€” IntegraciÃ³n Culqi y webhooks
5. Ã‰pica 05 â€” ConfirmaciÃ³n de entrega
6. Ã‰pica 06 â€” Escrow y payout al vendedor
7. Ã‰pica 07 â€” ExpiraciÃ³n, refunds y disputas
8. Ã‰pica 08 â€” Backoffice, soporte y conciliaciÃ³n
9. Ã‰pica 09 â€” Seguridad, hardening y rollout

---

# Ã‰pica 01 â€” Dominio y contratos

## Objetivo

Cerrar el lenguaje del negocio y dejar definidos estados, transiciones y reglas. Sin esto, cualquier implementaciÃ³n va a nacer inconsistente.

## Tareas

### E01-T01 â€” Definir estados finales por agregado

- Definir estados oficiales para:
  - `orders`
  - `payment_transactions`
  - `order_confirmations`
  - `order_fulfillments`
  - `escrow_ledgers`
  - `seller_payouts`
  - `refunds`
- Documentar cuÃ¡les son terminales y cuÃ¡les intermedios.

### E01-T02 â€” Definir transiciones permitidas

- Especificar matriz de transiciÃ³n por entidad.
- Ejemplo: `awaiting_payment -> payment_processing -> paid_in_escrow`.
- Definir cuÃ¡les transiciones son automÃ¡ticas y cuÃ¡les manuales.

### E01-T03 â€” Definir reglas de expiraciÃ³n

- Tiempo de vida de orden no pagada.
- Tiempo de vida del cÃ³digo de aceptaciÃ³n.
- Tiempo mÃ¡ximo de espera para confirmaciÃ³n.
- Reglas de auto-refund vs revisiÃ³n manual.

### E01-T04 â€” Definir polÃ­tica de refund

- Refund total
- Refund parcial
- Refund manual
- Refund automÃ¡tico
- Motivos vÃ¡lidos
- QuiÃ©n puede iniciarlo

### E01-T05 â€” Definir polÃ­tica de payout

- CuÃ¡ndo nace el payout
- CuÃ¡ndo se agenda
- CuÃ¡ndo se ejecuta
- CuÃ¡ndo se bloquea
- Casos de reproceso

### E01-T06 â€” Definir checkout invitado vs autenticado

- Confirmar si `buyer_user_id` puede ser nullable.
- Definir quÃ© pasa cuando compra un usuario no logueado.

### E01-T07 â€” Definir fÃ³rmula financiera oficial

- subtotal
- descuentos
- impuestos
- comisiÃ³n gateway
- comisiÃ³n plataforma
- retenciones
- neto vendedor

## Entregables

- documento de estados y transiciones
- documento de reglas financieras
- decisiones aprobadas para expiraciÃ³n/refund/payout

## Dependencias

- ninguna

## Riesgos

- arrancar migraciones antes de cerrar esta Ã©pica

---

# Ã‰pica 02 â€” Modelo de datos y migraciones

## Objetivo

Traducir el dominio a un esquema consistente en Drizzle/Supabase.

## Tareas

### E02-T01 â€” DiseÃ±ar esquema lÃ³gico final

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

### E02-T02 â€” DiseÃ±ar estrategia de transiciÃ³n desde `payments`

- decidir si `payments`:
  - se depreca
  - se migra parcialmente
  - se mantiene temporalmente como compatibilidad
- definir plan de convivencia temporal

### E02-T03 â€” Agregar enums/constraints/Ã­ndices

- checks de montos
- checks de expiraciÃ³n
- unicidad de `order_number`
- unicidad de `provider_charge_id`
- Ã­ndice de consultas operativas

### E02-T04 â€” DiseÃ±ar migraciones incrementales

- migraciÃ³n 1: tablas nuevas
- migraciÃ³n 2: constraints/Ã­ndices
- migraciÃ³n 3: backfill o compatibilidad
- migraciÃ³n 4: limpieza/deprecaciÃ³n

### E02-T05 â€” Actualizar `schema.ts`

- modelar nuevas tablas
- modelar relaciones
- modelar tipos inferidos

### E02-T06 â€” Regenerar `database.types.ts`

- validar que Supabase types reflejen el nuevo esquema
- dejarlo como requisito de cierre tÃ©cnico

### E02-T07 â€” Definir datos legacy y backfill

- quÃ© campos de `payments` sirven para backfill
- quÃ© campos no son confiables
- quÃ© registros quedan incompatibles

## Entregables

- modelo lÃ³gico aprobado
- migraciones versionadas
- `schema.ts` alineado
- `database.types.ts` regenerado

## Dependencias

- Ã‰pica 01 cerrada

## Riesgos

- drift entre schema, migraciones y tipos

---

# Ã‰pica 03 â€” CreaciÃ³n de orden y checkout

## Objetivo

Separar la creaciÃ³n de orden del pago y dejar el inicio del flujo correctamente modelado.

## Tareas

### E03-T01 â€” Crear servicio de creaciÃ³n de orden

- validar producto
- validar stock
- congelar precio
- guardar snapshot de producto
- calcular montos base

### E03-T02 â€” Crear `order_items`

- soportar 1 item hoy
- diseÃ±ar para mÃºltiples items maÃ±ana

### E03-T03 â€” Reservar o validar stock

- decidir si habrÃ¡ reserva dura o validaciÃ³n al pagar
- registrar estrategia elegida

### E03-T04 â€” Exponer endpoint/server action para iniciar checkout

- recibir orden
- crear intento de pago
- devolver datos necesarios al frontend

### E03-T05 â€” Registrar metadata de correlaciÃ³n

- order id
- business id
- product id
- buyer id o buyer email

## Entregables

- orden persistida antes del pago
- cÃ¡lculo de montos consistente
- correlaciÃ³n order/payment definida

## Dependencias

- Ã‰pica 02

---

# Ã‰pica 04 â€” IntegraciÃ³n Culqi y webhooks

## Objetivo

Hacer confiable el cobro con Culqi y la sincronizaciÃ³n de estados.

## Tareas

### E04-T01 â€” Formalizar servicio de creaciÃ³n de cargo/transacciÃ³n

- crear `payment_transactions`
- registrar request/response relevantes
- guardar tracking ids

### E04-T02 â€” Implementar idempotencia

- generar `idempotency_key`
- evitar doble cargo por reintentos

### E04-T03 â€” DiseÃ±ar metadata oficial enviada a Culqi

- `order_id`
- `business_id`
- `buyer_reference`
- versiÃ³n del flujo

### E04-T04 â€” Implementar webhook seguro

- validar autenticidad
- evitar eventos duplicados
- registrar evento en `payment_events`
- actualizar transacciÃ³n y orden

### E04-T05 â€” Manejar errores y reintentos

- charge fallido
- timeout
- webhook tardÃ­o
- evento duplicado
- inconsistencia entre respuesta sÃ­ncrona y webhook

### E04-T06 â€” Registrar auditorÃ­a completa

- payload crudo sanitizado
- estado previo
- estado nuevo
- actor/fuente

## Entregables

- cargos trazables
- webhooks idempotentes
- orden y transacciÃ³n sincronizadas

## Dependencias

- Ã‰pica 03

---

# Ã‰pica 05 â€” ConfirmaciÃ³n de entrega

## Objetivo

Construir el mecanismo de aceptaciÃ³n por cÃ³digo sin agujeros de seguridad.

## Tareas

### E05-T01 â€” Generar cÃ³digo de aceptaciÃ³n

- generar cÃ³digo aleatorio
- almacenar hash
- definir expiraciÃ³n
- guardar Ãºltimos 4 dÃ­gitos si hace falta soporte

### E05-T02 â€” DiseÃ±ar UX/flujo operativo

- dÃ³nde ve el cÃ³digo el comprador
- cÃ³mo lo ingresa el vendedor
- mensajes de error
- intentos permitidos

### E05-T03 â€” Implementar validaciÃ³n de cÃ³digo

- verificar hash
- verificar expiraciÃ³n
- bloquear por excesos de intento
- registrar evento

### E05-T04 â€” Registrar fulfillment

- pickup / delivery / shipment (Urbano)
- fechas operativas
- usuario responsable
- evidencia si aplica

### E05-T05 â€” Actualizar orden tras confirmaciÃ³n

- `delivery_confirmed`
- `completed`
- disparar cola/acciÃ³n de payout

## Entregables

- confirmaciÃ³n segura
- trazabilidad de intentos
- vÃ­nculo correcto entre entrega y payout

## Dependencias

- Ã‰pica 04

---

# Ã‰pica 06 â€” Escrow y payout al vendedor

## Objetivo

Modelar y ejecutar la liberaciÃ³n del dinero al vendedor despuÃ©s de la confirmaciÃ³n.

## Tareas

### E06-T01 â€” Crear ledger de escrow

- registrar monto retenido
- registrar monto liberable
- registrar monto liberado
- registrar monto refundado

### E06-T02 â€” Formalizar cÃ¡lculo neto al vendedor

- comisiÃ³n gateway
- comisiÃ³n plataforma
- impuestos/retenciones
- ajustes manuales si existieran

### E06-T03 â€” Crear servicio de payout

- crear `seller_payouts`
- asociar cuenta de payout
- programar ejecuciÃ³n

### E06-T04 â€” Implementar estados de payout

- `pending`
- `scheduled`
- `processing`
- `paid`
- `failed`

### E06-T05 â€” Manejar fallas operativas

- cuenta bancaria invÃ¡lida
- rechazo bancario
- payout duplicado
- payout bloqueado por disputa/refund

### E06-T06 â€” Notificar al vendedor

- payout creado
- payout pagado
- payout fallido

## Entregables

- dinero retenido y liberado de forma trazable
- cÃ¡lculo neto consistente
- payout desacoplado del pago inicial

## Dependencias

- Ã‰pica 05

---

# Ã‰pica 07 â€” ExpiraciÃ³n, refunds y disputas

## Objetivo

Resolver los casos donde la compra no termina bien. AcÃ¡ es donde los sistemas flojos se rompen, asÃ­ que hay que ponerse las pilas.

## Tareas

### E07-T01 â€” Automatizar expiraciÃ³n de confirmaciÃ³n

- detectar Ã³rdenes vencidas
- marcar estado correspondiente
- decidir auto refund o revisiÃ³n

### E07-T02 â€” Crear entidad y servicio de refunds

- registrar solicitud
- registrar aprobaciÃ³n
- registrar ejecuciÃ³n
- registrar respuesta del proveedor

### E07-T03 â€” Integrar refund con Culqi

- refund total
- refund parcial
- tracking de respuesta

### E07-T04 â€” Sincronizar refund con order/escrow/payout

- actualizar orden
- actualizar ledger
- evitar payout si el refund avanza
- revertir payout pendiente si aplica

### E07-T05 â€” DiseÃ±ar base de disputas

- aunque inicialmente sea mÃ­nimo, dejar contrato
- actor que abre disputa
- razÃ³n
- evidencia
- resultado

### E07-T06 â€” Notificaciones y soporte

- avisos al comprador
- avisos al vendedor
- acciones para soporte/admin

## Entregables

- expiraciÃ³n operativa
- refunds trazables
- base preparada para disputas

## Dependencias

- Ã‰pica 06

---

# Ã‰pica 08 â€” Backoffice, soporte y conciliaciÃ³n

## Objetivo

Dar visibilidad y herramientas operativas. Porque si todo vive enterrado en tablas, soporte queda ciego.

## Tareas

### E08-T01 â€” Panel de Ã³rdenes

- buscar por order id
- ver estados
- ver montos
- ver comprador/vendedor

### E08-T02 â€” Panel de pagos/transacciones

- ver charge id
- ver tracking id
- ver eventos
- ver reintentos

### E08-T03 â€” Panel de confirmaciones

- estado del cÃ³digo
- expiraciÃ³n
- intentos fallidos

### E08-T04 â€” Panel de payouts

- pendientes
- en proceso
- pagados
- fallidos

### E08-T05 â€” Panel de refunds

- solicitados
- aprobados
- ejecutados
- fallidos

### E08-T06 â€” ConciliaciÃ³n operativa

- comparar orden vs transacciÃ³n vs escrow vs payout vs refund
- detectar huecos o inconsistencias

## Entregables

- herramientas mÃ­nimas de soporte
- conciliaciÃ³n visible
- trazabilidad de punta a punta

## Dependencias

- Ã‰picas 04, 05, 06 y 07

---

# Ã‰pica 09 â€” Seguridad, hardening y rollout

## Objetivo

Cerrar el sistema para producciÃ³n sin dejar ventanas tontas.

## Tareas

### E09-T01 â€” Hardening de datos sensibles

- cifrado o protecciÃ³n de cuentas bancarias
- sanitizaciÃ³n de logs
- acceso por rol

### E09-T02 â€” RLS / permisos

- quiÃ©n puede ver Ã³rdenes
- quiÃ©n puede ver payouts
- quiÃ©n puede confirmar entrega
- quiÃ©n puede iniciar refunds

### E09-T03 â€” Alertas y monitoreo

- webhook fallido
- payout fallido
- refund fallido
- Ã³rdenes expiradas acumuladas

### E09-T04 â€” Plan de rollout

- feature flags si aplica
- convivencia con flujo actual
- migraciÃ³n gradual
- rollback strategy

### E09-T05 â€” QA funcional y tÃ©cnica

- casos felices
- casos de error
- reintentos
- expiraciones
- reconciliaciÃ³n

## Entregables

- rollout seguro
- monitoreo mÃ­nimo
- permisos cerrados

## Dependencias

- todas las anteriores

---

# Backlog priorizado inmediato

## Sprint / Lote 1 â€” Obligatorio antes de tocar pagos

- E01-T01 Definir estados finales por agregado
- E01-T02 Definir transiciones permitidas
- E01-T03 Definir reglas de expiraciÃ³n
- E01-T04 Definir polÃ­tica de refund
- E01-T05 Definir polÃ­tica de payout
- E01-T06 Definir checkout invitado vs autenticado
- E01-T07 Definir fÃ³rmula financiera oficial

## Sprint / Lote 2 â€” Base tÃ©cnica

- E02-T01 DiseÃ±ar esquema lÃ³gico final
- E02-T02 DiseÃ±ar estrategia de transiciÃ³n desde `payments`
- E02-T03 Agregar enums/constraints/Ã­ndices
- E02-T04 DiseÃ±ar migraciones incrementales
- E02-T05 Actualizar `schema.ts`
- E02-T06 Regenerar `database.types.ts`

## Sprint / Lote 3 â€” Flujo mÃ­nimo end-to-end

- E03-T01 Crear servicio de creaciÃ³n de orden
- E04-T01 Formalizar servicio de creaciÃ³n de cargo/transacciÃ³n
- E04-T02 Implementar idempotencia
- E04-T04 Implementar webhook seguro
- E05-T01 Generar cÃ³digo de aceptaciÃ³n
- E05-T03 Implementar validaciÃ³n de cÃ³digo
- E06-T01 Crear ledger de escrow
- E06-T03 Crear servicio de payout
- E07-T01 Automatizar expiraciÃ³n de confirmaciÃ³n
- E07-T02 Crear entidad y servicio de refunds

---

# Riesgos de ejecuciÃ³n

1. Empezar por Culqi sin haber cerrado estados.
2. Migrar tablas sin plan de compatibilidad con `payments`.
3. No regenerar `database.types.ts`.
4. No modelar idempotencia desde el dÃ­a uno.
5. Hacer payout sin ledger o sin conciliaciÃ³n.
6. DiseÃ±ar refund como simple cambio de status.

---

# Criterio para arrancar implementaciÃ³n

Podemos empezar a implementar cuando estÃ©n cerrados estos mÃ­nimos:

- estados y transiciones aprobados
- estrategia de convivencia con `payments`
- fÃ³rmula financiera aprobada
- polÃ­tica de expiraciÃ³n/refund/payout aprobada

Sin eso, programar serÃ­a correr sin plano. Y ya sabÃ©s cÃ³mo termina eso: parche arriba de parche.

---

# PrÃ³ximo paso recomendado

Convertir el **Lote 1** en tareas tÃ©cnicas detalladas con:

- owner
- prioridad
- estimaciÃ³n
- dependencias
- criterio de aceptaciÃ³n

Ese deberÃ­a ser el siguiente documento o la siguiente sesiÃ³n.
