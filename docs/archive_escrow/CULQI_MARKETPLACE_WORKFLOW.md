# 💸 Store Lite: Flujo de Pagos Marketplace (Split Payments)

Este documento describe la arquitectura financiera y legal para el cobro de comisiones (10%) y la dispersión de fondos a los negocios afiliados usando **Culqi Marketplace**.

---

## 1. Modelo de Negocio: Marketplace / Agregador

A diferencia de un modelo SaaS simple donde el negocio usa su propia llave, en el modelo **Marketplace**:

1. **Store Lite (SaaS)** es el "Comercio Principal" (Padre).
2. **Cada Negocio (Tienda)** es un "Comercio Secundario" (Hijo).

### Ventajas:

- **Automatización**: El cobro del 10% de comisión es instantáneo y automático.
- **Seguridad**: El SaaS no tiene que "pedirle" la comisión al negocio; Culqi la separa en el origen.
- **Legalidad**: Cada parte declara solo lo que le corresponde ante la SUNAT.

---

## 2. Flujo de Dinero (Ejemplo S/ 100.00)

Cuando un cliente final compra un producto en una tienda de Store Lite:

1. **Transacción Única**: El cliente paga **S/ 100.00** en una sola operación.
2. **Split de Culqi (División)**:
   - **Comisión Culqi (Aprox. 4.10%)**: S/ 4.10 (Se queda en Culqi).
   - **Comisión Store Lite (10%)**: S/ 10.00 (Va a tu cuenta de SaaS).
   - **Neto para el Negocio (85.9%)**: S/ 85.90 (Va a la cuenta del dueño de la tienda).
3. **Liquidación**: Culqi deposita automáticamente a cada cuenta en 2 días hábiles (o el mismo día si es BCP).

---

## 3. Lógica de Impuestos (SUNAT - Perú)

Para cumplir con la ley peruana, la facturación se divide así:

### A. El Negocio -> Al Cliente Final

- **Monto**: S/ 100.00 (Total de la venta).
- **Documento**: Boleta o Factura electrónica.
- **Responsabilidad**: El negocio declara el IGV (18%) de la venta total.

### B. Store Lite (SaaS) -> Al Negocio

- **Monto**: S/ 10.00 (Tu comisión del 10%).
- **Documento**: Factura por "Servicio de Intermediación Digital / Uso de Plataforma".
- **Responsabilidad**: Vos declarás el IGV de esos S/ 10.00. Para el negocio, esta factura es un **gasto deducible**.

---

## 4. Implementación Técnica (API)

### Requisitos:

1. **Cuenta Marketplace en Culqi**: Debes solicitar la activación del perfil "Marketplace" o "Agregador" al equipo comercial de Culqi.
2. **Merchant ID**: Cada negocio debe proveer su "ID de Comercio" (pueden crearse vía API o manualmente en el panel de Culqi).

### Estructura del Cargo (`/charges`):

```json
{
  "amount": 10000,
  "currency_code": "PEN",
  "email": "comprador@email.com",
  "source_id": "tkn_test_...",
  "transfer_data": {
    "destination_id": "mcht_test_ABC123", // El Merchant ID del negocio
    "amount": 9000 // Los S/ 90.00 que le corresponden al negocio
  },
  "metadata": {
    "commission_amount": 1000, // S/ 10.00 para nosotros
    "platform": "store-lite"
  }
}
```

---

## 5. Cambios en Base de Datos

- **Tabla `business_settings`**:
  - Eliminar: `culqi_secret_key` (Ya no la necesitamos, usamos la nuestra).
  - Agregar: `culqi_merchant_id` (Identificador único del negocio en Culqi).
  - Agregar: `commission_percentage` (Default: 10).

---

_Nota: Este modelo protege el flujo de caja del SaaS y garantiza el cobro de comisiones sin fricción con el usuario final._
