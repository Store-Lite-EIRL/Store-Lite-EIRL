# Sistema de Notificaciones en Tiempo Real

## Objetivo

Implementar un sistema de notificaciones completo para el dashboard de cada negocio, permitiendo:

- Recibir notificaciones en tiempo real via WebSockets (Supabase Realtime)
- Notificaciones de: chats, almacen (stock), planes, pedidos
- Filtrado por categorías en UI
- Persistencia en base de datos

---

## Contexto del Negocio

El negocio (URBANO) es un centro de envíos a nivel nacional. El owner necesita estar al tanto de:

- 📦 Nuevas compras/pedidos
- 💬 Mensajes nuevos de clientes
- 📊 Estado del plan (por expirar, upgrades)
- 📦 Almacén (stock bajo, sin stock)

---

## Estado Actual

| Componente                   | Estado                                   |
| ---------------------------- | ---------------------------------------- |
| Generación de notificaciones | Server Component que calcula al REQUEST  |
| Persistencia                 | ❌ No existe - solo se calculan al vuelo |
| API Routes                   | ❌ No hay endpoints                      |
| Tiempo real                  | Supabase disponible pero NO usado        |
| Tabla DB                     | ❌ No existe                             |

**Las notificaciones actuales funcionan porque se derivan de queries, pero no hay persistencia.**

---

## Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐     ┌──────────────┐     ┌───────────────┐ │
│   │ ACCIONES │────▶│   DB NOTIF    │────▶│ SUPABASE RTS  │ │
│   │ (Events)  │     │   (Tabla)     │     │ (WebSocket)   │ │
│   └──────────┘     └──────────────┘     └───────┬───────┘ │
│                                                  │         │
│                                                  ▼         │
│   ┌────────────┐     ┌────────────────┐     ┌─────────┐ │
│   │ API ROUTES  │◀────│ Client Hook    │◀────│ UI      │ │
│   │   (CRUD)   │     │ (useNotifs)    │     │ (Toast) │ │
│   └────────────┘     └────────────────┘     └─────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Categorías de Notificaciones

| Categoría   | Tipos                                                    |
| ----------- | -------------------------------------------------------- |
| **CHAT**    | `message_new`, `message_unread`                          |
| **ALMACEN** | `stock_low`, `stock_out`                                 |
| **PLAN**    | `plan_expiring`, `plan_expired`, `plan_upgraded`         |
| **PEDIDOS** | `order_created`, `order_status_changed`, `order_shipped` |
| **SISTEMA** | `system`                                                 |

---

## Plan de Implementación por Fases

### Fase 1: Schema de Base de Datos ✅ COMPLETADO

**Objetivo:** Crear tabla `notifications` en schema.ts

- [x] Agregar `notificationTypeEnum` (enum con todos los tipos)
- [x] Agregar `notificationCategoryEnum` (enum para filtrado)
- [x] Crear tabla `notifications` con campos:
  - `id`, `business_id`
  - `type`, `category`, `title`, `message`
  - `data` (JSONB para datos adicionales)
  - `is_read`, `is_dismissed`
  - `created_at`, `read_at`
- [x] Agregar relaciones
- [x] Exportar tipos TypeScript

**Archivo modificado:** `src/core/database/schema.ts`

**Índices creados:**

- `idx_notifications_business_id` - por business
- `idx_notifications_business_created` - compound (business + fecha desc)
- `idx_notifications_unread` - para queries de no leídas (partial index)
- `idx_notifications_category` - para filtrado por categoría

### Fase 2: API Routes (CRUD) ✅ COMPLETADO

**Objetivo:** Endpoints API para notificaciones

- [x] `GET /api/notifications` - Listar con filtros y paginado
- [x] `GET /api/notifications/unread-count` - Contador de no leídas
- [x] `POST /api/notifications` - Crear notificación (uso interno)
- [x] `PATCH /api/notifications/[id]` - Marcar como leída
- [x] `DELETE /api/notifications/[id]` - Eliminar/descartar

**Archivos:**

- `app/api/notifications/route.ts`
- `app/api/notifications/unread-count/route.ts`
- `app/api/notifications/[id]/route.ts`

**Características:**

- Query params: `businessId` o `slug` (sigue patrón del proyecto)
- Filtros: `category`, `isRead`, `limit`, `offset`
- Paginación con `total`, `hasMore`
- Desglose por categoría en unread-count

### Fase 3: Hook `useNotifications` + Realtime ✅ COMPLETADO

**Objetivo:** Client-side hook con WebSockets

**Archivo:** `src/hooks/useNotifications.ts`

**Características implementadas:**

- [x] Hook `useNotifications(businessId, options)` con todas las opciones
- [x] Fetch inicial desde API con paginación
- [x] Suscripción a Supabase Realtime (`INSERT` events)
- [x] Métodos: `markAsRead`, `dismiss`, `markAllAsRead`, `refresh`
- [x] Retorna: `{ notifications, unreadCount, unreadCountByCategory, isLoading, error }`
- [x] Callback `onNewNotification` para toast/animaciones
- [x] Flag `isNew` para identificar notificaciones recien recibidas

**Estado:**

- Próximo: Fase 4 - Sistema de Eventos (Backend)

### Fase 4: Sistema de Eventos (Backend) ✅ COMPLETADO

**Objetivo:** Helper functions para crear notificaciones

**Archivo:** `src/lib/notifications.ts`

**Funciones implementadas:**

