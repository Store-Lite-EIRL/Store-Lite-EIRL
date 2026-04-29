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

## 📡 Mapa de Endpoints (Factiliza)

| Endpoint                   | Método | Uso en Store Lite                                                           |
| :------------------------- | :----- | :-------------------------------------------------------------------------- |
| `/ruc/info/{ruc}`          | `GET`  | Extraer Razón Social, `estado` (ACTIVO) y `condicion` (HABIDO).             |
| `/ruc/representante/{ruc}` | `GET`  | Obtener la lista de representantes legales asociados al RUC.                |
| `/dni/info/{dni}`          | `GET`  | Extraer nombres completos para hacer _match_ con el representante legal.    |
| `/message/sendtext/{inst}` | `POST` | (API WhatsApp) Enviar código OTP de 6 dígitos al celular del representante. |

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
  "representante_match": true,
  "phone_verified": true,
  "verified_at": "ISO_DATE"
}
*/
```

---

## 📝 Lista de Tareas (Checklist de Desarrollo)

### Fase 1: Infraestructura y Servicios (Backend)

- [ ] Configurar variables de entorno (`FACTILIZA_TOKEN`, `FACTILIZA_WSP_INSTANCE`).
- [ ] Crear cliente HTTP base para Factiliza (`src/lib/factiliza/client.ts`).
- [ ] Implementar servicio RUC: `getRucInfo(ruc)` y `getRucRepresentatives(ruc)`.
- [ ] Implementar servicio DNI: `getDniInfo(dni)`.
- [ ] Implementar servicio WhatsApp: `sendWhatsAppOTP(phone, code)`.
- [ ] Crear generador criptográfico de OTP de 6 dígitos.

### Fase 2: Modificación de Base de Datos

- [ ] Agregar campos `verificationStatus` y `verificationData` a la tabla `businesses`.
- [ ] Crear tabla efímera (o usar Redis/DB) para almacenar los códigos OTP generados con tiempo de expiración (ej. 5 minutos).
- [ ] Ejecutar migraciones (`drizzle-kit generate` y `drizzle-kit push/migrate`).

### Fase 3: Lógica de Negocio (Server Actions)

- [ ] **Paso 1 del Form:** Server Action que reciba RUC. Valide contra SUNAT. Si falla, retorna error.
- [ ] **Paso 2 del Form:** Server Action que reciba DNI. Valide contra RENIEC y cruce contra los representantes legales del RUC. Si falla, retorna error.
- [ ] **Paso 3 del Form:** Server Action que genere OTP, lo guarde en DB/Cache y lo envíe por WhatsApp.
- [ ] **Paso 4 del Form:** Server Action que valide el OTP ingresado por el usuario. Si es correcto, inserta el negocio en DB con `verification_status: 'verified'`.

### Fase 4: Frontend y UI

- [ ] Actualizar el formulario de registro (`CreateBusinessForm`) a un wizard de pasos múltiples (RUC -> DNI -> Celular -> OTP).
- [ ] Crear UI para el ingreso de OTP (Inputs de 6 dígitos tipo PIN).
- [ ] Manejar estados de carga y errores amigables (ej. "RUC no encontrado o dado de baja").

---

## ⚖️ Análisis de la Solución

### Pros (Ventajas)

- **Seguridad Extrema:** Casi imposible de bypassear mediante suplantación de identidad simple.
- **Calidad de Negocios:** Asegura que solo empresas formales (Habidas/Activas) operen en Store Lite.
- **Protección de Marca:** Evita que el SaaS se vea involucrado en estafas, protegiendo los acuerdos con Culqi.
- **Fricción Controlada:** A diferencia de pedir la Clave SOL, este flujo requiere datos que un negocio legítimo tiene a mano (RUC, DNI, Celular).

### Contras (Desafíos)

- **Dependencia de Terceros:** Si el API de Factiliza se cae, el registro de negocios se detiene (solución: habilitar bypass manual en caso de caída).
- **Costo Operativo:** Implica un costo de S/ 40 mensuales base. (Justificable por la prevención de fraude).
- **Complejidad del Formulario:** El usuario no puede crear el negocio en un solo clic; debe seguir pasos estructurados.

---

## 🚀 Próximo Paso Recomendado

Ejecutar la implementación progresiva, empezando por la **Fase 1 (Servicios Backend)** y **Fase 2 (Base de datos)**.
