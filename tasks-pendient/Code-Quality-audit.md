# 🔍 Auditoría de Calidad de Código — Store_Lite

> **Fecha:** Abril 2026 | **Scope:** Análisis completo del proyecto (`src/`, `app/`, configuraciones)
> **Stack:** Next.js 16 · React 19 · TypeScript · Drizzle ORM · Supabase

---

## 📊 Resumen Ejecutivo

| Categoría                       | Estado     | Severidad  |
| ------------------------------- | ---------- | ---------- |
| Código limpio                   | ⚠️ Parcial | MEDIA      |
| Tamaño de archivos (≤120 loc)   | ❌ Falla   | ALTA       |
| Modularización por lógica       | ⚠️ Parcial | MEDIA      |
| Nomenclatura de funciones/vars  | ⚠️ Parcial | BAJA-MEDIA |
| Prettier / ESLint               | ❌ Falla   | ALTA       |
| Separación de responsabilidades | ❌ Falla   | ALTA       |

---

## 🐛 Problemas Detectados

---

### 🔴 CRÍTICO — Archivos masivos que violan la regla de 120 líneas

---

#### TAREA-01 · `app/[slug]/BusinessPageContent.tsx` — 643 líneas

**Problema:**
Un único archivo client-side maneja la lógica de negocio, el estado de filtros, el estado de modales, el renderizado del storefront, el mapeo de productos, y encima define 3 componentes distintos (`BusinessPageContent`, `BusinessPageContentUI`, `StorefrontProductGridSection`).

**Solución — Estructura propuesta:**

```
app/[slug]/
├── BusinessPageContent.tsx                    ← Orquestador (solo composición, ~50 líneas)
├── components/
│   ├── StorefrontProductGridSection.tsx        ← Extraer (líneas 438-642)
│   └── StorefrontThemeApplier.tsx              ← Extraer iife themeStyles (líneas 331-371)
├── hooks/
│   └── useBusinessPageState.ts                ← Extraer useState + handlers (líneas 142-276)
└── mappers/
    └── productMappers.ts                      ← Extraer mapToStorageProduct (líneas 55-71)
```

- [ ] Extraer `StorefrontProductGridSection` a su propio archivo
- [ ] Extraer `useBusinessPageState` con todos los `useState` y handlers
- [ ] Extraer `mapToStorageProduct` a `mappers/productMappers.ts`
- [ ] Extraer la lógica de `themeStyles` (IIFE) a función pura en `src/core/storefront/themeUtils.ts`

---

#### TAREA-02 · `app/actions/team.ts` — 872 líneas

**Problema:**
Un único Server Action contiene 2 helpers de autenticación (duplicados), helpers de generación de código, hash criptográfico, y ~10 acciones de servidor distintas. Viola completamente SRP (Single Responsibility Principle).

**Solución — Estructura propuesta:**

```
app/actions/
└── team/
    ├── index.ts                    ← Re-exports públicos
    ├── team.types.ts               ← ActionState, TeamMember, InvitationInfo
    ├── auth.helpers.ts             ← assertOwnership + createUserAuthClient
    ├── invitation.actions.ts       ← generateInvitationCode, getInvitationCode, revokeInvitationCode
    ├── member.actions.ts           ← getTeamMembers, removeTeamMember, leaveTeam, joinTeam
    └── permissions.actions.ts     ← updateMemberPermissions, updateRolePermissions, updateMemberRole
```

- [ ] Crear `team.types.ts` con los tipos compartidos
- [ ] Crear `auth.helpers.ts` reutilizando el `assertOwnership` ya existente
- [ ] Separar acciones de invitaciones en `invitation.actions.ts`
- [ ] Separar acciones de miembros en `member.actions.ts`
- [ ] Separar acciones de permisos en `permissions.actions.ts`

---

#### TAREA-03 · `app/[slug]/settings/actions.ts` — 423 líneas

**Problema:**
Un archivo mezcla acciones de business settings, slug, SEO, storefront layout, storefront theme y Culqi credentials sin ninguna separación por dominio.

**Solución — Estructura propuesta:**

