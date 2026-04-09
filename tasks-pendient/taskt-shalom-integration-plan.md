# 📦 Plan: Integración Shalom Courier

> **Fecha:** 2026-04-07 (actualizado)
> **Planes habilitados:** Business Pro · Enterprise AI
> **Estado:** 🚧 En desarrollo - UI en progreso, esperando API real de Vero (Shalom)
> **Contacto:** Vero (representante de Shalom) — API en proceso de obtención

---

## ⚠️ DESCUBRIMIENTO CRÍTICO: shalom-api.lat NO es oficial

> **Investigado el:** 2026-04-07
> **Fuente:** https://shalom-api.lat/docs

La API en `shalom-api.lat` **NO es oficial de Shalom Courier**. Es una API de un tercero que solo ofrece:

### ✅ Lo que SÍ ofrece (shalom-api.lat):

| Operación                             | Disponible |
| ------------------------------------- | ---------- |
| Listar todas las agencias             | ✅         |
| Buscar agencias por nombre/ubicación  | ✅         |
| Tracking por número y código de orden | ✅         |
| Imagen PNG de resultado de búsqueda   | ✅         |

### ❌ Lo que NO ofrece:

| Operación               | Disponible |
| ----------------------- | ---------- |
| Crear guías/envíos      | ❌         |
| Calcular costo de envío | ❌         |
| Registrar pedidos       | ❌         |
| Webhooks                | ❌         |

### 🔴 Implicancia para el plan:

El plan actual **asume que existe una API para crear guías**. Esto es lo que necesita verificarse directamente con Shalom:

1. **Contactar a Shalom** (`app@shalom.com.pe` o `pro.shalom.pe`)
2. **Solicitar acceso a su API real** para crear guías y calcular costos
3. **Obtener documentación** de endpoints, autenticación, y rate limits

> **Mientras tanto:** Podemos usar `shalom-api.lat` para listar agencias en el checkout, pero NO para crear envíos.

---

## 🔍 1. Investigación de la API de Shalom (Necesaria)

### Fuentes potenciales de API:

| Fuente              | Tipo                                             | Disponibilidad   |
| ------------------- | ------------------------------------------------ | ---------------- |
| `pro.shalom.pe`     | API oficial Shalom (requiere cuenta empresarial) | ❓ Por verificar |
| `shalom-api.lat`    | API no oficial - solo lista agencias             | ✅ Disponible    |
| `app@shalom.com.pe` | Soporte técnico oficial                          | ✅ Contactar     |

### Lo que necesitamos de la API real de Shalom:

| Operación          | Para qué sirve                                       |
| ------------------ | ---------------------------------------------------- |
| `createShipment()` | Registrar guía cuando admin hace "Despachar"         |
| `calculateCost()`  | Mostrar costo de envío en checkout (si se cobra ahí) |
| `getTracking()`    | Consultar estado del envío                           |

### Estrategia de Tracking

Usamos **on-demand polling** con cache:

- Cuando el cliente entra a tracking, el servidor consulta el estado
- Cache de 5 minutos para evitar saturar la API
- Exponential backoff en caso de rate limit

---

## 🔍 1.5. Investigación del Checkout Actual

> **Investigado el:** 2026-04-07

### Datos que el checkout actual captura (`payments` table):

| Campo           | Tipo         | Requerido |
| --------------- | ------------ | --------- |
| `buyerEmail`    | text         | ✅ Sí     |
| `buyerPhone`    | text         | ❌ No     |
| `buyerAddress`  | ❌ NO EXISTE | -         |
| `buyerDistrict` | ❌ NO EXISTE | -         |
| `buyerProvince` | ❌ NO EXISTE | -         |

### Implicancia:

**El checkout actual NO captura dirección del comprador.** Para el flujo de Shalom necesitamos:

- Dirección completa del comprador
- Distrito, Provincia, Ciudad
- Referencia (opcional)

**El plan propone un nuevo flujo de checkout en 2 pasos (ver sección 2).**

---

## 🏷️ 2. Lógica de Negocio

### Restricción por Plan (Entitlements)

Se agrega el entitlement `canUseShippingIntegration` al sistema existente:

| Plan            | `canUseShippingIntegration` |
| --------------- | --------------------------- |
| `basico`        | ❌                          |
| `emprendedor`   | ❌                          |
| `business_pro`  | ✅                          |
| `enterprise_ai` | ✅                          |

### Flujo 1: Configuración (Owner del Negocio)

```
Settings → Integrations → Logistics → Shalom
  └── [Bloqueo con candado si plan < business_pro]
  └── Input: API Key (provista desde su cuenta Shalom Pro)
  └── Toggle: Activar/Desactivar integración
  └── Al guardar: Validar la key contra la API de Shalom
  └── Badge de estado: ✅ Conectado / ⚠️ Sin configurar
```

### Flujo 2: Despacho de Pedido (Admin Panel)

```
Dashboard → Orders → [Pedido con status "paid"]
  └── Botón: "Despachar con Shalom"
  └── Modal: Confirmar datos (peso, destino, nota)
  └── Backend → API Shalom → Retorna trackingNumber + URL de guía PDF
  └── Se guarda en payments.metadata.shipping { carrier, trackingNumber, trackingUrl }
  └── Status del pedido cambia a "not_delivered" (en camino)
```

### Flujo 3: Tracking del Comprador (Storefront)

```
[Email de confirmación / Historial del comprador]
  └── Link a: /[slug]/order/[paymentId]/track
  └── Server Action consulta API Shalom con trackingNumber
  └── Renderiza <TrackingTimeline> con estados semánticos
```

### Flujo 4: Checkout con Envío (NUEVO - Verificado)

> **Concepto aprobado por el usuario. Requiere implementar captación de datos de envío.**

