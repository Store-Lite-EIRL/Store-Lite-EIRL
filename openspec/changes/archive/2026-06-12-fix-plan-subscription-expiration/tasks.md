# Tasks: fix-plan-subscription-expiration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~115 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

---

## Fase 1: Core — expireSubscriptions (nuevo archivo)

- [x] 1.1 Crear `src/core/entitlements/expireSubscriptions.ts`: función que ejecuta `UPDATE businessSubscriptions SET planStatus = 'inactive' WHERE planEndDate < now() AND planStatus = 'active'` usando Drizzle, retorna `{ expired: number }`
- [x] 1.2 Agregar test unitario para `expireSubscriptions()`: mockear `db.update`, verificar idempotencia y que no toca suscripciones vigentes (SCD-002)

## Fase 2: Core — getBusinessEntitlements + export

- [x] 2.1 Modificar `src/core/entitlements/getBusinessEntitlements.ts`: agregar `planEndDate` al SELECT del subscription query
- [x] 2.2 Agregar verificación JS post-fetch: si `planEndDate < now()` o no hay suscripción activa → retornar `DEFAULT_PLAN` con `console.warn` opcional (SCD-001)
- [x] 2.3 Agregar test unitario: `getBusinessEntitlements` con fecha vigente, vencida, sin suscripción, e inactive (SCD-001 escenarios GWT)
- [x] 2.4 Modificar `src/core/entitlements/index.ts`: agregar `export { expireSubscriptions }`

## Fase 3: Integración — purchase-plan prorrateo

- [x] 3.1 Modificar `app/api/billing/purchase-plan/route.ts`: leer suscripción activa actual del negocio antes del bloque de UPSERT
- [x] 3.2 Agregar lógica de prorrateo: si `planType` coincide y `planEndDate` existe → extender desde `planEndDate` actual; si es diferente plan → reiniciar desde hoy; mantener `planStartDate` original en renovación (SCD-003)
- [x] 3.3 Envolver read-then-write en transacción DB (`db.transaction(...)`) para evitar race conditions
- [x] 3.4 Agregar test de integración: mismo plan (mensual/anual), upgrade/downgrade, primera compra (SCD-003 escenarios GWT)

## Fase 4: UI — getRemainingTime exacto

- [x] 4.1 Modificar `app/[slug]/settings/components/SettingsClient.tsx`: reemplazar `Math.round(days / 30)` con `Math.floor(days / 30)` meses + `days % 30` días; manejar edge cases: solo meses, solo días, menos de 30 días, 1 día, null, vencido (SCD-004)
- [x] 4.2 Agregar test unitario para `getRemainingTime`: 65d, 30d, 7d, 1d, null, fecha vencida (SCD-004 escenarios GWT)