```
app/[slug]/settings/actions/
├── index.ts                        ← Re-exports
├── business.actions.ts             ← updateBusinessSlug, toggleBusinessActive
├── seo.actions.ts                  ← updateBusinessSEO
├── storefront.actions.ts           ← updateStorefrontLayout, updateStorefrontTheme, clearStorefrontTheme
└── payment.actions.ts              ← updateCulqiCredentials
```

- [ ] Separar en 4 archivos por dominio funcional
- [ ] Crear `index.ts` que re-exporte todo para no romper imports existentes

---

#### TAREA-04 · `app/actions/business.ts` — 381 líneas

**Problema:**
Mezcla lógica de logos, portadas (covers), y helpers de infraestructura. Los helpers `createAdminStorageClient` y `createUserAuthClient` están **duplicados exactamente** en `team.ts`.

**Solución — Estructura propuesta:**

```
app/actions/
├── _shared/
│   ├── supabase.helpers.ts         ← createAdminStorageClient + createUserAuthClient (DRY único)
│   └── authz.helpers.ts            ← assertBusinessOwnershipOrFail
└── business/
    ├── index.ts
    ├── logo.actions.ts             ← updateBusinessLogo, removeBusinessLogo
    ├── cover.actions.ts            ← updateBusinessCover, removeBusinessCover
    └── data.actions.ts             ← updateBusinessData
```

- [ ] Centralizar helpers de Supabase en `_shared/supabase.helpers.ts`
- [ ] Separar acciones por dominio (logo, cover, data)

---

#### TAREA-05 · `useHeroController.ts` — 328 líneas | `FeaturedItems.tsx` — 291 líneas

**Solución para `useHeroController.ts`:**

```
app/(main)/home/
└── hooks/
    ├── useHeroController.ts        ← Solo orquestador (~80 líneas)
    ├── useHeroDrag.ts              ← Estado y handlers de drag (mouseDown/Move/Up, position)
    └── useHeroUpload.ts            ← uploadCover, handleSave, processHeroImage (canvas logic)
```

**Solución para `FeaturedItems.tsx`:**

```
app/(main)/home/
├── FeaturedItems.tsx               ← Solo contenedor (~60 líneas)
├── components/
│   ├── CategoryItem.tsx            ← CategoryItem + CategoryCardContent
│   └── EmptyCategorySlot.tsx       ← Slot vacío con botón add
└── hooks/
    └── useFeaturedItems.ts         ← handleSaveCategory, handleSaveNewCategory, items state
```

- [ ] Extraer lógica de drag en `useHeroDrag.ts`
- [ ] Extraer lógica de upload/canvas en `useHeroUpload.ts`
- [ ] Extraer componentes de categoría a sus propios archivos
- [ ] Extraer hook `useFeaturedItems` con el estado y handlers

---

### 🔴 CRÍTICO — Código duplicado (DRY violado)

---

#### TAREA-06 · `ActionState` interface duplicada en 4 archivos

**Problema:**
La misma interfaz está definida localmente en `business.ts`, `team.ts`, `CreateBusiness.ts` y `settings/actions.ts`.

**Solución:**

```typescript
// src/types/actions.ts  ← [NUEVO — fuente única de verdad]
export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  url?: string;
}
```

- [ ] Crear `src/types/actions.ts` con la interfaz centralizada
- [ ] Actualizar todos los archivos para importar desde ahí
- [ ] Eliminar las 4 definiciones locales duplicadas

---

#### TAREA-07 · `createUserAuthClient` + `createAdminClient` duplicados en `business.ts` y `team.ts`

**Problema:**
La función `createUserAuthClient` está copiada letra por letra en ambos archivos (12 líneas exactas). `createAdminStorageClient` y `createAdminClient` son variantes del mismo patrón.

**Solución:** Ver TAREA-04 — centralizar en `app/actions/_shared/supabase.helpers.ts`.

- [ ] Crear el archivo `_shared/supabase.helpers.ts`
- [ ] Reemplazar las copias locales por la importación compartida

---

#### TAREA-08 · Bloque de verificación de ownership duplicado 3 veces en `business.ts`

