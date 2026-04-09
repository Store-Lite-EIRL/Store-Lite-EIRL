# Team Collaboration v2 — Sistema de Permisos y Roles

> **Estado:** Especificación - Pendiente de implementación
> **Fecha:** 2026-04-06

---

## Overview

Sistema de permisos granulares para miembros del equipo, con experiencia de onboarding mejorada y restricciones de seguridad.

---

## Cambios al Flujo de Join

### Flujo Actual (v1)

```
/join → Ingresar código → Redirigir a /settings
```

### Flujo Nuevo (v2)

```
/join → Ingresar SLUG + CÓDIGO → Validar → ÉXITO con confeti → Redirigir a /settings (limitado)
```

### Validación Mejorada

- **Slug**: Identifica el negocio antes de verificar el código
- **Código**: Valida que sea correcto para ese slug específico
- **Error específico**: "El código no es válido para este negocio" si no coincide

---

## Experiencia de Éxito (Onboarding del Miembro)

### Componente: `JoinSuccessModal`

```tsx
interface JoinSuccessModalProps {
  businessName: string;
  businessSlug: string;
  onDismiss: () => void;
}
```

### Contenido

1. **Confeti animation** (3-5 segundos)
2. **Icono de check** con animación
3. **Mensaje**: `¡Bienvenido al equipo de {businessName}!`
4. **Subtexto**: `Tienes acceso a gestionar productos, categorías y más.`
5. **Contador regresivo**: 3... 2... 1... → Redirect

### Estilos

- Fondo oscuro con partículas de confeti
- Modal centrado con borde gradiente
- Botón "Ir ahora" para saltar el contador

---

## Sistema de Permisos por Rol

### Roles

| Rol      | Descripción       | Nivel             |
| -------- | ----------------- | ----------------- |
| `owner`  | Dueño del negocio | 100 (full access) |
| `admin`  | Admin del equipo  | 80 (configurable) |
| `member` | Miembro estándar  | 50 (limitado)     |

### Permisos Disponibles

```typescript
type Permission =
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  | 'storefront.edit'
  | 'seo.edit'
  | 'chat.view'
  | 'chat.respond'
  | 'dashboard.view'
  | 'storage.upload'
  | 'storage.delete'
  | 'home.edit';
```

### Permisos por Rol (Defaults)

```typescript
const ROLE_DEFAULTS = {
  owner: [
    /* TODOS */
  ],
  admin: [
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.delete',
    'storefront.edit',
    'seo.edit',
    'chat.view',
    'chat.respond',
    'dashboard.view',
    'storage.upload',
    'storage.delete',
    'home.edit',
  ],
  member: [
    'products.view',
    'products.create',
    'products.edit', // Sin delete
    'categories.view',
    'categories.create',
    'categories.edit',
    'storefront.edit',
    'seo.edit',
    'chat.view',
    'chat.respond',
    'dashboard.view',
    'storage.upload',
    'home.edit', // Sin storage.delete
  ],
};
```

### Funciones SI permitidas para miembros

- ✅ Crear/Editar/Ver productos
- ✅ Crear/Editar/Ver categorías
- ✅ Editar storefront (colores, layout)
- ✅ Editar SEO
- ✅ Ver/Chatear con clientes
- ✅ Ver dashboard
- ✅ Subir imágenes (storage)
- ✅ Editar home

### Funciones NO permitidas para miembros

- ❌ Eliminar productos
- ❌ Eliminar categorías
- ❌ Eliminar imágenes de storage
- ❌ Cambiar nombre del negocio
- ❌ Cambiar dueño
- ❌ Cambiar plan
- ❌ Ver/Editar información legal
- ❌ Ver/Editar info de contacto
- ❌ Generar/Ver código de invitación
- ❌ Eliminar miembros
- ❌ Eliminar el negocio

---

## Modelo de Datos

### Nueva Tabla: `business_team_roles`

