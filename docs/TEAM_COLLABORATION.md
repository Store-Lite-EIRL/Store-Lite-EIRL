# Team Collaboration — Invitaciones de Equipo

> Sistema de colaboración multi-usuario para negocios en planes Business Pro o superior.

## Overview

Permite a los dueños de negocios invitar hasta `maxTeamMembers` usuarios adicionales a su espacio de trabajo mediante un **código de invitación único**.

---

## Diseño de Datos

### Tabla: `business_invitations`

Códigos de invitación activos por negocio.

| Campo         | Tipo          | Descripción                                  |
| ------------- | ------------- | -------------------------------------------- |
| `id`          | `uuid`        | PK                                           |
| `business_id` | `uuid`        | FK → `businesses.id`                         |
| `code`        | `text`        | Código único (8 caracteres alfanuméricos)    |
| `code_hash`   | `text`        | Hash SHA-256 del código (para verificación)  |
| `max_uses`    | `integer`     | Usos máximos permitidos (`null` = ilimitado) |
| `used_count`  | `integer`     | Cantidad de usos actuales                    |
| `expires_at`  | `timestamptz` | Fecha de expiración (`null` = no expira)     |
| `created_at`  | `timestamptz` | Timestamp de creación                        |
| `created_by`  | `uuid`        | FK → `profiles.id` (owner que lo generó)     |

### Tabla: `business_team_members`

Miembros activos del equipo.

| Campo           | Tipo          | Descripción                                      |
| --------------- | ------------- | ------------------------------------------------ |
| `id`            | `uuid`        | PK                                               |
| `business_id`   | `uuid`        | FK → `businesses.id`                             |
| `user_id`       | `uuid`        | FK → `profiles.id`                               |
| `role`          | `text`        | `'member'` (futuro: `'admin'`)                   |
| `joined_at`     | `timestamptz` | Timestamp de unión                               |
| `invitation_id` | `uuid`        | FK → `business_invitations.id` (origen del join) |

**Constraints:**

- `UNIQUE(business_id, user_id)` — un usuario no puede unirse dos veces
- `CHECK(used_count <= max_uses)` — no exceder usos máximos

---

## Lógica de Negocio

### Reglas de Oro

1. **Solo el owner puede:**
   - Generar códigos de invitación
   - Ver el código activo (los miembros NO lo ven)
   - Regenerar (invalidar) códigos existentes
   - Eliminar miembros del equipo

2. **Validaciones server-side obligatorias:**
   - Plan debe ser `business_pro` o superior
   - Plan debe estar `active`
   - `current_members < maxTeamMembers`
   - Código debe existir, no estar expirado, y tener usos disponibles

3. **Rate Limiting:**
   - Máximo 5 intentos de join fallidos por IP en 15 minutos
   - Máximo 3 códigos activos por negocio

4. **El usuario invitado debe:**
   - Tener cuenta con Google (sesión activa)
   - No ser ya miembro del negocio
   - Ser owner de 0-1 negocios propios

### Flujo: Usuario con Negocio Propio Quiere Unirse a un Team

```
1. Usuario ejecuta /join con código válido
2. Server detecta que ya es owner de un negocio
3. Webhook/modal pregunta: "¿Permanecer en tu negocio o cambiarte al Team?"
   a) "Quedarme" → retorna a su dashboard con su negocio
   b) "Unirme al Team" → cambia su business activo al team
4. Se inserta en business_team_members
```

> **Decisión de diseño:** El usuario mantiene sus negocios propios. Puede "cambiar" temporalmente a trabajar en el team, pero su negocio no se pierde.

---

## Entitlements

| Plan            | maxTeamMembers | Descripción         |
| --------------- | :------------: | ------------------- |
| `basico`        |       1        | Solo el owner       |
| `emprendedor`   |       3        | Owner + 2 invitados |
| `business_pro`  |       2        | Owner + 1 invitado  |
| `enterprise_ai` |       5        | Owner + 4 invitados |

**Referencia:** `src/core/entitlements/plans.ts` → `maxTeamMembers`

---

## Server Actions

### `app/actions/team.ts`