```
Checkout Flow con Shalom:
═══════════════════════════════════════════════════════════════

  PASO 1: Datos de Envío
  ┌─────────────────────────────────────────────────────────┐
  │  📍 ¿A dónde enviamos?                                 │
  │                                                         │
  │  Provincia:    [Dropdown ▾]                             │
  │  Distrito:     [Dropdown ▾] (carga según provincia)    │
  │  Ciudad:       [Dropdown ▾] (carga según distrito)      │
  │                                                         │
  │  ─────────────────────────────────────────────         │
  │  📬 Agencias Shalom cerca de tu ubicación              │
  │                                                         │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │ ○ Agencia Lima Centro                            │   │
  │  │   Av. Brasil 1234, Lima                        │   │
  │  │   📞 01-2345678 · Horario: L-S 9am-7pm        │   │
  │  └─────────────────────────────────────────────────┘   │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │ ● Agencia San Miguel                            │   │
  │  │   Av. La Marina 567, San Miguel                 │   │
  │  │   📞 01-3456789 · Horario: L-S 9am-7pm       │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                         │
  │  ─────────────────────────────────────────────         │
  │  Dirección de referencia (opcional):                    │
  │  [Ej: Frente al parque, edificio azul, 3er piso]       │
  │                                                         │
  │                              [Siguiente →]              │
  └─────────────────────────────────────────────────────────┘
                          │
                          ▼
  PASO 2: Pago
  ┌─────────────────────────────────────────────────────────┐
  │  📋 Resumen del pedido                                 │
  │                                                         │
  │  Producto: Zara Camisa Azul                             │
  │  Subtotal:                              S/ 89.00        │
  │  Envío (Shalom - Agencia Lima Centro):  S/ 15.00      │
  │  ─────────────────────────────────────────────         │
  │  TOTAL:                                 S/ 104.00       │
  │                                                         │
  │  📍 Envío a: Agencia Lima Centro                       │
  │     Av. Brasil 1234, Lima                              │
  │                                                         │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │  💳 Yape / Plin / Tarjeta                      │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                         │
  │  Al pagar, recibirás un comprobante con:                │
  │  • Código de pedido                                     │
  │  • Datos del courier                                   │
  │  • Token para seguimiento                               │
  │                                                         │
  │                              [< Volver] [Pagar S/104]  │
  └─────────────────────────────────────────────────────────┘
```

#### Notas técnicas del flujo:

- **Paso 1** → Captura datos del comprador y selecciona agencia
- **Paso 2** → Muestra costos (si API de Shalom permite calcular) + pago
- **Al confirmar pago** → Se crea el `payment` en la DB con todos los datos de envío
- **El despacho de la guía** → Se hace MANUALMENTE desde el panel admin después del pago

---

## 🗄️ 3. Cambios en Base de Datos (Drizzle ORM)

> **Decisión:** Usamos el campo `metadata: jsonb` ya existente en la tabla `payments` para no crear columnas extra en esta iteración. Si en el futuro se necesita indexar por tracking, se migra a columnas dedicadas.

### `business_settings.preferences` — Guardar configuración de Shalom

```typescript
preferences: {
  logistics: {
    shalom: {
      apiKey: string,       // Encriptado con AES-256-GCM en el server
      isActive: boolean,
      validatedAt: string,  // ISO timestamp de la última validación exitosa
    }
  }
}
```

> 🔴 **Seguridad:** El `apiKey` es una credencial sensible. **NUNCA** se expone al cliente. Se guarda encriptada en el JSONB y solo el servidor puede descifrarla.

### `payments.metadata` — Guardar datos de envío

```typescript
metadata: {
  // ... campos existentes de Culqi ...
  shipping: {
    carrier: 'SHALOM',
    trackingNumber?: string,     // Se llena después de despachar
    trackingUrl?: string,       // Se llena después de despachar
    dispatchedAt?: string,      // ISO timestamp cuando se despachó
    lastKnownStatus?: string,   // Cache del último estado conocido
    // Datos del comprador capturados en checkout
    recipient: {
      province: string,
      district: string,
      city: string,
      address: string,          // Agencia seleccionada
      reference?: string,
      agencyId: string,        // ID de la agencia en shalom-api.lat
      agencyName: string,
      agencyAddress: string,
    }
  }
}
```

### Alternativa: Nuevas columnas en `payments` (para mejor query)

Si se necesita filtrar/ordenar por ubicación del comprador, considerar agregar:

```typescript
buyerProvince: text('buyer_province'),
buyerDistrict: text('buyer_district'),
buyerCity: text('buyer_city'),
buyerAgencyId: text('buyer_agency_id'),
buyerAgencyName: text('buyer_agency_name'),
buyerAgencyAddress: text('buyer_agency_address'),
buyerReference: text('buyer_reference'),
```

**Tradeoff:** Más columnas = mejor query, pero más migración. Con `metadata` JSONB es más flexible pero no se puede indexar fácilmente.

---

## 🧪 3.5. Testing Strategy

### Unit Tests

| Componente            | Qué testear                      | Herramienta                    |
| --------------------- | -------------------------------- | ------------------------------ |
| `ShalomAdapter`       | Métodos con mock de fetch        | Vitest + nock                  |
| `useCheckoutShipping` | Selección de agencia, validación | Vitest + React Testing Library |
| `TrackingTimeline`    | Renderizado de estados           | Vitest + React Testing Library |

### Integration Tests

| Escenario              | Qué testear                            |
| ---------------------- | -------------------------------------- |
| Checkout flow completo | Paso 1 → Paso 2 → Pago → Crear payment |
| Despacho de pedido     | Admin crea guía → Se guarda en DB      |
| Tracking               | Consulta API → Cache → Renderizado     |

### Mock Strategy

```typescript
// Para tests sin API real de Shalom
const mockShalomAdapter = {
  createShipment: vi.fn().mockResolvedValue({
    trackingNumber: 'SHL-123456',
    trackingUrl: 'https://pro.shalom.pe/track/SHL-123456',
    guideUrl: 'https://pro.shalom.pe/guide/SHL-123456.pdf',
    carrier: 'SHALOM',
  }),
  getTracking: vi.fn().mockResolvedValue([
    { date: '2026-04-07', status: 'registered', location: 'Lima', description: 'Paquete recibido' },
    { date: '2026-04-08', status: 'in_transit', location: 'Lima', description: 'En camino' },
  ]),
  validateCredentials: vi.fn().mockResolvedValue(true),
};
```

---

## ⚡ 3.6. Caching Strategy para Polling

Para evitar saturar la API de Shalom:

