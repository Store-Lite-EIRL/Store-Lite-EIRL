# 🏗️ Store Lite: Backlog de Refactorización y Mejora

Este backlog se genera a partir de la auditoría profunda realizada el 21 de abril de 2026.

## 🔴 PRIORIDAD: EMERGENCIA (Seguridad y Estabilidad) - [Calidad Actual: 48%]

### 1. Blindaje de Entradas (Zod)

- [ ] **Implementar Esquemas de Validación**:
  - _Problema_: 0% de uso de Zod en acciones de servidor.
  - _Acción_: Crear `src/features/<feature>/schemas.ts` y validar TODAS las entradas en `app/actions/` y `app/api/`.
  - _Riesgo_: Inyección de datos maliciosos, errores en runtime no controlados.

### 2. Eliminación de Fugitividad de Tipos (`as any`)

- [ ] **Remover Type Assertions**:
  - _Problema_: 16 usos de `as any` detectados.
  - _Acción_: Definir interfaces correctas para `permissions`, `Culqi`, y eventos de UI.
- [ ] **Catch Blocks a `unknown`**: Reemplazar `catch (error: any)` por `catch (error: unknown)` + Type Guard.

### 3. Saneamiento de Logs y Seguridad

- [ ] **Limpieza de `console.log`**:
  - _Problema_: 29 logs activos, algunos con info sensible (tokens de pago).
  - _Acción_: Eliminar todos los logs de debug y usar un logger centralizado (Sentry/Winston) solo para errores.

## 🚨 Prioridad ALTA: Estructural

### 4. Desmembramiento de Monolitos

- [ ] **Refactor de `app/actions/team.ts` (870 líneas)**: Dividir en acciones atómicas en `src/features/team/actions/`.
- [ ] **Refactor de `app/api/payment/charge/route.ts`**: Mover lógica de cobro y actualización de stock a servicios en `src/features/billing/services/`.

### 5. Saneamiento de `app/[slug]`

- [ ] **Eviccionar Lógica de Negocio de `app/[slug]`**: Mover `payment`, `product`, `chat`, `settings` a `src/features/`.
- [ ] **Refactor de `BusinessPageContent.tsx` (26KB)**: Dividir en componentes atómicos.

## 🟡 Prioridad MEDIA: Convenciones

### 6. Normalización y Limpieza

- [ ] **Corregir nombres de archivos**: `CreateBusiness.ts` -> `create-business.ts`.
- [ ] **Eliminar Demos**: Borrar `MaterialDemo.tsx`, `AllMaterialComponents.tsx`, `MenuDemos.tsx` de la estructura de producción.
- [ ] **Corregir Event Handlers**: Tipar correctamente los eventos en `ThemeSettings.tsx` (reemplazar `as any`).

---

_Nota: La Calidad Global del 48% indica que la deuda técnica está superando la capacidad de entrega. Se recomienda detener nuevas features hasta limpiar los puntos 1, 2 y 3._