```typescript
// Generar nuevo código de invitación
generateInvitationCode(businessId: string): Promise<ActionState<{ code: string }>>

// Unirse a un negocio con código
joinTeam(code: string, slug: string): Promise<ActionState>

// Obtener miembros del equipo
getTeamMembers(businessId: string): Promise<TeamMember[]>

// Eliminar miembro (solo owner)
removeTeamMember(businessId: string, userId: string): Promise<ActionState>

// Regenerar código (invalida el anterior)
regenerateInvitationCode(businessId: string): Promise<ActionState<{ code: string }>>
```

---

## RLS Policies

```sql
-- Miembros pueden VER que existe un código (pero no el valor)
-- El código real solo lo ve el owner en Settings

-- Ver invitación: solo owner
CREATE POLICY "owner_can_view_invitation"
  ON business_invitations FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Crear invitación: solo owner
CREATE POLICY "owner_can_create_invitation"
  ON business_invitations FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Ver miembros: owner + miembros activos
CREATE POLICY "team_can_view_members"
  ON business_team_members FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

-- Agregar miembro: verificado por server action (no RLS directo)
-- El server action valida el código y los límites
```

---

## UI: Settings > Sección Equipo

### Owner View

```
┌─────────────────────────────────────────────┐
│ Mi Equipo                                  │
│ Gestiona quién tiene acceso a tu negocio.  │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Miembros (3/3)                          │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ 👤 Juan Pérez (tú) - Owner          │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ 👤 María García        [Eliminar]   │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Código de invitación                    │ │
│ │ Compartir este código con tus empleados │ │
│ │                                         │ │
│ │    STOR-ABCD-1234    [Copiar] [Regenerar]│ │
│ │                                         │ │
│ │ Usado: 2/∞ · Expira: nunca              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Invited Member View (en Settings)

```
┌─────────────────────────────────────────────┐
│ Equipo de "Tienda de Juan"                  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Eres miembro de este equipo              │ │
│ │                                         │ │
│ │ Tu negocio: [Mi Tienda ▼]              │ │
│ │ (Dropdown para cambiar entre sus         │ │
│ │  negocios propios y teams)               │ │
│ │                                         │ │
│ │ [Salir del Team]                        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Rate Limiting

Implementado via Supabase/Postgres:

```sql
-- Tabla de rate limiting
CREATE TABLE join_attempt_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  code_hash text,  -- código que intentó (para auditoría)
  success boolean
);

-- Policy: solo insertar desde service role (server actions)
-- Cleanup: Edge function que limpia entradas > 15 minutos
```

---

## Flujo Post-Login (Onboarding)

Cuando un usuario inicia sesión por primera vez con Google:

```
/auth/callback → Verifica si tiene negocios
                     ↓
         ┌─────────────────────────┐
         │  ¿Tiene negocios?       │
         └─────────────────────────┘
                ↓           ↓
               NO          SÍ
                ↓           ↓
         /onboarding    /list-business
                ↓
    ┌─────────┴─────────┐
    │                   │
    │ "Crear negocio"  │ "Unirme a un equipo"
    │   → /create       │   → /join
    └───────────────────┘
```

### Archivos relacionados

- `app/auth/callback/route.ts` — Lógica de redirección
- `app/onboarding/page.tsx` — Página de opciones post-login
- `app/api/auth/user/route.ts` — API para obtener estado del usuario

---

## Estado del Equipo en la Sesión

El `AuthUser` se extiende para incluir acceso al team:

```typescript
interface AuthUser extends SupabaseUser {
  profile?: Profile;
  activeBusinessTeamId?: string; // Si está trabajando en un team
}
```

> **Nota:** El `activeBusinessTeamId` se guarda en el session storage o cookies del servidor, NO en la DB. El usuario puede cambiar de contexto dinámicamente.

---

## Decisiones de Diseño Registradas

| Fecha      | Decisión                                                | Motivo                                          |
| ---------- | ------------------------------------------------------- | ----------------------------------------------- |
| 2026-04-06 | Tabla separada `business_invitations` en vez de columna | Permite códigos múltiples, expiración, tracking |
| 2026-04-06 | Hash del código en DB                                   | No exponer el código original en plaintext      |
| 2026-04-06 | Rate limiting por IP                                    | Prevenir fuerza bruta de códigos                |
| 2026-04-06 | Webhook para usuarios con negocio propio                | Evitar perder acceso accidental a su negocio    |

---

_Última actualización: Abril 2026_