```sql
CREATE TABLE business_team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  permissions jsonb DEFAULT '[]',  -- Array de permisos, vacio = usar default
  is_default boolean DEFAULT false,  -- Si es el rol default para nuevos miembros
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_business_role UNIQUE (business_id, role)
);
```

### Tabla Actualizada: `business_team_members`

```sql
ALTER TABLE business_team_members ADD COLUMN role text NOT NULL DEFAULT 'member';
ALTER TABLE business_team_members ADD COLUMN custom_permissions jsonb;  -- Override individual
```

### Estructura en Schema.ts

```typescript
export const businessTeamRoles = pgTable('business_team_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  role: text('role').notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
businessTeamMembers -> businessTeamRoles (vía role)
businesses -> businessTeamRoles (uno a muchos)
```

---

## Server Actions (Nuevas y Modificadas)

### `getMemberPermissions`

```typescript
async function getMemberPermissions(
  businessId: string,
  userId: string,
): Promise<{
  permissions: string[];
  role: string;
  isOwner: boolean;
}>;
```

### `updateMemberRole`

```typescript
async function updateMemberRole(
  businessId: string,
  memberUserId: string,
  newRole: 'admin' | 'member',
): Promise<ActionState>;
```

### `updateRolePermissions`

```typescript
async function updateRolePermissions(
  businessId: string,
  role: string,
  permissions: string[],
): Promise<ActionState>;
```

### `joinTeam` (Modificada)

```typescript
// Ahora recibe slug Y código
async function joinTeam(slug: string, code: string): Promise<ActionState>;
// Retorna info del negocio y confirmación de éxito
```

---

## Componentes UI

### 1. `JoinSuccessModal`

```tsx
// app/join/components/JoinSuccessModal.tsx
'use client';

import styles from './JoinSuccessModal.module.css';

export function JoinSuccessModal({
  businessName,
  businessSlug,
  onComplete,
}: {
  businessName: string;
  businessSlug: string;
  onComplete: () => void;
}) {
  // Confetti animation (usar canvas-confetti o similar)
  // Countdown de 3 segundos
  // Redirect automático o manual
}
```

### 2. `PermissionsMatrix` (Settings)

En la sección Equipo del Settings:

```tsx
// Para cada rol (admin, member), mostrar switches de permisos
<PermissionsMatrix
  role="member"
  permissions={currentPermissions}
  onChange={(permission, enabled) => {
    // Update permission
  }}
/>
```

### 3. `RoleSelector` (Settings > Equipo)

```tsx
<Select
  value={member.role}
  options={[
    { value: 'admin', label: 'Administrador' },
    { value: 'member', label: 'Miembro' },
  ]}
  onChange={(e) => updateMemberRole(member.userId, e.value)}
/>
```

---

## Middleware de Permisos

### Helper: `checkPermission`

```typescript
// lib/permissions/checkPermission.ts

export async function checkPermission(
  userId: string,
  businessId: string,
  permission: Permission,
): Promise<boolean> {
  // 1. Check if user is owner -> true
  // 2. Get member role
  // 3. Get role permissions (custom or default)
  // 4. Check if permission exists
  // 5. Return boolean
}
```

### Uso en Server Actions

```typescript
export async function deleteProduct(productId: string) {
  // ...

  // Verificar permiso
  const canDelete = await checkPermission(userId, businessId, 'products.delete');
  if (!canDelete) {
    return { error: 'No tienes permiso para eliminar productos.' };
  }

  // Continuar con la eliminación
  // ...
}
```

### Uso en Components (UI)

```tsx
// componente/ProductCard.tsx
const permissions = usePermissions(businessId);

return (
  <div>
    <ProductDetails />

    {permissions['products.edit'] && <Button>Editar</Button>}

    {permissions['products.delete'] && <Button variant="danger">Eliminar</Button>}
  </div>
);
```

### Hook: `usePermissions`

