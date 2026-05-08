# Plan de Implementación: KYB & Verificación OTP (Store Lite)

Este documento sirve como hoja de ruta técnica para implementar el sistema de alta seguridad en el onboarding de negocios, utilizando las APIs de Factiliza (Consulta + WhatsApp).

---

## 🏗️ Lógica del Flujo de Onboarding (La "Bóveda")

El proceso de registro de un negocio (merchant) pasa de ser un simple formulario a un proceso de verificación de 3 barreras:

1. **Barrera 1 (SUNAT):** ¿La empresa existe y está legalmente apta?
2. **Barrera 2 (RENIEC/Representante):** ¿La persona que se registra es legalmente la dueña/representante?
3. **Barrera 3 (Posesión/OTP):** ¿El número de contacto proporcionado realmente le pertenece a esa persona?

Si el usuario falla en alguna barrera, la creación del negocio se bloquea o queda en estado `rejected` / `pending_manual_review`.

---

## 🧭 Flujo del Wizard de Registro (UX Actualizado)

El usuario registrado con Google creará un negocio a través de un Wizard de 4 pasos. **Importante:** Se diferencian los datos del **Representante** (humano) de los datos del **Negocio** (entidad comercial).

### Paso 1: Tipo de Persona y Validación de Identidad

- **Selector Inicial:** El usuario elige si es **Persona Natural** o **Persona Jurídica**.
  - _Persona Natural:_ Input valida 8 dígitos (DNI).
  - _Persona Jurídica:_ Input valida 11 dígitos (RUC).
- **Botón "Verificar":**
  - Llama a `/ruc/info/{ruc}` (Jurídica) o `/dni/info/{dni}` (Natural).
  - Si es correcto, muestra un **Dialog no cerrable** (tipo modal bloqueante) que muestra los datos oficiales (Razón Social, Estado, Condición).
  - Para continuar, el usuario DEBE ingresar un NUEVO RUC/DNI o confirmar (el diálogo se cierra solo si los datos base son correctos y no se pueden editar libremente).

### Paso 2: Datos del Representante y del Negocio

- **Representante (Humano):**
  - _Persona Natural:_ Ingresa sus nombres completos (se pueden prefillar con `/dni/info/{dni}`).
  - _Persona Jurídica:_ Ingresa DNI del representante. Se valida contra `/ruc/representante/{ruc}` para asegurar que el DNI esté en la lista de representantes legales.
- **Datos del Negocio (Entidad):**
  - _Persona Natural:_ No aplica o campos mínimos.
  - _Persona Jurídica:_ Nombre comercial, Dirección (Departamento < Provincia < Distrito).
  - **Optimización:** Los campos de dirección y nombre pueden ser prefill (autocompletados) con los datos que devuelve la API de Factiliza (solo lectura o editables con precaución). **SÍ se guardan estos datos** en `verificationData` para auditoría, pero el password/no se guardan credenciales sensibles.

### Paso 3: Contacto del Representante y OTP

- **Teléfono del Representante:** Input para el número de contacto del humano que se registra.
  - Botón "Enviar OTP".
  - Llama a `/message/sendtext/{inst}` de Factiliza para enviar código de 6 dígitos por WhatsApp.
  - Se abre un **Modal** para ingresar el código de 6 dígitos.
  - Valida el OTP contra el caché (Map/Redis).
- **Email del Representante:** Input de email (por ahora sin validación OTP, solo formato).

### Paso 4: Contacto del Negocio y Confirmación

- **Teléfono del Negocio:** Input para contacto comercial (puede ser el mismo que el representante por defecto, pero editable).
- **Email del Negocio:** Input para contacto comercial (puede ser el mismo por defecto).
- **Términos y Condiciones:** Checkbox obligatorio.
- **Acción Final:** Al enviar, se inserta el negocio en DB con `verification_status: 'verified'` y los datos de auditoría en `verificationData`.

---

## 📡 Mapa de Endpoints (Factiliza)

| Endpoint                   | Método | Uso en Store Lite                                                           |
| :------------------------- | :----- | :-------------------------------------------------------------------------- |
| `/ruc/info/{ruc}`          | `GET`  | Extraer Razón Social, `estado` (ACTIVO) y `condicion` (HABIDO).             |
| `/ruc/representante/{ruc}` | `GET`  | Obtener la lista de representantes legales asociados al RUC (Jurídica).     |
| `/dni/info/{dni}`          | `GET`  | Extraer nombres completos para match de representante o datos Natural.      |
| `/message/sendtext/{inst}` | `POST` | (API WhatsApp) Enviar código OTP de 6 dígitos al celular del representante. |

---

## ⚡ Optimizaciones de Rendimiento (Costo Factiliza)

Cada consulta a Factiliza CUESTA DINERO. Para evitar gastos innecesarios en el SaaS:

1. **Caché con Map (Temporal):**
   - Implementar un `Map<string, { data: any, timestamp: number }>` en el servidor.
   - Si el usuario consulta el mismo RUC/DNI en menos de 5 minutos, devolver del caché sin pagar la API.
   - _Nota:_ Al pasar a producción, migrar de `Map` a **Redis** para persistencia entre instancias.

