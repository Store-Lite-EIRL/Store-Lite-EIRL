# Design: fix-plan-subscription-expiration

## Technical Approach

Cinco puntos de cambio, todos en código existente o archivos nuevos dentro de los patrones actuales del proyecto. No se requieren migraciones ni nuevas dependencias. El core del diseño es: **verificar expiración en dos capas** — `getBusinessEntitlements` en reads (JS-level check sobre `planEndDate`) y `expireSubscriptions` en background (UPDATE masivo). El prorrateo se resuelve con una lectura previa al UPSERT.

## Architecture Decisions

| Decisión | Opciones | Elegida | Rationale |
|----------|----------|---------|-----------|
| SCD-001: Cómo verificar expiración | A: filtro SQL (`planEndDate > now()`); B: fetch + JS check | **Opción B** | Más explícito, permite loggear degradaciones, más fácil de testear con fechas mockeadas |
| SCD-002: Dónde ubicar expireSubscriptions | A: dentro de route.ts; B: archivo separado en `src/core/entitlements/` | **Opción B** | Cohesión con el módulo de entitlements, reutilizable desde cron/server-action/init |
| SCD-003: Cómo leer suscripción antes del UPSERT | A: query aparte; B: reusar `returning` de PostgreSQL | **Opción A** | El UPSERT no devuelve el estado anterior; necesitamos la suscripción PREVIA para calcular prorrateo |
| SCD-004: Cálculo de tiempo restante | A: librería date-fns; B: `Math.floor` + `%` nativo | **Opción B** | Sin dependencias nuevas, operación trivial, alineado con el budget del proyecto |

## Data Flow

```
POST /api/billing/purchase-plan
  │
  ├─ 1. Validar request + cobrar Culqi
  ├─ 2. Leer suscripción actual (businessId, planStatus='active')
  │     ├─ Si misma planType → prorratear: base = max(planEndDate, now)
  │     └─ Si diferente planType o null → reiniciar desde now
  ├─ 3. INSERT plan_payments + UPSERT business_subscriptions
  └─ 4. Retornar { planActivatedUntil }


getBusinessEntitlements(businessId)
  │
  ├─ Fetch subscription (planType, planEndDate, planStatus)
  ├─ planStatus !== 'active' OR planEndDate < now() → DEFAULT_PLAN
  └─ planStatus === 'active' AND planEndDate >= now() → plan contratado


expireSubscriptions()  ← Vercel Cron / server action
  │
  └─ UPDATE SET planStatus='inactive' WHERE planEndDate < now() AND planStatus='active'


SettingsClient.getRemainingTime(planEndDate)
  │
  ├─ planEndDate === null → null
  ├─ diff <= 0 → "Vencido"
  ├─ days >= 30 → `${months} mes(es) y ${remainingDays} día(s)`
  └─ days < 30 → `${days} día(s) restante(s)`
```

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `src/core/entitlements/getBusinessEntitlements.ts` | Modificar | Agregar `planEndDate` al SELECT, verificar expiración en JS |
| `src/core/entitlements/expireSubscriptions.ts` | Crear | Función para expirar suscripciones vencidas masivamente |
| `src/core/entitlements/index.ts` | Modificar | Exportar `expireSubscriptions` |
| `app/api/billing/purchase-plan/route.ts` | Modificar | Leer suscripción actual antes del UPSERT, aplicar prorrateo |
| `app/[slug]/settings/components/SettingsClient.tsx` | Modificar | `getRemainingTime` con `Math.floor + %` exactos |

## Interfaces / Contracts

```ts
// expireSubscriptions.ts — nueva exportación
export async function expireSubscriptions(): Promise<{ expired: number }>
```

Sin cambios en interfaces existentes. `getBusinessEntitlements` mantiene su firma `(businessId: string) => Promise<BusinessEntitlements>`.

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|-----------|------|
| Unit | `getBusinessEntitlements` con fecha vigente, vencida, sin suscripción | Mockear `db.query`, fechas fijas con `vi.setSystemTime` |
| Unit | `expireSubscriptions` idempotente, sin efectos colaterales | Mockear `db.update`, verificar WHERE generado |
| Integration | Purchase-plan con prorrateo: mismo plan, upgrade, primera compra | Test del endpoint con base de datos de prueba |
| Unit | `getRemainingTime`: 65d, 30d, 7d, 1d, null, vencido | Función pura, sin dependencias externas |

## Concurrency

- **Purchase-plan prorrateo**: El read-then-write entre leer la suscripción actual y hacer el UPSERT tiene una race condition si dos requests del mismo negocio ocurren simultáneamente. Recomendación: **envolver en transacción DB** (`db.transaction(...)`). Esto no requiere cambios de esquema.
- **expireSubscriptions**: Sin problemas de concurrencia — actualiza filas que cumplen condiciones, es idempotente.

## Migration / Rollout

No se requiere migración de datos. Rollout inmediato vía deploy. Rollback: revertir commit. Si expireSubscriptions marca suscripciones incorrectamente como inactive, restaurar vía SQL manual.

## Open Questions

- [ ] ¿Debemos loggear (console.warn) cuando `getBusinessEntitlements` degrada a Free por expiración? Recomendado para debugging.
- [ ] ¿Configurar Vercel Cron Job ahora o en ticket separado? `expireSubscriptions` queda invocable manualmente.