```typescript
// src/lib/logistics/shalom/ShalomCache.ts
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, { data: any; timestamp: number }>();

export async function getCachedTracking(trackingNumber: string) {
  const cached = cache.get(trackingNumber);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const fresh = await shalomAdapter.getTracking(trackingNumber);
  cache.set(trackingNumber, { data: fresh, timestamp: Date.now() });
  return fresh;
}

// Invalidar cache cuando cambia el estado (opcional)
export function invalidateTrackingCache(trackingNumber: string) {
  cache.delete(trackingNumber);
}
```

### Rate Limiting

```typescript
// Exponential backoff para rate limits
async function fetchWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await sleep(1000 * Math.pow(2, i)); // 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
}
```

---

## 🏗️ 4. Arquitectura — Patrón Adaptador para Couriers

Usamos el **Patrón Adaptador** para que agregar un courier nuevo (Olva, Rappi) en el futuro sea trivial: solo implementar la interfaz.

```typescript
// src/lib/logistics/IShippingProvider.ts

export interface ShipmentPayload {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  weightKg: number;
  notes?: string;
}

export interface ShipmentResponse {
  trackingNumber: string;
  trackingUrl: string;
  guideUrl?: string; // URL al PDF de la guía
  carrier: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

export interface IShippingProvider {
  createShipment(payload: ShipmentPayload): Promise<ShipmentResponse>;
  getTracking(trackingNumber: string): Promise<TrackingEvent[]>;
  validateCredentials(): Promise<boolean>;
}
```

---

## 📁 5. Archivos a Crear y Modificar

### Entitlements

| Acción | Archivo                                                                |
| ------ | ---------------------------------------------------------------------- |
| MODIFY | `src/core/entitlements/plans.ts` — agregar `canUseShippingIntegration` |

### Capa de Logística (nueva)

| Acción | Archivo                                     |
| ------ | ------------------------------------------- |
| NEW    | `src/lib/logistics/IShippingProvider.ts`    |
| NEW    | `src/lib/logistics/encryption.ts`           |
| NEW    | `src/lib/logistics/shalom/shalom.types.ts`  |
| NEW    | `src/lib/logistics/shalom/ShalomAdapter.ts` |

### Panel Admin — Settings

| Acción | Archivo                                                  |
| ------ | -------------------------------------------------------- |
| MODIFY | `app/[slug]/settings/actions.ts` — Server Actions nuevas |
| NEW    | `app/[slug]/settings/components/IntegrationsTab/`        |

### Panel Admin — Orders

| Acción | Archivo                                            |
| ------ | -------------------------------------------------- |
| NEW    | `app/[slug]/dashboard/orders/[paymentId]/page.tsx` |

### Storefront — Tracking

| Acción | Archivo                                                                 |
| ------ | ----------------------------------------------------------------------- |
| NEW    | `app/[slug]/order/[paymentId]/track/page.tsx`                           |
| NEW    | `src/shared/components/ui/TrackingTimeline/TrackingTimeline.tsx`        |
| NEW    | `src/shared/components/ui/TrackingTimeline/TrackingTimeline.module.css` |

---

## 🔐 6. Variables de Entorno

```env
# Clave de encriptación para guardar las API Keys de Shalom de los negocios
LOGISTICS_ENCRYPTION_KEY="una-clave-de-32-caracteres-exactos"
```

---

## ❓ 7. Preguntas Abiertas (Requieren Decisión)

Estas preguntas deben responderse antes de iniciar la implementación:

### Q0 — API Real de Shalom (CRÍTICO)

> ¿Tienes acceso a la API real de Shalom Courier (`pro.shalom.pe`)? Necesitamos verificar que existe y documentar sus endpoints.

**Impacto:** Sin API real, no podemos crear guías ni calcular costos. Solo podemos usar `shalom-api.lat` para listar agencias.

- [ ] **Respuesta:**

### Q1 — Política de Pago del Envío

> ¿El costo del envío de Shalom se suma al total del checkout de nuestra plataforma, o siempre es pagado en destino por el comprador directo en la agencia de Shalom?

**Impacto:** Si el costo se suma al checkout → hay que modificar el UI del storefront para calcular y mostrar el costo antes de pagar. Si es siempre "pago en destino" → el checkout no cambia.

- [ ] **Respuesta:** Pendiente

### Q2 — Generación de Guía: Manual vs Automática

> ¿El admin genera la guía manualmente desde el panel (MVP), o se auto-genera apenas se confirma el pago en Culqi?

**Impacto:** Manual es más simple y seguro para el MVP. Automático requiere integrar un webhook de Culqi para disparar la creación.

- [ ] **Respuesta:** Pendiente

### Q3 — Seguridad del API Key

> Para la API Key de Shalom, ¿usamos `AES-256-GCM` con variable de entorno (propuesta), o preferís Supabase Vault?

- [ ] **Respuesta:** Pendiente

### Q4 — Datos del Comprador en Checkout

> ¿El checkout capturará la dirección del comprador o solo la agencia de Shalom seleccionada?

**Impacto:** Si solo es agencia → más simple. Si es dirección completa → hay que captar y validar.

- [ ] **Respuesta:** Pendiente

### Q5 — Lista de Agencias

> ¿Usamos `shalom-api.lat` para listar agencias (limitado), o esperamos tener acceso a la API real de Shalom?

- [ ] **Respuesta:** Pendiente

---

## ✅ 8. Checklist de Implementación

### Fase 0 — Investigación y Contacto (CRÍTICO - Primero)

- [ ] Contactar a Shalom (`app@shalom.com.pe`) para obtener acceso a API real
- [ ] Obtener documentación de endpoints para crear guías
- [ ] Obtener documentación de endpoints para calcular costos
- [ ] Verificar si existe webhook para auto-generar guías

### Fase 1 — Entitlements y Base

- [ ] Agregar `canUseShippingIntegration` a `BusinessEntitlements` en `plans.ts`
- [ ] Activar el entitlement en `business_pro` y `enterprise_ai`
- [ ] Crear `src/lib/logistics/encryption.ts`
- [ ] Crear `src/lib/logistics/IShippingProvider.ts`

### Fase 2 — Adaptador Shalom

- [ ] Crear `src/lib/logistics/shalom/shalom.types.ts`
- [ ] Crear `src/lib/logistics/shalom/ShalomAdapter.ts`
  - [ ] `createShipment()` — crea guía en Shalom (si API disponible)
  - [ ] `getTracking()` — recupera estados de la guía
  - [ ] `validateCredentials()` — verifica que la API Key es válida
