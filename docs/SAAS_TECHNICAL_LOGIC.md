# Arquitectura Técnica y Logística — API de Urbano Express

## 1. Capacidades de la API de Urbano (Developer)

Para soportar la lógica del negocio sin intervención manual, la plataforma STORE LITE hará uso intensivo del Portal Developer de Urbano Express (Perú). Urbano ofrece un servicio REST API que permite lo siguiente:

### A. Funciones Clave (Endpoints Oficiales)

1. **Creación de Guías (Waybill Generation - POST):**
   - Permite enviar el payload con datos de origen (tienda) y destino (comprador), dimensiones y peso, devolviendo un documento PDF/ZPL de la etiqueta y reservando un número de rastreo oficial.
2. **Consultas de Seguimiento (Tracking Pull Method - GET):**
   - Introduciendo el parámetro `tracking_number`, la API devuelve un historial JSON con todos los eventos de la caja (ej. "En Sucursal", "En Tránsito", "Entregado").
3. **Cotizador de Tarifas (Shipping Rates - POST):**
   - Evalúa origen a destino en tiempo real para sumar costos logísticos precisos en el carrito de compras (Checkout) antes de cobrar vía Culqi.

---

## 2. Lógica Técnica del Flujo (El "Autómata" de STORE LITE)

STORE LITE usará un cronjob perióduco (o Serverless Queue Trigger) para automatizar el ciclo de la venta basado en eventos de Urbano.

**Paso a paso técnico:**

1. **Pago:** Webhook de Culqi reporta `charge.succeeded`.
2. **Creación:** Inmediatamente el backend localiza la credencial en `business_integrations` y ejecuta un POST a Urbano para crear la remisión.
3. **Polling Activo:** Un servicio cada X horas/minutos hace un GET al **Tracking Pull Method** de Urbano con el array de órdenes pendientes (`status = in_delivery`).
4. **Trigger de Evento:**
   - Si JSON response de Urbano muestra `"status_code": "DELIVERED"` (o similar equivalente):
     - Transacción a DB: `UPDATE orders SET status = 'completed'`.
     - Hook paralelo: Enviar post a WhatsApp Cloud API (con el template de mensaje guardado pre-aprobado) informando al cliente.
   - Si JSON response muestra `"status_code": "RETURNED"` (Falla entrega):
     - Transacción a DB: Actualizar a estado anómalo (`delivery_failed`) e informar al negocio.

---

## 3. Modelo de Base de Datos para Integración API

Para procesar ordenadamente los datos que nos entreguen los endpoints de Urbano, nuestra base de datos SQL se estructurará con el siguiente esquema optimizado:

### `business_integrations`

Almacena con seguridad (encriptado si aplica) las llaves que le pedimos a la tienda para consumir servicios bajo su nombre comercial.

```sql
- id (UUID)
- business_id (UUID, Relación a Tenant Store)
- culqi_public_key (String)
- culqi_private_key (String)
- urbano_client_id (String)
- urbano_api_key (String)
- urbano_webhook_secret (String, Opcional)
```

### `orders`

La tabla transaccional maestro que rige qué órdenes debe consultar nuestro motor de Pull Tracking.

```sql
- id (UUID)
- business_id (UUID)
- buyer_email (String)
- buyer_phone (String, vital para WhatsApp)
- status (Enum: draft, paid, in_delivery, completed, delivery_failed, refunded)
- total_amount (Decimal)
- created_at (Timestamp)
```

### `order_fulfillments`

Tabla espejo para la logística, guardaremos los identificadores únicos que lanza Urbano para evitar doble creación.

```sql
- id (UUID)
- order_id (UUID, Relación a Order)
- provider_name (String, default 'URBANO')
- provider_waybill_id (String, Número de Guía devuelto por Urbano)
- tracking_number (String, Código rastreable para el usuario)
- current_courier_status (String, el último string exacto que devolvió el GET de Urbano)
- estimated_delivery_date (Timestamp)
- delivered_at (Timestamp, Nulo hasta que el API avise)
```

### `shipping_events` (Opcional - Historial Tracking)

Si queremos montar una UI bonita para que el comprador vea "El paquete salió de la central de Lince, etc." guardaremos el JSON parseado.

```sql
- id (UUID)
- order_fulfillment_id (UUID)
- event_code (String, ej. 'IN_SITE', 'DELIVERED')
- event_description (String)
- event_timestamp (Timestamp de Urbano)
```

---

## Conclusión Técnica

STORE LITE se comporta como un **agregador y procesador de estados**. No inventa la logística, simplemente traduce las peticiones exitosas de Culqi en órdenes de envío para Urbano, y lee las confirmaciones de Urbano como el disparador final que cierra el círculo en el software y notifica vía WhatsApp.
