# Proposal: fix-plan-subscription-expiration

## Intent

Las suscripciones pagadas nunca expiran. `getBusinessEntitlements` solo verifica `planStatus = 'active'` sin chequear `planEndDate`, por lo que un plan vencido sigue otorgando acceso completo. Además, al renovar el mismo plan, el UPSERT reinicia las fechas desde hoy sin prorratear los días restantes del período anterior. Esto genera pérdida de días pagados y ausencia total de expiración automática.

## Scope

### In Scope

- Verificación de `planEndDate` en `getBusinessEntitlements` — degradar a Free si la fecha ya pasó
- Función `expireSubscriptions()` para expirar suscripciones vencidas vía cron/trigger
- Prorrateo en UPSERT de `purchase-plan`: sumar días restantes al renew del mismo plan
- Mejora en `getRemainingTime`: mostrar días exactos en lugar de meses redondeados

### Out of Scope

- Tablas o columnas nuevas de DB (no requiere migración)
- Degradación de funcionalidades parciales (todo o nada: plan vigente o Free)
- UI de advertencia de expiración próxima (deferido)
- Mock de desarrollo (`app/pricing/actions.ts`)

## Capabilities

### New Capabilities

- `subscription-expiration`: Mecanismo que degrada negocios a plan Free automáticamente cuando `planEndDate` ha expirado

### Modified Capabilities

- None — los cambios son de implementación, no alteran contratos de especificación existentes

## Approach

1. **`getBusinessEntitlements.ts`**: Agregar filtro `planEndDate > now()` al WHERE, además de `planStatus = 'active'`. Si no hay suscripción vigente, retorna plan Free con entitlements por defecto.
2. **`expireSubscriptions.ts`** (nuevo): UPDATE `businessSubscriptions` SET `planStatus = 'inactive'` WHERE `planEndDate < now()` AND `planStatus = 'active'`. Invocable desde cron (Vercel Cron Jobs) o server action manual.
3. **`purchase-plan/route.ts`**: En el `onConflictDoUpdate`, leer la suscripción existente primero. Si existe y el plan es el mismo, sumar `PERIOD_DAYS[period]` al `planEndDate` existente en vez de pisar desde hoy. Si es un upgrade/downgrade (plan diferente), reiniciar fechas.
4. **`SettingsClient.tsx`**: Replace `Math.round(days / 30)` with exact calculation: `Math.floor(days / 30)` meses + `days % 30` días restantes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/entitlements/getBusinessEntitlements.ts` | Modified | Agregar filtro de `planEndDate` en query |
| `src/core/entitlements/expireSubscriptions.ts` | New | Función para expirar suscripciones vencidas |
| `app/api/billing/purchase-plan/route.ts` | Modified | Prorrateo en UPSERT del mismo plan |
| `app/[slug]/settings/components/SettingsClient.tsx` | Modified | Cálculo exacto de tiempo restante |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Degradación incorrecta a Free para negocios activos | Medium | Tests unitarios sobre `getBusinessEntitlements` con fechas límite |
| Prorrateo puede extender plan más de lo esperado si hay renews múltiples | Low | Capturar `planEndDate` actual antes del UPSERT, comparar contra hoy |
| Dependencias existentes de `getBusinessEntitlements` se rompen | Medium | Auditoría de todos los consumers (server actions, layouts, API routes) |

## Rollback Plan

Revert commit del cambio. Si hay datos corruptos (suscripciones expiradas incorrectamente), volver a setear `planStatus = 'active'` manualmente vía SQL. La función `expireSubscriptions` es idempotente — ejecutarla de nuevo no causa daño.

## Dependencies

- Ninguna (sin nuevos paquetes, sin migraciones)
- Opcional: Vercel Cron Jobs para invocar `expireSubscriptions` periódicamente

## Success Criteria

- [ ] Suscripción con `planEndDate` vencido retorna entitlements de Free en `getBusinessEntitlements`
- [ ] `expireSubscriptions()` marca como `inactive` todas las suscripciones vencidas
- [ ] Renovar el mismo plan suma días al `planEndDate` existente en vez de reiniciar
- [ ] `getRemainingTime` muestra "2 meses y 5 días" en vez de "2 meses" para 65 días
- [ ] Todos los tests unitarios existentes pasan
