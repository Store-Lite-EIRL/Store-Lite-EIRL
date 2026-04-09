# Guía de Entitlements por Plan de Negocio

> **Referencia de arquitectura** — leer antes de implementar cualquier feature que dependa del plan de suscripción.

---

## ¿Qué es el sistema de entitlements?

Es la **única fuente de verdad** que determina qué puede hacer cada negocio según su plan. El servidor calcula los permisos, el cliente solo renderiza.

```
DB (business_subscriptions)
        ↓
getBusinessEntitlements(businessId)   ← único punto de cálculo
        ↓
layout.tsx (Server Component)
        ↓
BusinessEntitlementsContext           ← distribuye al cliente
        ↓
useEntitlements()                     ← en cualquier componente
```

---

## Archivos clave

| Archivo                                              | Propósito                          |
| ---------------------------------------------------- | ---------------------------------- |
| `src/core/entitlements/plans.ts`                     | Define los límites de cada plan    |
| `src/core/entitlements/getBusinessEntitlements.ts`   | Consulta DB y calcula entitlements |
| `app/[slug]/context/BusinessEntitlementsContext.tsx` | Context + hook `useEntitlements()` |

---

## ¿Cómo agregar una nueva validación por plan?

### Paso 1 — Declarar el feature en `plans.ts`

```ts
// src/core/entitlements/plans.ts
export interface BusinessEntitlements {
  // ...existentes...
  canUseNewFeature: boolean;   // ← agregar aquí
}

export const PLAN_ENTITLEMENTS = {
  basico:        { ..., canUseNewFeature: false },
  emprendedor:   { ..., canUseNewFeature: false },
  business_pro:  { ..., canUseNewFeature: true  },
  enterprise_ai: { ..., canUseNewFeature: true  },
};
```

### Paso 2 — Usar en el componente UI

```tsx
// En cualquier Client Component dentro de app/[slug]/
const { canUseNewFeature } = useEntitlements();

return canUseNewFeature ? <NewFeature /> : <UpgradePrompt />;
```

### Paso 3 — Proteger en el Server Action

```ts
// app/[slug]/alguna-feature/actions.ts
'use server';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';

export async function doSomething(businessId: string) {
  const entitlements = await getBusinessEntitlements(businessId);
  if (!entitlements.canUseNewFeature) {
    return { success: false, error: 'Tu plan no incluye esta funcionalidad.' };
  }
  // ...lógica real
}
```

**Eso es todo.** Nunca tocar el contexto, ni el layout, ni la DB.

---

## Reglas de oro

1. **El servidor valida, el cliente renderiza.** Nunca usar `useEntitlements()` como única protección para una acción de escritura.
2. **Un solo lugar para cambiar límites:** `PLAN_ENTITLEMENTS` en `plans.ts`. No hardcodear límites en componentes o actions.
3. **`getBusinessEntitlements` es server-only.** Importarlo solo en Server Components, layouts, o Server Actions. Nunca en `'use client'`.
4. **Siempre incluir Server Action guard.** Un usuario malicioso puede llamar actions directamente. La validación en el servidor es la real.
5. **`maxProducts: -1` significa ilimitado.** Respetar esta convención al comparar.

---

## Planes actuales

| Plan            | Gateway de pago | Máx productos | Importación | IA  | Dashboard | Equipo |
| --------------- | :-------------: | :-----------: | :---------: | :-: | :-------: | :----: |
| `basico`        |        ✗        |      50       |      ✗      |  ✗  |     ✗     |   1    |
| `emprendedor`   |        ✓        |      150      |      ✓      |  ✗  |     ✓     |   3    |
| `business_pro`  |        ✓        |      300      |      ✓      |  ✓  |     ✓     |   2    |
| `enterprise_ai` |        ✓        |       ∞       |      ✓      |  ✓  |     ✓     |   5    |

> Para actualizar estos valores, editar únicamente `PLAN_ENTITLEMENTS` en `src/core/entitlements/plans.ts`.

---

## Agregar un plan nuevo a futuro

1. Añadir el plan al enum en `src/core/database/schema.ts` (`subscriptionPlanEnum`).
2. Agregar una entrada en `PLAN_ENTITLEMENTS` en `plans.ts`.
3. Añadir el plan al tipo `PlanType` en `plans.ts`.
4. Crear la migración de DB correspondiente.

El resto del sistema lo detecta automáticamente.