- [ ] Crear `src/lib/logistics/shalom/ShalomAgenciesAdapter.ts` (para listar agencias desde shalom-api.lat)

### Fase 3 — Settings (Panel Admin)

- [ ] Agregar Server Actions en `settings/actions.ts`
  - [ ] `saveShippingIntegration(apiKey: string)`
  - [ ] `validateShalomApiKey()`
  - [ ] `toggleShippingIntegration(isActive: boolean)`
- [ ] Crear tab `Integrations` en Settings con la card de Shalom
- [ ] Bloqueo visual con candado para planes inferiores
- [ ] Guardado encriptado del API Key

### Fase 4 — Checkout con Envío (Storefront) - NUEVO

- [ ] Modificar `usePaymentForm.ts` para soportar paso 1 (datos de envío)
- [ ] Crear componente `ShippingAddressForm` (provincia, distrito, agencia)
- [ ] Integrar `ShalomAgenciesAdapter` para listar agencias
- [ ] Crear componente `AgencySelector` con búsqueda
- [ ] Guardar datos de envío en `payments.metadata`
- [ ] Modificar `OrderSummary` para mostrar costo de envío (si aplica)
- [ ] Tests de integración del flujo checkout completo

### Fase 5 — Despacho de Pedidos (Dashboard)

- [ ] Crear ruta `/[slug]/dashboard/orders/[paymentId]/`
- [ ] Botón y modal de "Despachar con Shalom"
- [ ] Server Action que invoca `ShalomAdapter.createShipment()` y guarda en `payments.metadata`
- [ ] Actualizar status a `not_delivered` cuando se despacha

### Fase 6 — Tracking del Comprador (Storefront)

- [ ] Crear ruta `/[slug]/order/[paymentId]/track/`
- [ ] Server Action que invoca `ShalomAdapter.getTracking()` con cache
- [ ] Crear componente `TrackingTimeline` con diseño premium animado
- [ ] Implementar polling con cache de 5 minutos

---

## 📱 8.5. Especificación Detallada de UI

### Design Tokens (Material Design 3)

```css
/* Colores del módulo de envío */
:root {
  /* Primary */
  --shipping-primary: var(--md-sys-color-primary);
  --shipping-on-primary: var(--md-sys-color-on-primary);
  --shipping-primary-container: var(--md-sys-color-primary-container);
  --shipping-on-primary-container: var(--md-sys-color-on-primary-container);

  /* Secondary */
  --shipping-secondary: var(--md-sys-color-secondary);
  --shipping-on-secondary: var(--md-sys-color-on-secondary);

  /* Tertiary - Para badges y estados */
  --shipping-tertiary: var(--md-sys-color-tertiary);

  /* Surface */
  --shipping-surface: var(--md-sys-color-surface);
  --shipping-surface-variant: var(--md-sys-color-surface-variant);
  --shipping-on-surface: var(--md-sys-color-on-surface);
  --shipping-on-surface-variant: var(--md-sys-color-on-surface-variant);

  /* Status colors */
  --shipping-status-registered: #4caf50; /* Verde */
  --shipping-status-in-transit: #2196f3; /* Azul */
  --shipping-status-arrived: #ff9800; /* Naranja */
  --shipping-status-delivered: #4caf50; /* Verde */
  --shipping-status-error: #f44336; /* Rojo */

  /* Spacing */
  --shipping-space-xs: 4px;
  --shipping-space-sm: 8px;
  --shipping-space-md: 16px;
  --shipping-space-lg: 24px;
  --shipping-space-xl: 32px;

  /* Border radius */
  --shipping-radius-sm: 8px;
  --shipping-radius-md: 12px;
  --shipping-radius-lg: 16px;
  --shipping-radius-xl: 24px;
}
```

### Estructura de Archivos Final

```
src/
├── lib/
│   └── logistics/
│       ├── IShippingProvider.ts          # Interfaz del adaptador
│       ├── encryption.ts                  # Encriptación AES
│       ├── shalom/
│       │   ├── shalom.types.ts           # Tipos de Shalom
│       │   ├── ShalomAdapter.ts         # Adaptador principal
│       │   ├── ShalomAgenciesAdapter.ts  # Adaptador de agencias (shalom-api.lat)
│       │   ├── ShalomCache.ts           # Cache para polling
│       │   └── mockData.ts              # Datos mock para desarrollo
│       └── index.ts                      # Exports
│
app/
├── [slug]/
│   └── payment/
│       ├── components/
│       │   ├── ShippingAddressForm.tsx   # Formulario de envío
│       │   ├── ProvinceSelector.tsx       # Selector departamento
│       │   ├── DistrictSelector.tsx       # Selector provincia
│       │   ├── CitySelector.tsx           # Selector ciudad
│       │   ├── AgencySelector.tsx         # Selector de agencia
│       │   ├── AgencyCard.tsx             # Card de agencia
│       │   ├── ShippingSummary.tsx         # Resumen de envío
│       │   ├── CheckoutProgress.tsx       # Indicador de pasos
│       │   ├── PaymentStep.tsx            # Paso de pago (modificado)
│       │   └── index.ts                   # Exports
│       ├── hooks/
│       │   ├── useCheckoutShipping.ts      # Hook de envío
│       │   ├── useAgencies.ts            # Hook de agencias
│       │   └── index.ts                  # Exports
│       ├── actions/
│       │   └── shippingActions.ts         # Server Actions de envío
│       └── services/
│           └── shalomService.ts           # Servicio de Shalom
│
│   └── settings/
│       └── components/
│           └── IntegrationsTab/
│               ├── IntegrationsTab.tsx    # Tab de integraciones
│               ├── ShalomConfigCard.tsx   # Card de configuración
│               └── index.ts               # Exports
│
│   └── dashboard/
│       └── orders/
│           ├── components/
│           │   ├── DispatchModal.tsx     # Modal de despacho
│           │   ├── ShippingStatusBadge.tsx # Badge de estado
│           │   └── index.ts              # Exports
│           └── [paymentId]/
│               └── page.tsx               # Detalle de pedido
│
│   └── order/
│       └── [paymentId]/
│           └── track/
│               └── page.tsx              # Página de tracking
│
src/
└── shared/
    └── components/
        └── ui/
            └── TrackingTimeline/
                ├── TrackingTimeline.tsx   # Timeline principal
                ├── TrackingStatusCard.tsx # Card de estado
                ├── TrackingEmptyState.tsx # Estado vacío
                ├── TrackingDetails.tsx     # Detalles del envío
                ├── TrackingTimeline.module.css
                └── index.ts              # Exports
```