**Problema:**
En `business.ts`, el bloque de `getUser()` + verificar `ownerId` se repite inline en `updateBusinessLogo`, `updateBusinessData` y `updateBusinessCover`, en lugar de usar `assertBusinessOwnershipOrFail` que ya existe al final del mismo archivo.

**Solución:**

```typescript
// ✅ Aplicar assertBusinessOwnershipOrFail consistentemente en las 3 funciones
const authCheck = await assertBusinessOwnershipOrFail(businessId);
if (authCheck.error) return { error: authCheck.error };
```

- [ ] Refactorizar las 3 funciones para usar `assertBusinessOwnershipOrFail`
- [ ] Eliminar los 3 bloques inline duplicados

---

### 🟠 ALTA — console.warn usado como logging de producción

---

#### TAREA-09 · 12 `console.warn` de debug en `updateBusinessCover` (business.ts)

**Problema:**
La función `updateBusinessCover` tiene 12 traces de depuración con `console.warn` que nunca se limpiaron. Estos llegan a producción, contaminar los logs y son un code smell grave.

```typescript
// ❌ MAL — 12 traces de debug sin limpiar
console.warn('[updateBusinessCover] Starting upload:', { ... });
console.warn('[updateBusinessCover] User authenticated:', user.id);
console.warn('[updateBusinessCover] Listing existing files to delete...');
// ... y 9 más exactamente iguales
```

**Solución — Crear logger condicional:**

```typescript
// src/lib/logger.ts  ← [NUEVO]
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (isDev) console.warn(`[DEBUG] ${msg}`, data ?? '');
  },
  error: (context: string, error: unknown) => {
    console.error(`[${context}]`, error);
  },
};
```

- [ ] Crear `src/lib/logger.ts` con el logger condicional
- [ ] Eliminar los 12 `console.warn` de debug en `updateBusinessCover`
- [ ] Reemplazar por `logger.debug()` donde corresponda

---

#### TAREA-10 · console.warn de debug en `useHeroController.ts`

**Problema:**
6 traces de debug con `console.warn` y `console.error` que son artefactos de desarrollo.

**Solución:**

- [ ] Reemplazar por `logger.debug()` del mismo logger de TAREA-09
- [ ] El `console.warn('[Hero] Syncing state from props')` y `'Skipping sync...'` son noise puro en producción

---

### 🟠 ALTA — `catch (error: any)` viola TypeScript estricto

---

#### TAREA-11 · `error: any` en catch blocks de `settings/actions.ts` y `team.ts`

**Problema:**

```typescript
// ❌ Desactiva completamente el type-checking de TypeScript
} catch (error: any) {
  return { success: false, error: error.message || 'No autorizado' }
}

// También en team.ts:
customPermissions: permissions as any  // ← type assertion sin justificación
```

**Solución:**

```typescript
// ✅ Type-safe — nunca usar any en catch
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'No autorizado';
  return { success: false, error: message };
}
```

- [ ] Reemplazar todos los `catch (error: any)` por `catch (error: unknown)` + narrowing
- [ ] Tipar `customPermissions` correctamente en el schema de Drizzle o usar `as string[]` en vez de `as any`

---

### 🟡 MEDIA — Nomenclatura inconsistente

---

#### TAREA-12 · `_id` como prop no utilizada en `CategoryItem` (FeaturedItems.tsx)

**Problema:**

```typescript
// ❌ _id nunca se referencia en el cuerpo de la función
function CategoryItem({
  _id,   // ← prop inútil, nunca usada
  name,
  ...
}: CategoryItemProps & { _id?: string })
```

La interfaz `CategoryItemProps` ya tiene `id: string`. El `_id` es ruido.

**Solución:**

- [ ] Eliminar `_id` de la desestructuración
- [ ] Usar directamente `id` de `CategoryItemProps`

---

#### TAREA-13 · Mezcla de idiomas en mensajes de error

**Problema:**

```typescript
// ❌ CreateBusiness.ts línea 33 — en inglés cuando todo lo demás es español
return { error: 'Unauthorized' };

// ❌ Línea 54
console.warn('Profile missing for user, creating one...', userId);
```

**Solución:**

