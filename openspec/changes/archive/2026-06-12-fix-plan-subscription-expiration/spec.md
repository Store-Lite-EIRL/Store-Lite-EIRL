# Especificación: subscription-expiration

## Propósito

Especificar el comportamiento de expiración automática de planes pagados, el prorrateo en renovaciones, la función de expiración masiva, y la visualización precisa del tiempo restante en la UI.

---

## 1. subscription-expiration — Degradación automática por fecha vencida

### Requirement: SCD-001 — Verificación de planEndDate en getBusinessEntitlements

La función `getBusinessEntitlements` MUST retornar entitlements del plan Free (`basico`) cuando la suscripción más reciente del negocio tenga `planEndDate < now()` o `planStatus != 'active'`, incluso si existe un registro con `planStatus = 'active'`.

#### Scenario: Suscripción activa con fecha vigente

- GIVEN un negocio con una suscripción `planStatus = 'active'` y `planEndDate > now()`
- WHEN `getBusinessEntitlements(businessId)` es invocada
- THEN retorna los entitlements completos del plan contratado (maxProducts, canImportProducts, etc.)

#### Scenario: Suscripción activa con fecha vencida

- GIVEN un negocio con una suscripción `planStatus = 'active'` y `planEndDate < now()`
- WHEN `getBusinessEntitlements(businessId)` es invocada
- THEN retorna los entitlements del plan `basico` (Free)

#### Scenario: Sin suscripción activa registrada

- GIVEN un negocio sin ningún registro en `businessSubscriptions`
- WHEN `getBusinessEntitlements(businessId)` es invocada
- THEN retorna los entitlements del plan `basico`

#### Scenario: Suscripción con planStatus inactive

- GIVEN un negocio con suscripción `planStatus = 'inactive'`
- WHEN `getBusinessEntitlements(businessId)` es invocada
- THEN retorna los entitlements del plan `basico` independientemente de `planEndDate`

---

## 2. expire-subscriptions — Expiración masiva de suscripciones

### Requirement: SCD-002 — expireSubscriptions()

El sistema SHALL exponer una función `expireSubscriptions()` que actualice a `planStatus = 'inactive'` todas las suscripciones con `planEndDate < now()` y `planStatus = 'active'`. La función MUST ser idempotente.

#### Scenario: Suscripción vencida se marca como inactive

- GIVEN una suscripción con `planEndDate < now()` y `planStatus = 'active'`
- WHEN `expireSubscriptions()` es invocada
- THEN la suscripción queda con `planStatus = 'inactive'`

#### Scenario: Suscripción vigente no se modifica

- GIVEN una suscripción con `planEndDate >= now()` y `planStatus = 'active'`
- WHEN `expireSubscriptions()` es invocada
- THEN la suscripción permanece con `planStatus = 'active'`

#### Scenario: Suscripción ya inactive no se modifica

- GIVEN una suscripción con `planStatus = 'inactive'` y cualquier `planEndDate`
- WHEN `expireSubscriptions()` es invocada
- THEN no se realizan cambios sobre esa suscripción

#### Scenario: Sin suscripciones vencidas

- GIVEN que ninguna suscripción tiene `planEndDate < now()` y `planStatus = 'active'`
- WHEN `expireSubscriptions()` es invocada
- THEN la ejecución completa sin errores y ninguna fila es modificada

---

## 3. purchase-plan-proration — Prorrateo al renovar el mismo plan

### Requirement: SCD-003 — Extensión de fechas en renovación del mismo plan

El endpoint `POST /api/billing/purchase-plan` MUST extender `planEndDate` desde la fecha actual de finalización cuando se renueva el mismo plan, en vez de reiniciar desde hoy. Para upgrades o downgrades (plan diferente), las fechas SHALL reiniciarse desde la fecha actual.

#### Scenario: Renovar el mismo plan en período mensual

- GIVEN una suscripción activa con `planType = 'emprendedor'` y `planEndDate = 2026-07-15`
- WHEN se compra el mismo plan (`planType = 'emprendedor'`) con `period = 'monthly'`
- THEN la nueva suscripción tiene `planEndDate = 2026-08-14` (30 días desde el fin anterior)
- AND `planStartDate` se mantiene como la fecha original del primer inicio

#### Scenario: Renovar el mismo plan en período anual

- GIVEN una suscripción activa con `planType = 'business_pro'` y `planEndDate = 2026-09-01`
- WHEN se compra el mismo plan (`planType = 'business_pro'`) con `period = 'annual'`
- THEN `planEndDate` se extiende 365 días: `planEndDate = 2027-09-01`

#### Scenario: Comprar un plan diferente (upgrade o downgrade)

- GIVEN una suscripción activa con `planType = 'emprendedor'` y `planEndDate = 2026-08-15`
- WHEN se compra `planType = 'business_pro'` con `period = 'monthly'`
- THEN `planEndDate = ahora + 30 días` (reinicio, sin prorrateo)
- AND `planStartDate = ahora`

#### Scenario: Primera compra sin suscripción previa

- GIVEN un negocio sin suscripción activa previa
- WHEN se compra cualquier plan con `period = 'monthly'`
- THEN `planStartDate = ahora` y `planEndDate = ahora + 30 días`

---

## 4. remaining-time-display — Visualización precisa del tiempo restante

### Requirement: SCD-004 — getRemainingTime con cálculo exacto

La función `getRemainingTime` MUST retornar una representación exacta en meses y días en vez de usar `Math.round`. No SHALL redondear meses hacia arriba ni perder días restantes.

#### Scenario: planEndDate es null

- GIVEN `planEndDate = null`
- WHEN `getRemainingTime(null)` es invocada
- THEN retorna `null`

#### Scenario: planEndDate está vencido

- GIVEN `planEndDate` es una fecha en el pasado
- WHEN `getRemainingTime(fechaPasada)` es invocada
- THEN retorna `"Vencido"`

#### Scenario: 65 días restantes

- GIVEN `planEndDate` está a 65 días en el futuro
- WHEN `getRemainingTime(fecha65dias)` es invocada
- THEN retorna `"2 meses y 5 días"`

#### Scenario: 7 días restantes

- GIVEN `planEndDate` está a 7 días en el futuro
- WHEN `getRemainingTime(fecha7dias)` es invocada
- THEN retorna `"7 días restantes"`

#### Scenario: 30 días restantes

- GIVEN `planEndDate` está a 30 días en el futuro
- WHEN `getRemainingTime(fecha30dias)` es invocada
- THEN retorna `"1 mes"`

#### Scenario: 1 día restante

- GIVEN `planEndDate` está a 1 día en el futuro
- WHEN `getRemainingTime(fecha1dia)` es invocada
- THEN retorna `"1 día restante"`