### Componente: ShippingAddressForm

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📍 Datos de envío                                            │
│                                                                 │
│  Completa la información para encontrar la agencia              │
│  Shalom más cercana a tu ubicación.                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Departamento*                                          │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Selecciona departamento                        ▾ ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Provincia*                                              │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Selecciona provincia                             ▾ ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Distrito*                                               │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Selecciona distrito                              ▾ ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📬 Agencias Shalom disponibles en esta zona                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔍 Buscar agencia...                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○  SHALOM Lima Centro                                 │   │
│  │     Av. Brasil 1234, Lima                             │   │
│  │     📞 (01) 234-5678 · L-S 9am-7pm                  │   │
│  │     📍 2.3 km de ti                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ●  SHALOM Centro de Lima ⭐ Recomendada              │   │
│  │     Av. Bolivia 567, Lima                             │   │
│  │     📞 (01) 345-6789 · L-S 9am-7pm                  │   │
│  │     📍 1.8 km de ti                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○  SHALOM Breña                                       │   │
│  │     Av. Brasil 890, Breña                             │   │
│  │     📞 (01) 456-7890 · L-S 9am-7pm                  │   │
│  │     📍 3.1 km de ti                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Referencia (opcional)                                  │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Ej: Frente al parque, edificio azul, 3er piso   ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                        [Continuar al pago →]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componente: AgencyCard

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ○ / ●  SHALOM Lima Centro                                    │
│      │                                                        │
│      └── Si seleccionado: borde primary, fondo primary-container│
│      └── Si no seleccionado: borde transparente                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  🏢 SHALOM Lima Centro                    ⭐ Recomendada │   │
│  │                                                          │   │
│  │  📍 Av. Brasil 1234, Lima                              │   │
│  │                                                          │   │
│  │  📞 (01) 234-5678                                       │   │
│  │                                                          │   │
│  │  🕐 L-S 9am-7pm · D 9am-1pm                          │   │
│  │                                                          │   │
│  │  📍 2.3 km de tu ubicación                             │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │ 🗺️ Cómo llegar │  │  📋 Más información       │   │   │
│  │  └─────────────────┘  └─────────────────────────────┘   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Estados:                                                       │
│  - Default: bg-surface, border-outline                          │
│  - Hover: bg-surface-variant, cursor pointer                   │
│  - Selected: border-2 primary, bg-primary-container            │
│  - Disabled: opacity 0.38, cursor not-allowed                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componente: TrackingTimeline

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📦 Seguimiento de tu pedido                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Número de seguimiento: SHL-20260407ABC                  │   │
│  │  Estado actual: ✅ Entregado                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ╔═════════════════════════════════════════════════════════════╗   │
│  ║                                                             ║   │
│  ║  ✅ ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○  🚚    ║   │
│  ║     │                              │              │     ║   │
│  ║  📦 │                              │              │     ║   │
│  ║  Registro   │                   │              │     ║   │
│  ║  7 Abr     │                   │              │     ║   │
│  ║  10:30 am  │                   │              │     ║   │
│  ║  Lima       │                   │              │     ║   │
│  ║             │   🚚━━━━━━━━━━━━━━━━              │     ║   │
│  ║             │   En tránsito                        │     ║   │
│  ║             │   7 Abr                              │     ║   │
│  ║             │   2:00 pm                            │     ║   │
│  ║             │   Lima → San Miguel                  │     ║   │
│  ║             │                   ✅                  │     ║   │
│  ║             │                   Entregado           │     ║   │
│  ║             │                   8 Abr              │     ║   │
│  ║             │                   3:30 pm             │     ║   │
│  ║             │                   San Miguel          │     ║   │
│  ║                                                             ║   │
│  ╚═════════════════════════════════════════════════════════════╝   │
│                                                                 │
│  Detalle del último estado:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Entregado exitosamente                               │   │
│  │                                                          │   │
│  │  El paquete fue entregado al destinatario en la          │   │
│  │  agencia SHALOM San Miguel.                              │   │
│  │                                                          │   │
│  │  📅 8 de Abril, 2026 a las 3:30 pm                    │   │
│  │  📍 Agencia San Miguel, Av. La Marina 567               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Información del envío                              │   │
│  │                                                          │   │
│  │  Remitente:     Tienda de Ropa XYZ                      │   │
│  │  Destinatario:  Juan Pérez                              │   │
│  │  Agencia:       SHALOM San Miguel                        │   │
│  │  Fecha envío:    7 de Abril, 2026                        │   │
│  │  Fecha entrega: 8 de Abril, 2026                         │   │
│  │                                                          │   │
│  │  [📄 Descargar guía]  [📱 Compartir]  [❓ Ayuda]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Animaciones:
- Punto activo: pulse animation (scale 1 → 1.2 → 1, 2s infinite)
- Línea completada: gradient de primary a tertiary
- Entrada de eventos: fadeIn + slideUp (stagger 100ms)
```

### Componente: DispatchModal (Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🚚 Despachar con Shalom                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦 Información del pedido #PAY-20260407ABC              │   │
│  │                                                          │   │
│  │  Producto:      Zara Camisa Azul - Talle M               │   │
│  │  Cantidad:     1                                        │   │
│  │  Cliente:      Juan Pérez                                │   │
│  │  Email:        juan@email.com                           │   │
│  │  WhatsApp:     999 888 777                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📍 Datos del envío                                     │   │
│  │                                                          │   │
│  │  Agencia destino:*                                        │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ SHALOM San Miguel - Av. La Marina 567     ▾    ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Datos del destinatario:                                │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Juan Pérez                                       ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Peso estimado (kg):*                                   │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ 1.5                                          ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Notas para el courier (opcional):                       │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │ Manejar con cuidado, contiene ropa frágil           ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Resumen                                            │   │
│  │                                                          │   │
│  │  Costo de envío estimado:        S/ 15.00              │   │
│  │  (El costo se paga en la agencia)                        │   │
│  │                                                          │   │
│  │  ⚠️ Una vez despachado, no se puede cancelar.         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                        [Cancelar]        [Despachar →]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componente: IntegrationsTab (Settings)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔗 Integraciones                                             │
│                                                                 │
│  Conecta tu tienda con servicios externos para                  │
│  potenciar tus ventas y logística.                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🚚 Shalom Courier                                     │   │
│  │                                                          │   │
│  │  Gestiona tus envíos de forma sencilla.                  │   │
│  │                                                          │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  ✅ Conectado       │  │  Toggle: [ON ]         │  │   │
│  │  │  Válido hasta:     │  │                         │  │   │
│  │  │  07/04/2026        │  │                         │  │   │
│  │  └─────────────────────┘  └─────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │  🔑 API Key                                     │  │   │
│  │  │  ┌─────────────────────────────────────────┐   │  │   │
│  │  │  │ SHALOM_live_abc123xyz...           👁️  │   │  │   │
│  │  │  └─────────────────────────────────────────┘   │  │   │
│  │  │  [Guardar]  [Validar conexión]                │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  [⚙️ Configurar]  [📊 Estadísticas]  [🗑️ Desconectar]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔒 Plan requerido: Business Pro o superior              │   │
│  │                                                          │   │
│  │  Tu plan actual: Emprendedor                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  ⭐ Actualiza a Business Pro para desbloquear    │   │   │
│  │  │  esta y otras funciones premium.                 │   │   │
│  │  │  [Actualizar plan]                              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 8.5. Componentes de UI a Implementar (Sin API)

> **Estrategia:** Implementar toda la UI y mocks mientras esperamos la API real de Vero.
> Una vez disponible la API, solo se reemplazan los mocks con llamadas reales.

### Componentes del Checkout

| Componente            | Archivo                                                 | Descripción                    | Estado       |
| --------------------- | ------------------------------------------------------- | ------------------------------ | ------------ |
| `ShippingAddressForm` | `app/[slug]/payment/components/ShippingAddressForm.tsx` | Formulario de ubicación        | 🔲 Pendiente |
| `ProvinceSelector`    | `app/[slug]/payment/components/ProvinceSelector.tsx`    | Dropdown de departamentos      | 🔲 Pendiente |
| `DistrictSelector`    | `app/[slug]/payment/components/DistrictSelector.tsx`    | Dropdown de distritos          | 🔲 Pendiente |
| `AgencySelector`      | `app/[slug]/payment/components/AgencySelector.tsx`      | Lista de agencias con búsqueda | 🔲 Pendiente |
| `AgencyCard`          | `app/[slug]/payment/components/AgencyCard.tsx`          | Card de agencia individual     | 🔲 Pendiente |
| `ShippingSummary`     | `app/[slug]/payment/components/ShippingSummary.tsx`     | Resumen de envío en checkout   | 🔲 Pendiente |
| `CheckoutProgress`    | `app/[slug]/payment/components/CheckoutProgress.tsx`    | Indicador de pasos 1/2         | 🔲 Pendiente |

### Componentes del Dashboard (Admin)

| Componente            | Archivo                                                          | Descripción                  | Estado       |
| --------------------- | ---------------------------------------------------------------- | ---------------------------- | ------------ |
| `IntegrationsTab`     | `app/[slug]/settings/components/IntegrationsTab.tsx`             | Tab de integraciones         | 🔲 Pendiente |
| `ShalomConfigCard`    | `app/[slug]/settings/components/ShalomConfigCard.tsx`            | Card de configuración Shalom | 🔲 Pendiente |
| `DispatchModal`       | `app/[slug]/dashboard/orders/components/DispatchModal.tsx`       | Modal para despachar         | 🔲 Pendiente |
| `ShippingStatusBadge` | `app/[slug]/dashboard/orders/components/ShippingStatusBadge.tsx` | Badge de estado de envío     | 🔲 Pendiente |

### Componentes del Storefront (Tracking)

| Componente           | Archivo                                                            | Descripción         | Estado       |
| -------------------- | ------------------------------------------------------------------ | ------------------- | ------------ |
| `TrackingTimeline`   | `src/shared/components/ui/TrackingTimeline/TrackingTimeline.tsx`   | Timeline animado    | 🔲 Pendiente |
| `TrackingStatusCard` | `src/shared/components/ui/TrackingTimeline/TrackingStatusCard.tsx` | Card de estado      | 🔲 Pendiente |
| `TrackingEmptyState` | `src/shared/components/ui/TrackingTimeline/TrackingEmptyState.tsx` | Estado sin tracking | 🔲 Pendiente |

### Mock Data para Desarrollo

```typescript
// src/lib/logistics/shalom/mockData.ts