2. **Optimistic UI:**
   - Mientras Factiliza responde, mostrar spinners claros.
   - No bloquear todo el formulario; permitir que el usuario llene otros campos mientras carga la validación de identidad.

---

## 🗄️ Cambios en Base de Datos (Drizzle ORM)

Se deben realizar las siguientes modificaciones en `schema.ts`:

### Tabla `businesses`

```typescript
verificationStatus: text('verification_status', {
  enum: ['unverified', 'pending', 'verified', 'rejected']
}).notNull().default('unverified'),

verificationData: jsonb('verification_data').default({}),
/* Estructura esperada en JSONB:
{
  "ruc_estado": "ACTIVO",
  "ruc_condicion": "HABIDO",
  "representante_dni": "12345678",
  "representante_nombres": "JUAN PEREZ",
  "representante_match": true,
  "phone_representative_verified": true,
  "phone_business": "999888777",
  "email_business": "contacto@negocio.com",
  "razon_social": "NEGOCIO S.A.C.",
  "direccion_completa": "...",
  "verified_at": "ISO_DATE"
}
*/
```

---

## 📝 Lista de Tareas (Checklist de Desarrollo)

### Fase 1: Infraestructura y Servicios (Backend) ✅ COMPLETADO

- [x] Configurar variables de entorno (`FACTILIZA_TOKEN`, `FACTILIZA_WSP_INSTANCE`) en `src/config/env.ts`.
- [x] Crear cliente HTTP base para Factiliza (`src/lib/factiliza/client.ts`).
- [x] Implementar **Caché de consultas con Map** (pre-Redis) para evitar doble cobro.
- [x] Implementar servicio RUC: `getRucInfo(ruc)` y `getRucRepresentatives(ruc)`.
- [x] Implementar servicio DNI: `getDniInfo(dni)`.
- [x] Implementar servicio WhatsApp: `sendWhatsAppOTP(phone, code)`.
- [x] Crear generador criptográfico de OTP de 6 dígitos (`generateOTP`).

### Fase 2: Modificación de Base de Datos

- [ ] Agregar campos `verificationStatus` y `verificationData` a la tabla `businesses`.
- [ ] Crear tabla efímera (o usar Redis/DB) para almacenar los códigos OTP generados con tiempo de expiración (ej. 5 minutos).
- [ ] Ejecutar migraciones (`drizzle-kit generate` y `drizzle-kit push/migrate`).

### Fase 3: Lógica de Negocio (Server Actions) ✅ COMPLETADO

- [x] **Paso 1 (Tipo y RUC/DNI):** `verifyIdentityAction` en `app/actions/kyb.ts`. Valida contra SUNAT/RENIEC con caché.
- [x] **Paso 2 (Representante):** `verifyRepresentativeAction`. Cruza DNI con `/ruc/representante/{ruc}` para Jurídica.
- [x] **Paso 3 (OTP):** `requestOtpAction` y `verifyOtpAction`. Genera OTP, guarda en `verification_otps` DB, envía por WhatsApp Factiliza.
- [x] **Paso 4 (Negocio):** `createVerifiedBusinessAction`. Inserta negocio con `verification_status: 'verified'` y limpia OTPs usados.
- [x] Schemas Zod en `src/features/kyb/kyb-schemas.ts` para validación de entradas.

### Fase 4: Frontend y UI

- [ ] Actualizar `CreateBusinessForm` a un wizard de 4 pasos (Tipo/RUC → Datos → OTP → Contacto Negocio).
- [ ] UI para selector Natural/Jurídica con validación de input (8 o 11 dígitos).
- [ ] Dialog no cerrable para mostrar datos oficiales de SUNAT/RENIEC.
- [ ] Modal para ingreso de OTP (Inputs de 6 dígitos tipo PIN).
- [ ] Manejar estados de carga (Optimistic UI) y errores amigables.

---

## ⚖️ Análisis de la Solución

### Pros (Ventajas)

- **Seguridad Extrema:** Barrera de 3 pasos (SUNAT, RENIEC, OTP).
- **Diferenciación Clara:** Datos de Representante (humano) vs Negocio (entidad).
- **Calidad de Negocios:** Solo empresas Habidas/Activas operan en Store Lite.
- **Protección de Marca:** Evita estafas y protege acuerdos con Culqi.
- **Eficiencia de Costos:** Caché con Map reduce llamadas innecesarias a Factiliza.

### Contras (Desafíos)

- **Dependencia de Terceros:** Si Factiliza cae, se detiene el registro (solución: bypass manual).
- **Costo Operativo:** S/ 40 mensuales base (justificable por prevención de fraude).
- **Complejidad del Formulario:** No es "un clic", requiere wizard estructurado.

---

## 🚀 Próximo Paso Recomendado

Ejecutar la implementación progresiva, empezando por la **Fase 1 (Servicios Backend + Caché con Map)** y **Fase 2 (Base de datos)**.