```typescript
// ✅ Consistente en español
return { error: 'No autorizado. Por favor, iniciá sesión.' };
```

- [ ] Buscar todos los mensajes de error en inglés y traducirlos al español
- [ ] Definir una convención: los mensajes de usuario SIEMPRE en español

---

#### TAREA-14 · Nombre de archivo `CreateBusiness.ts` inconsistente con los demás

**Problema:**
Los server actions en `app/actions/` usan `camelCase` (`business.ts`, `team.ts`) pero `CreateBusiness.ts` usa `PascalCase`. ESLint tiene `unicorn/filename-case` configurado — ambos son válidos según la regla, pero la inconsistencia dentro de la misma carpeta es un problema de convención del proyecto.

**Solución:**

- [ ] Renombrar `CreateBusiness.ts` → `createBusiness.ts`
- [ ] Actualizar todos los imports que referencien ese archivo

---

### 🟡 MEDIA — Separación de responsabilidades en componentes

---

#### TAREA-15 · `mapToStorageProduct` definida en un componente React y duplicada

**Problema:**
La función de mapeo `mapToStorageProduct` (líneas 55-71) está definida en un componente UI. Su lógica se **repite inline** en las líneas 85-101 dentro de `BusinessPageContentUI` como el bloque `mappedProducts`.

```typescript
// ❌ Misma transformación, dos veces, en el mismo archivo
const mapToStorageProduct = (product: ProductWithRelations): StorageProduct => ({ ... });
// ... y luego:
const mappedProducts: StorageProduct[] = products.map((p) => ({
  // exactamente lo mismo de nuevo
}));
```

**Solución:**

- [ ] Extraer a `app/[slug]/mappers/productMappers.ts`
- [ ] Usar la misma función en ambos lugares (eliminar duplicado)

---

#### TAREA-16 · Importaciones relativas profundas en `FeaturedItems.tsx`

**Problema:**

```typescript
// ❌ Ruta relativa frágil — se rompe si el archivo se mueve
import { createCategory, updateCategory } from '../../[slug]/storage/actions';
const { uploadCategoryImage } = await import('../../[slug]/storage/services/storageService');
```

**Solución:**

- [ ] Usar path aliases (`@/`) configurados en `tsconfig.json`
- [ ] Considerar mover `storage` a `src/features/` si es lógica compartida

---

#### TAREA-17 · IIFE de 40 líneas para `themeStyles` dentro de un componente

**Problema:**

```typescript
// ❌ IIFE de 40 líneas, imposible de testear en aislamiento
const themeStyles = storefrontTheme
  ? ((): CSSProperties & Record<string, string> => {
      const ff = storefrontTheme.fontFamily === 'roboto' ? '...' : ...;
      // 37 líneas más de CSS custom properties hardcodeadas
    })()
  : undefined;
```

**Solución:**

```typescript
// src/core/storefront/themeUtils.ts  ← [NUEVO — función pura, testeable]
export function buildStorefrontThemeStyles(
  theme: StorefrontTheme,
): CSSProperties & Record<string, string> {
  // lógica aquí
}

// En el componente:
const themeStyles = storefrontTheme ? buildStorefrontThemeStyles(storefrontTheme) : undefined;
```

- [ ] Crear `src/core/storefront/themeUtils.ts`
- [ ] Extraer la lógica del IIFE a `buildStorefrontThemeStyles`
- [ ] El componente queda con 1 línea en vez de 40

---

### 🟡 MEDIA — ESLint / Prettier

---

#### TAREA-18 · No hay verificación comprobada de que Prettier corra en pre-commit

**Problema:**
`prettier/prettier: 'off'` en ESLint es correcto cuando Prettier es formatter separado (no integrado en ESLint). Pero si el pre-commit hook no corre `format:check`, un dev puede subir código mal formateado y ESLint no lo atrapará.

**Acción:**

- [ ] Verificar `.husky/pre-commit` — debe incluir `pnpm format:check` o `pnpm lint`
- [ ] Si no está: agregar el check de Prettier al pre-commit hook

---

#### TAREA-19 · `max-lines` y `max-lines-per-function` desactivadas en ESLint