export const MOCK_AGENCIES = [
  {
    ter_id: '1',
    lugar_over: 'SHALOM Lima Centro',
    direccion: 'Av. Brasil 1234, Lima',
    zona: 'Centro',
    provincia: 'Lima',
    departamento: 'Lima',
    telefono: '01-234-5678',
    hora_atencion: 'L-S 9am-7pm',
    hora_domingo: 'Cerrado',
    latitud: '-12.0464',
    longitud: '-77.0428',
  },
  {
    ter_id: '2',
    lugar_over: 'SHALOM San Miguel',
    direccion: 'Av. La Marina 567, San Miguel',
    zona: 'Norte',
    provincia: 'Lima',
    departamento: 'Lima',
    telefono: '01-345-6789',
    hora_atencion: 'L-S 9am-7pm',
    hora_domingo: '9am-1pm',
    latitud: '-12.0755',
    longitud: '-77.0780',
  },
  // ... más agencias mock
];

export const MOCK_TRACKING_EVENTS = [
  {
    date: '2026-04-07T10:30:00',
    status: 'registered',
    location: 'Lima Centro',
    description: 'Paquete registrado en agencia origen',
  },
  {
    date: '2026-04-07T14:00:00',
    status: 'in_transit',
    location: 'Lima',
    description: 'Paquete en tránsito a agencia destino',
  },
  {
    date: '2026-04-08T09:00:00',
    status: 'arrived',
    location: 'San Miguel',
    description: 'Paquete llegó a agencia destino',
  },
  {
    date: '2026-04-08T15:30:00',
    status: 'delivered',
    location: 'San Miguel',
    description: 'Paquete entregado al destinatario',
  },
];