- [x] `createBusinessNotification(params)` - Función genérica
- [x] `notifyNewOrder(businessId, data)` - Nuevo pedido
- [x] `notifyOrderStatusChange(businessId, data)` - Cambio de estado
- [x] `notifyNewMessage(businessId, data)` - Nuevo mensaje
- [x] `notifyLowStock(businessId, data)` - Stock bajo
- [x] `notifyOutOfStock(businessId, data)` - Sin stock
- [x] `notifyPlanExpiring(businessId, data)` - Plan por expirar
- [x] `notifyPlanExpired(businessId, data)` - Plan expirado
- [x] `notifyPlanUpgraded(businessId, data)` - Plan actualizado
- [x] `notifySystem(businessId, message)` - Notificación genérica

**Estado:** Completado. Listo para integrar en webhooks/actions.

### Fase 5: UI del Dashboard ✅ COMPLETADO

**Objetivo:** Reemplazar notificaciones derivadas con persistentes

- [ ] Actualizar `NotificationsPreview.tsx` para usar hook
- [ ] Agregar filtros por categoría (tabs)
- [ ] Badge de no leídas en header
- [ ] Integrar con Alertas/Toast para notificaciones entrantes
- [ ] Animaciones y UX improvements

**Archivo:** `app/[slug]/dashboard/components/NotificationsPreview.tsx`

---

## Detalles Técnicos

### Supabase Realtime Setup

```typescript
// Suscribirse a nuevas notificaciones
const channel = supabase
  .channel(`notifications:${businessId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `business_id=eq.${businessId}`,
    },
    (payload) => {
      // Agregar al estado + mostrar toast
      addNotification(payload.new);
    },
  )
  .subscribe();
```

### Schema SQL (referencia)

```sql
-- Enum para tipos
CREATE TYPE notification_type AS ENUM (
  'message_new', 'message_unread',
  'stock_low', 'stock_out',
  'plan_expiring', 'plan_expired', 'plan_upgraded',
  'order_created', 'order_status_changed', 'order_shipped',
  'system'
);

-- Enum para categorías
CREATE TYPE notification_category AS ENUM (
  'chat', 'almacen', 'plan', 'pedidos', 'sistema'
);

-- Tabla
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

---

## Tiempo Estimado

| Fase               | Dificultad | Tiempo         |
| ------------------ | ---------- | -------------- |
| 1. Schema DB       | Media      | 30 min         |
| 2. API Routes      | Baja       | 1 hora         |
| 3. Hook + Realtime | Alta       | 2 horas        |
| 4. Sistema Eventos | Media      | 1 hora         |
| 5. UI Dashboard    | Media      | 2 horas        |
| **Total**          |            | **~6.5 horas** |

---

## Archivos a Modificar/Crear

### ✅ Creados (Fases 1-4)

- [x] `src/core/database/schema.ts` (tabla, enums, índices)
- [x] `app/api/notifications/route.ts`
- [x] `app/api/notifications/unread-count/route.ts`
- [x] `app/api/notifications/[id]/route.ts`
- [x] `src/hooks/useNotifications.ts` (Fase 3)
- [x] `src/lib/notifications.ts` (Fase 4)

### Por modificar

- [ ] `app/[slug]/dashboard/components/NotificationsPreview.tsx` (Fase 5)
- [ ] `app/[slug]/dashboard/page.tsx` (remover cálculo derivadas - Fase 5)

---

## Notas

- Usamos WebSockets (Supabase Realtime) porque ya está implementado para el chat
- Sistema escalable para agregar más tipos de notificaciones
- Filtrado por categoría permitirá al usuario ver solo lo que le interesa
- Persistencia permite historial de notificaciones

---

## Estado

**✅ FASE 1 COMPLETADA** - Schema de base de datos implementado

- Enums y tabla creados en `schema.ts`
- Índices para queries optimizadas

**✅ FASE 2 COMPLETADA** - API Routes CRUD (Hardened)

- `GET /api/notifications` con filtros, paginación y **autorización por miembro**.
- `GET /api/notifications/unread-count` con desglose por categoría y **seguridad multi-tenant**.
- `POST /api/notifications` con validación vía enums del schema y restricción a owner/admin.
- `PATCH /api/notifications/[id]` y `DELETE /api/notifications/[id]` con validación de pertenencia.
- `PUT /api/notifications/read-all` para marcar todas como leídas.

**✅ FASE 3 COMPLETADA** - Hook `useNotifications` + Realtime

- Hook completo en `src/hooks/useNotifications.ts`
- Fetch desde API con manejo de estados y errores
- Suscripción a Supabase Realtime para notificaciones entrantes
- Métodos: `markAsRead`, `dismiss`, `markAllAsRead`, `refresh`
- Retorna `{ notifications, unreadCount, unreadCountByCategory, isLoading, error }`
- Callback `onNewNotification` para toast/animaciones
- Flag `isNew` temporal para identificar notificaciones recientes

**✅ FASE 4 COMPLETADA** - Sistema de Eventos (Backend)

- Funciones helper en `src/lib/notifications.ts`
- `createBusinessNotification()` - función genérica con validación
- Funciones especializadas para cada tipo de notificación
- Listo para integrar en webhooks y actions

**Próximo: Fase 5 - UI del Dashboard**

---

## Historial de Cambios

| Fecha      | Cambio                                                | Por          |
| ---------- | ----------------------------------------------------- | ------------ |
| 2026-04-21 | Documento creado                                      | AI Architect |
| 2026-04-22 | Fase 2: API Routes CRUD completadas                   | AI Architect |
| 2026-04-22 | Fase 3: Hook `useNotifications` + Realtime completado | AI Architect |
| 2026-04-22 | Fase 4: Sistema de Eventos (Backend) completado       | AI Architect |