**Problema:**

```javascript
// ❌ eslint.config.mjs líneas 133-134
// ESLint nunca avisa cuando un archivo explota de tamaño
'max-lines': 'off',
'max-lines-per-function': 'off',
```

**Solución:**

```javascript
// ✅ ESLint te avisa automáticamente si alguien rompe la regla
'max-lines': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
```

- [ ] Activar `max-lines` y `max-lines-per-function` en `eslint.config.mjs`
- [ ] Correr `pnpm lint` para ver todos los archivos que fallan (van a ser muchos actualmente)

> ⚠️ **Este es el cambio más importante de la auditoría.** Con 2 líneas de config, el linter empieza a detectar automáticamente todas las violaciones futuras.

---

#### TAREA-20 · Indentación inconsistente en `middleware.ts`

**Problema:**
Las líneas 59-70 tienen indentación mezclada (2 y 4 espacios). El bloque `else` está separado del `}` anterior. Claro síntoma de que Prettier no corrió sobre ese archivo.

**Solución:**

```bash
# ✅ Automático
pnpm format
```

- [ ] Correr `pnpm format` sobre el proyecto completo

---

### 🟢 BAJA — Mejoras de seguridad y UX

---

#### TAREA-21 · `Math.random()` para generar códigos de invitación (seguridad)

**Problema:**
`sonarjs/pseudo-random` debería disparar en `team.ts` líneas 82-88. `Math.random()` no es apto para tokens de seguridad — es predecible.

```typescript
// ❌ Math.random() no es criptográficamente seguro
result += chars.charAt(Math.floor(Math.random() * chars.length));
```

**Solución:**

```typescript
// ✅ Web Crypto API — ya disponible (usada en hashCode() del mismo archivo)
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.getRandomValues(new Uint8Array(8));
  const part1 = Array.from(randomBytes.slice(0, 4))
    .map((b) => chars[b % chars.length])
    .join('');
  const part2 = Array.from(randomBytes.slice(4, 8))
    .map((b) => chars[b % chars.length])
    .join('');
  return `${part1}-${part2}`;
}
```

- [ ] Reemplazar `Math.random()` por `crypto.getRandomValues()`

---

#### TAREA-22 · `alert()` nativo en `FeaturedItems.tsx`

**Problema:**

```typescript
// ❌ alert() es blocking, no estilizable, terrible UX
alert('Error en el servidor: ' + (error instanceof Error ? error.message : String(error)));
```

El proyecto ya tiene `AlertSnackbar` component disponible.

**Solución:**

- [ ] Reemplazar ambos `alert()` (líneas 202 y 252) con el sistema de snackbar existente
- [ ] O propagar el error al padre mediante un callback `onError`

---

#### TAREA-23 · `db.insert(profiles)` sin try/catch en `CreateBusiness.ts`

**Problema:**
En `CreateBusiness.ts` línea 55, el insert de perfil no tiene manejo de error propio. Si falla, el error escapa al bloque de catch del negocio, generando mensajes confusos.

**Solución:**

```typescript
// ✅
try {
  await db.insert(profiles).values({ ... });
} catch (insertError) {
  console.error('Error creating profile:', insertError);
  return { error: 'Error al crear el perfil de usuario.' };
}
```

- [ ] Envolver el `db.insert(profiles)` en su propio try/catch

---

#### TAREA-24 · `img.onload?.()` llamado con `Event('error')` — lógica incorrecta

**Problema:**

```typescript
// ❌ useHeroController.ts línea 249 — no tiene sentido invocar onload con un error
img.onerror = () => {
  console.error('[Hero] Failed to load the uploaded image URL:', uploadedUrl);
  img.onload?.(new Event('error')); // ← MAL: onload no debería llamarse en un error
};
```

**Solución:**

```typescript
// ✅ Manejar el error correctamente, sin invocar onload
img.onerror = () => {
  console.error('[Hero] Failed to load the uploaded image URL:', uploadedUrl);
  setBackgroundImage(originalImage);
  isManuallyUpdating.current = false;
};
```

- [ ] Corregir la lógica del `onerror` handler