export const PERU_PROVINCES = [
  { code: 'LIMA', name: 'Lima' },
  { code: 'CALLAO', name: 'Callao' },
  { code: 'AREQUIPA', name: 'Arequipa' },
  { code: 'TRUJILLO', name: 'Trujillo' },
  // ... más provincias
];

export const LIMA_DISTRICTS = [
  { code: 'LIMA', name: 'Lima' },
  { code: 'SAN_MIGUEL', name: 'San Miguel' },
  { code: 'MIRAFLORES', name: 'Miraflores' },
  { code: 'SURCO', name: 'Santiago de Surco' },
  { code: 'SAN_JUAN_LURIGANCHO', name: 'San Juan de Lurigancho' },
  // ... más distritos
];
```

### Hooks a Implementar

```typescript
// app/[slug]/payment/hooks/useCheckoutShipping.ts

interface UseCheckoutShippingReturn {
  // Estado
  selectedProvince: string | null;
  selectedDistrict: string | null;
  selectedAgency: Agency | null;
  agencies: Agency[];
  isLoadingAgencies: boolean;

  // Acciones
  setProvince: (code: string) => void;
  setDistrict: (code: string) => void;
  setAgency: (agency: Agency) => void;

  // Helpers
  districts: District[];
  canProceedToPayment: boolean;
}

// Uso en el componente
const {
  selectedProvince,
  selectedDistrict,
  selectedAgency,
  setProvince,
  setDistrict,
  setAgency,
  canProceedToPayment,
} = useCheckoutShipping();
```

### API Adapter (Mock para desarrollo, real después)

```typescript
// src/lib/logistics/shalom/ShalomAdapter.ts

export class ShalomAdapter implements IShippingProvider {
  // Por ahora usa mock data
  // Cuando Vero responda con la API real, solo cambiar estos métodos

  async listAgencies(params: { province?: string; district?: string }): Promise<Agency[]> {
    // MOCK: Return filtered mock data
    // TODO: Replace with real API call when Vero provides access
    return this.mockListAgencies(params);
  }