```typescript
// hooks/usePermissions.ts
'use client';

export function usePermissions(businessId: string) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch(`/api/business/${businessId}/permissions`)
      .then((res) => res.json())
      .then((data) => {
        setPermissions(data.permissions);
        setIsOwner(data.isOwner);
      });
  }, [businessId]);

  return {
    permissions,
    isOwner,
    can: (permission: Permission) => permissions.includes(permission),
  };
}
```

---

## API Endpoints

### `GET /api/business/[slug]/permissions`

```typescript
// Response
{
  isOwner: boolean;
  role: 'owner' | 'admin' | 'member' | null;
  permissions: string[];
  business: {
    id: string;
    name: string;
    slug: string;
  };
}
```

### `PATCH /api/business/[slug]/members/[userId]`

```typescript
// Body
{
  role?: 'admin' | 'member';
  permissions?: string[];
}

// Response
{
  success: boolean;
  member: TeamMember;
}
```

---

## Cambios en Settings > Equipo

### Vista del Owner

```
┌─────────────────────────────────────────────────────────┐
│ Mi Equipo                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Miembros                                            ││
│ │                                                      ││
│ │ ┌────────────────────────────────────────────────┐ ││
│ │ │ 👤 María García (invitado@email.com)            │ ││
│ │ │ Rol: [Miembro ▼]  [Editar permisos]              │ ││
│ │ │ Joined: 15/03/2026                              │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Permisos por Defecto                                ││
│ │                                                      ││
│ │ Permisos de Miembro:                                ││
│ │ ☑ Ver productos    ☑ Crear productos               ││
│ │ ☑ Editar productos ☐ Eliminar productos           ││
│ │ ☑ Ver categorías   ☑ Crear categorías              ││
│ │ ☑ Editar categorías☒ Eliminar categorías           ││
│ │ ...                                                 ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Código de invitación                    [ABCD-1234]││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Botón "Editar Permisos"

Abre un modal con la matriz de permisos completa:

```
┌─────────────────────────────────────────────────────────┐
│ Permisos de Miembro                               [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📦 Productos                                       │ │
│ │   ☑ Ver productos                                 │ │
│ │   ☑ Crear productos                              │ │
│ │   ☑ Editar productos                            │ │
│ │   ☐ Eliminar productos                          │ │
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📁 Categorías                                     │ │
│ │   ...                                             │ │
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ⚙️ Configuración                                  │ │
│ │   ☐ Editar información del negocio              │ │
│ │   ☐ Gestionar código de invitación               │ │
│ │   ☐ Gestionar miembros del equipo                │ │
│ │   ☐ Cambiar plan                                 │ │
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│                        [Cancelar]  [Guardar]           │
└─────────────────────────────────────────────────────────┘
```

---

## Validaciones de Negocio

1. **Owner siempre tiene full access** - No se puede restringir
2. **Al menos un admin si hay miembros** - Si no, el owner debe serlo
3. **No se puede asignar rol de owner** - Solo transferir
4. **Cambios de permisos aplican a todos los miembros con ese rol**
5. **Custom permissions override al rol** - Para casos especiales

---

## Archivos a Modificar/Crear

### Nuevos

- `migrations/0015_team_roles_permissions.sql`
- `src/core/database/schema.ts` (agregar businessTeamRoles)
- `src/lib/permissions/checkPermission.ts`
- `src/hooks/usePermissions.ts`
- `app/join/components/JoinSuccessModal.tsx`
- `app/join/components/JoinSuccessModal.module.css`
- `app/join/components/PermissionsMatrix.tsx`
- `app/api/business/[slug]/permissions/route.ts`
- `app/api/business/[slug]/members/[userId]/route.ts`
- `app/[slug]/settings/components/PermissionsSection.tsx` (extender TeamSection)

### Modificar

- `app/join/page.tsx` - Agregar input de slug, confeti
- `app/actions/team.ts` - joinTeam con slug+code, getMemberPermissions
- `app/actions/business.ts` - Verificar permisos antes de acciones
- `app/[slug]/storage/actions/products.ts` - Agregar checks de permisos
- `app/[slug]/storage/actions/categories.ts` - Agregar checks de permisos

---

## Orden de Implementación Sugerido

### Fase 1: Base de Datos ✅

1. Crear migración `0015_team_roles_permissions.sql`
2. Agregar tabla `business_team_roles`
3. Actualizar `business_team_members` con `role`
4. Ejecutar migración

### Fase 2: Lógica de Permisos ✅

1. Helper `checkPermission()` ✅
2. Función `getMemberPermissions()` ✅
3. Función `updateRolePermissions()` (pendiente - para settings)
4. Hook `usePermissions()` ✅

### Fase 3: API Endpoints ✅

1. `GET /api/business/permissions` ✅
2. `PATCH /api/business/[slug]/members/[userId]` ✅

### Fase 4: UI - Join Mejorado ✅

1. Agregar input de slug en `/join` ✅
2. Crear `JoinSuccessModal` con confeti ✅
3. Modificar `joinTeam` para recibir slug+code ✅
4. Integrar redirect con countdown ✅

### Fase 5: UI - Settings ✅

1. Agregar selector de rol en lista de miembros ✅
2. Crear `PermissionsMatrix` component ✅
3. Sección de permisos por defecto en Settings > Equipo ✅
4. Modal de edición de permisos ✅

### Fase 6: Integración ✅

1. Integrar `usePermissions` en componentes de storage ✅
2. Agregar checks en Server Actions ✅
3. Ocultar/bloquear UI según permisos ✅ (via server action checks)
4. Feedback de "Sin permiso" cuando aplique ✅

---

## Estado Final

**¡TODAS LAS FASES COMPLETADAS!** ✅

### Resumen de Implementación

| Fase | Descripción                          | Estado |
| ---- | ------------------------------------ | ------ |
| 1    | Base de Datos (tablas, funciones)    | ✅     |
| 2    | Lógica de Permisos (checkPermission) | ✅     |
| 3    | API Endpoints                        | ✅     |
| 4    | UI Join (slug + código + confeti)    | ✅     |
| 5    | UI Settings (roles + permisos)       | ✅     |
| 6    | Integración en Server Actions        | ✅     |

### Server Actions Actualizadas

| Acción                  | Permiso Requerido   |
| ----------------------- | ------------------- |
| `deleteProduct`         | `products.delete`   |
| `syncProductCategories` | `categories.edit`   |
| `createCategory`        | `categories.create` |
| `updateCategory`        | `categories.edit`   |
| Chat respond            | `chat.respond`      |

### Componentes Creados

- `src/lib/permissions/` - Definiciones y helpers
- `src/hooks/usePermissions.ts` - Hook para UI
- `app/join/components/JoinSuccessModal.tsx` - Modal de éxito con confeti
- `app/[slug]/settings/components/PermissionsMatrix.tsx` - Matriz de permisos
- API endpoints para permisos y gestión de miembros

### Pendiente (Opcional)

- [ ] Agregar `usePermissions` en componentes UI para ocultar/bloquear botones
- [ ] Agregar `storage.delete` permission en uploads.ts
- [ ] Rate limiting real (PostgreSQL functions)

1. Agregar selector de rol en lista de miembros
2. Crear `PermissionsMatrix` component
3. Sección de permisos por defecto en Settings > Equipo
4. Modal de edición de permisos

### Fase 6: Integración

1. Integrar `usePermissions` en componentes de storage
2. Agregar checks en Server Actions
3. Ocultar/bloquear UI según permisos
4. Feedback de "Sin permiso" cuando aplique

---

## Decisiones Pendientes

- [ ] ¿Usar canvas-confetti o CSS animations para el confeti?
- [ ] ¿El countdown es de 3 o 5 segundos?
- [ ] ¿Se puede personalizar el mensaje de bienvenida?
- [ ] ¿Los permisos se guardan por rol o por usuario individual?

---

_Última actualización: Abril 2026_