---

## ✅ Lo que está BIEN — No tocar

| Área                                         | Por qué es bueno                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthProvider` (src/features/auth/index.tsx) | Race conditions mitigadas con `profileRequestIdRef`. El `setTimeout(() => void fetchProfile(), 0)` sigue la recomendación oficial de Supabase para `onAuthStateChange`.         |
| `useBusinessSession.ts`                      | Separación impecable: constants, types, helpers puros y hook claramente delimitados. `useCallback` en todos los handlers con dependencias correctas. JSDoc en métodos públicos. |
| `src/core/database/client.ts`                | Singleton pattern correcto para evitar connection exhaustion en dev con hot reload.                                                                                             |
| `src/lib/errorHandling.ts`                   | Excelente abstracción. `isBusinessError` + `logError` evitan contaminar la consola con errores de negocio esperados.                                                            |
| `ESLint config`                              | Stack de plugins muy sólido (sonarjs, unicorn, promise, security, import). Solo hay que activar `max-lines`.                                                                    |
| `assertOwnership` en `team.ts`               | Guard function con retorno tipado bien pensado. Pena que no se use en `business.ts` también.                                                                                    |

---

## 📋 Plan de Acción Priorizado

| Prioridad | Tarea    | Descripción                               | Esfuerzo |
| --------- | -------- | ----------------------------------------- | -------- |
| 🔴 P0     | TAREA-19 | Activar max-lines en ESLint               | Muy bajo |
| 🔴 P0     | TAREA-06 | ActionState → tipo centralizado           | Bajo     |
| 🔴 P0     | TAREA-07 | Supabase helpers → DRY único              | Bajo     |
| 🔴 P0     | TAREA-11 | error: any → error: unknown               | Bajo     |
| 🔴 P0     | TAREA-02 | Dividir team.ts (872 líneas)              | Alto     |
| 🔴 P0     | TAREA-01 | Dividir BusinessPageContent.tsx (643 lín) | Alto     |
| 🟠 P1     | TAREA-09 | Eliminar console.warn de debug + logger   | Bajo     |
| 🟠 P1     | TAREA-10 | console.warn en useHeroController         | Bajo     |
| 🟠 P1     | TAREA-21 | Math.random → crypto.getRandomValues      | Bajo     |
| 🟡 P2     | TAREA-03 | Dividir settings/actions.ts               | Medio    |
| 🟡 P2     | TAREA-04 | Dividir business.ts + helpers             | Medio    |
| 🟡 P2     | TAREA-05 | Dividir useHeroController + FeaturedItems | Medio    |
| 🟡 P2     | TAREA-08 | Eliminar blocks ownership duplicados      | Bajo     |
| 🟡 P2     | TAREA-15 | Extraer mappers de productos              | Bajo     |
| 🟡 P2     | TAREA-17 | IIFE themeStyles → función pura           | Bajo     |
| 🟡 P2     | TAREA-13 | Mensajes de error en español              | Muy bajo |
| 🟡 P2     | TAREA-14 | Renombrar CreateBusiness.ts               | Muy bajo |
| 🟡 P2     | TAREA-16 | Importaciones relativas → @/ aliases      | Bajo     |
| 🟢 P3     | TAREA-22 | alert() → AlertSnackbar                   | Bajo     |
| 🟢 P3     | TAREA-23 | try/catch en db.insert(profiles)          | Muy bajo |
| 🟢 P3     | TAREA-24 | Corregir img.onerror logic                | Muy bajo |
| 🟢 P3     | TAREA-18 | Verificar Prettier en pre-commit          | Muy bajo |
| 🟢 P3     | TAREA-20 | pnpm format en middleware.ts              | Auto     |
| 🟢 P3     | TAREA-12 | Eliminar prop \_id no utilizada           | Muy bajo |

---

> 💡 **Recomendación táctica:** Empezá por **TAREA-19** (2 líneas en `eslint.config.mjs`).
> Con ese cambio, ESLint va a reportar automáticamente TODOS los archivos que superen 120 líneas en cada `pnpm lint`. Convertís el análisis manual en enforcement automático y continuo desde el primer día.