  async createShipment(payload: ShipmentPayload): Promise<ShipmentResponse> {
    // MOCK: Return fake tracking number
    // TODO: Replace with real API call
    return {
      trackingNumber: `SHL-${Date.now()}`,
      trackingUrl: `https://pro.shalom.pe/track/SHL-${Date.now()}`,
      guideUrl: `https://pro.shalom.pe/guide/SHL-${Date.now()}.pdf`,
      carrier: 'SHALOM',
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingEvent[]> {
    // MOCK: Return mock events
    // TODO: Replace with real API call
    return MOCK_TRACKING_EVENTS;
  }

  async validateCredentials(apiKey: string): Promise<boolean> {
    // MOCK: Always return true for development
    // TODO: Replace with real validation
    return apiKey.startsWith('SHALOM_');
  }
}
```

---

## 📊 9. Métricas de Éxito

| Métrica                          | Target  | Cómo medir                          |
| -------------------------------- | ------- | ----------------------------------- |
| Guías creadas exitosamente       | > 90%   | Counter en `createShipment` exitoso |
| Tracking queries exitosas        | > 95%   | Success rate de `getTracking`       |
| Tiempo de respuesta API          | < 500ms | P99 latency                         |
| Checkout con envío completado    | > 70%   | Funnel analytics                    |
| Errores de validación de API Key | < 1%    | Counter en `validateCredentials`    |

---

## 🔄 10. Rollback Plan

Si la implementación falla en producción:

1. **Deshabilitar feature flag** `SHIPPING_INTEGRATION_ENABLED=false`
2. **Revertir migrations** de entitlements (si se agregaron columnas)
3. **Mantener backwards compatibility** con pagos existentes (el campo `metadata` es optional)
4. **No удалить datos** — solo desactivar la UI, los datos en DB permanecen

---

---

## 🎨 10. UI del Checkout (Wireframes)

### Paso 1: Selección de Agencia

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver al producto                                           │
│                                                                 │
│  📍 ¿A dónde enviamos tu pedido?                               │
│                                                                 │
│  Completa los datos para encontrar la agencia Shalom            │
│  más cercana a tu ubicación.                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📍 Tu ubicación                                          │ │
│  │                                                           │ │
│  │ Departamento:*                                            │ │
│  │ [Lima                                                  ▾]│ │
│  │                                                           │ │
│  │ Provincia:*                                               │ │
│  │ [Lima                                                   ▾]│ │
│  │                                                           │ │
│  │ Distrito:*                                                │ │
│  │ [San Juan de Lurigancho                                ▾]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📬 Agencias Shalom disponibles                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ○  SHALOM San Juan de Lurigancho                        │ │
│  │     Av. Gran Chimú 456, San Juan de Lurigancho          │ │
│  │     📞 (01) 606-0000 · Horario: L-S 9am-7pm            │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ●  SHALOM Centro de Lima 🗸 Recomendada                 │ │
│  │     Av. Brasil 1234, Centro de Lima                      │ │
│  │     📞 (01) 606-0000 · Horario: L-S 9am-7pm            │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ○  SHALOM San Miguel                                    │ │
│  │     Av. La Marina 789, San Miguel                        │ │
│  │     📞 (01) 606-0000 · Horario: L-S 9am-7pm            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📝 Referencia de dirección (opcional)                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Frente al mercado, edificio azul, 3er piso               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                          [Continuar con el pago →]              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💳 Tarjeta   ●●●○  Yape/Plin                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 2: Confirmación y Pago

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver                                                   │
│                                                                 │
│  📋 Revisa tu pedido                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📦 Zara Camisa Azul - Talle M                             │ │
│  │    Cantidad: 1                                            │ │
│  │    Subtotal:                                 S/ 89.00     │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 📬 Envío a agencia Shalom                                 │ │
│  │    SHALOM Centro de Lima                                  │ │
│  │    Av. Brasil 1234, Centro de Lima                       │ │
│  │    Envío:                                    S/ 15.00    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 💰 TOTAL A PAGAR:                           S/ 104.00    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📱 Datos de contacto                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📧 Email:*                                               │ │
│  │  [tu@email.com                                          ]│ │
│  │                                                           │ │
│  │  📱 WhatsApp:*                                           │ │
│  │  [999 888 777                                           ]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  💳 Yape / Plin / Tarjeta                               │ │
│  │                                                           │ │
│  │  Número de Yape/Plin:                                   │ │
│  │  [999 888 777                                           ]│ │
│  │                                                           │ │
│  │  Subir comprobante de pago:                              │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │     📷 Subir imagen o PDF                       │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                          [Pagar S/ 104.00]                     │
│                                                                 │
│  🔒 Tus datos están seguros. Pagos procesados por Culqi.       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 11. UI del TrackingTimeline (Referencia)

```
┌─────────────────────────────────────────┐
│  Seguimiento de tu pedido #ABC-123      │
│                                         │
│  ✅ Paquete registrado                  │
│     7 Abril · Lima Centro               │
│     |                                   │
│  🚚 En ruta  ← (activo, pulse)          │
│     8 Abril · En tránsito               │
│     |                                   │
│  ○  En agencia destino                  │
│     (pendiente)                         │
│     |                                   │
│  ○  Entregado                           │
│     (pendiente)                         │
└─────────────────────────────────────────┘
```

---

## 📊 12. Progreso de Implementación

### Estrategia Actual

> 🎯 **Mientras esperamos a Vero con la API real, implementamos toda la UI con mock data.**
> Una vez tengamos los endpoints de Shalom, solo conectamos las llamadas reales.

### UI - Checkout (7 componentes)

| #   | Componente            | Estado       | Prioridad |
| --- | --------------------- | ------------ | --------- |
| 1   | `ShippingAddressForm` | 🔲 Pendiente | 🔴 Alta   |
| 2   | `ProvinceSelector`    | 🔲 Pendiente | 🔴 Alta   |
| 3   | `DistrictSelector`    | 🔲 Pendiente | 🔴 Alta   |
| 4   | `AgencySelector`      | 🔲 Pendiente | 🔴 Alta   |
| 5   | `AgencyCard`          | 🔲 Pendiente | 🔴 Alta   |
| 6   | `CheckoutProgress`    | 🔲 Pendiente | 🟡 Media  |
| 7   | `ShippingSummary`     | 🔲 Pendiente | 🟡 Media  |

### UI - Admin Dashboard (4 componentes)

| #   | Componente            | Estado       | Prioridad |
| --- | --------------------- | ------------ | --------- |
| 1   | `IntegrationsTab`     | 🔲 Pendiente | 🔴 Alta   |
| 2   | `ShalomConfigCard`    | 🔲 Pendiente | 🔴 Alta   |
| 3   | `DispatchModal`       | 🔲 Pendiente | 🔴 Alta   |
| 4   | `ShippingStatusBadge` | 🔲 Pendiente | 🟡 Media  |

### UI - Tracking (4 componentes)

| #   | Componente           | Estado       | Prioridad |
| --- | -------------------- | ------------ | --------- |
| 1   | `TrackingTimeline`   | 🔲 Pendiente | 🔴 Alta   |
| 2   | `TrackingStatusCard` | 🔲 Pendiente | 🔴 Alta   |
| 3   | `TrackingEmptyState` | 🔲 Pendiente | 🟡 Media  |
| 4   | `TrackingDetails`    | 🔲 Pendiente | 🟡 Media  |

### Lógica (4 items)

| #   | Componente             | Estado       | Prioridad |
| --- | ---------------------- | ------------ | --------- |
| 1   | `useCheckoutShipping`  | 🔲 Pendiente | 🔴 Alta   |
| 2   | `useAgencies`          | 🔲 Pendiente | 🔴 Alta   |
| 3   | `ShalomAdapter` (mock) | 🔲 Pendiente | 🔴 Alta   |
| 4   | `ShalomCache`          | 🔲 Pendiente | 🟡 Media  |

### Base (3 items)

| #   | Componente                      | Estado       | Prioridad |
| --- | ------------------------------- | ------------ | --------- |
| 1   | `IShippingProvider`             | 🔲 Pendiente | 🔴 Alta   |
| 2   | Entitlements (`canUseShipping`) | 🔲 Pendiente | 🔴 Alta   |
| 3   | `mockData` (agencias, tracking) | 🔲 Pendiente | 🔴 Alta   |

---

## 📝 Resumen de lo Agregado al Plan

| Sección                    | Contenido                                                                         |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Estado**                 | 🚧 En desarrollo - UI en progreso, esperando API de Vero                          |
| **Investigación API**      | Descubrimiento que shalom-api.lat NO es oficial                                   |
| **Checkout actual**        | Gap analysis - no captura dirección                                               |
| **Flujo de checkout**      | Wireframes detallados de los 2 pasos                                              |
| **Estructura de archivos** | Árbol completo de todos los archivos a crear                                      |
| **Design tokens**          | Colores, spacing, estados para UI                                                 |
| **Wireframes ASCII**       | ShippingAddressForm, AgencyCard, TrackingTimeline, DispatchModal, IntegrationsTab |
| **Mock data**              | Datos de prueba para desarrollo offline                                           |
| **Hooks**                  | Interfaces de useCheckoutShipping                                                 |
| **Adapter mock**           | ShalomAdapter con datos fake                                                      |
| **Progreso**               | Tabla de 22 items por implementar                                                 |

---

_Documento actualizado: 2026-04-07 · Store_Lite · Integración Shalom Courier_

**Changelog:**

- 2026-04-07: Agregada investigación de shalom-api.lat (NO es oficial)
- 2026-04-07: Agregado análisis del checkout actual (no captura dirección)
- 2026-04-07: Agregado flujo de checkout en 2 pasos propuesto por usuario
- 2026-04-07: Agregada sección de Testing Strategy
- 2026-04-07: Agregada sección de Caching Strategy
- 2026-04-07: Agregadas métricas de éxito y rollback plan
- 2026-04-07: Agregados wireframes de UI del checkout
- 2026-04-07: Agregadas Q4, Q5 en preguntas abiertas
- 2026-04-07: Contacto establecido con Vero (Shalom) - esperando API
- 2026-04-07: Agregada estructura de archivos completa
- 2026-04-07: Agregadas especificaciones detalladas de UI (wireframes ASCII)
- 2026-04-07: Agregado mockData para desarrollo offline
- 2026-04-07: Agregada tabla de progreso de implementación (22 items)
- 2026-04-07: Estrategia: implementar UI + mocks primero, conectar API después
