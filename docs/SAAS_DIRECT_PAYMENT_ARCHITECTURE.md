# ARCHITECTURE — SaaS Direct Payment Flow (Modelo Shopify)

## Objetivo

Este documento define la arquitectura y el flujo de compra para **STORE LITE** operando bajo un modelo **Puro SaaS (Direct Payment)**, reemplazando el esquema anterior de Escrow.

En este modelo, STORE LITE es únicamente el proveedor tecnológico. Los pagos fluyen de manera **directa** desde el comprador hacia la cuenta de la tienda (tenant) mediante su propia integración (ej. Culqi).

---

## 1. El Flujo de Compra Directa (SaaS)

### Paso 1: Checkout y Pago Directo

- El comprador ingresa a la tienda (ej. `pepe-store.storelite.com`).
- Selecciona productos y procede al pago.
- El dinero (S/ 2,000) y el costo de envío es cobrado por **Culqi**, usando las credenciales (API Keys) de `pepe-store`.
- STORE LITE registra la orden como `paid` inmediatamente. No existe retención (escrow).

### Paso 2: Creación del Envío (Logística)

- La orden pagada aparece en el panel de `pepe-store`.
- STORE LITE, utilizando las credenciales logísticas de `pepe-store` (ej. API de Urbano Express), genera automáticamente la etiqueta de envío.
- La orden cambia a `in_delivery` y se le asigna un número de rastreo (`tracking_number`).

### Paso 3: Seguimiento y Completitud (Autómata)

- STORE LITE consulta constantemente (Pull Method) la API de Urbano o recibe Webhooks.
- Cuando Urbano reporta el estado **"Entregado" (Delivered)**, STORE LITE actualiza la orden a `completed`.
- Opcionalmente, se dispara una notificación de WhatsApp al comprador informando la entrega exitosa.
- **Nota:** En este modelo NO existe un "Código de Confirmación" manual. El rastreo oficial del courier es la fuente de verdad técnica para cerrar el ciclo de la orden en el software.

---

## 2. API de Urbano Express (Perú) - Capacidades

Según la documentación e integraciones de Urbano:

- **Tracking Pull Method:** API oficial para consultar el estado en tiempo real pasándole el `tracking_number`.
- **Endpoints de Creación y Cotización:** POST para crear envíos, imprimir etiquetas (waybills) y calcular tarifas dinámicas.
- **Eventos:** Poseen soporte para entornos TEST/PROD y se puede configurar actualización de estados para plataformas eCommerce, lo cual STORE LITE utilizará para el cierre automático.

---

## 3. Resolución de Conflictos y Soporte Legal (El Modelo SaaS)

Al ser un modelo de Pago Directo, las responsabilidades legales cambian drásticamente frente a un Escrow:

**A. ¿Qué pasa si Urbano pierde el paquete o no marca "Completado"?**

- **Responsabilidad Logística:** Es un problema **entre el negocio (pepe-store) y Urbano**. Pepe-store es el cliente de Urbano (por usar sus propias credenciales). Pepe-store debe reclamar su seguro de envío a Urbano. STORE LITE solo refleja lo que dice la API.

**B. ¿A quién se queja el comprador si no recibe el producto?**

- **Primer canal:** El comprador reclama a **pepe-store** usando el WhatsApp o Centro de Ayuda brindado por la tienda.
- **Segundo canal (Financiero):** Si pepe-store no responde o estafa, el comprador hace un **Contracargo (Chargeback)** en su tarjeta de crédito. La disputa financiera se abre entre Culqi y la cuenta bancaria de pepe-store.
- **El rol de STORE LITE:** STORE LITE **no interviene financieramente** ni hace devoluciones, porque nunca tocó ese dinero. Su único rol en casos de estafa/fraude masivo es **Banear a pepe-store** de la plataforma por violar los Términos y Condiciones, cerrándole la tienda.

---

## 4. Entidades y Tablas Principales

### A. `orders`

- `status`: `draft`, `paid`, `in_delivery`, `completed`, `refunded`, `cancelled`.
- (Ya no se requieren estados de holding/escrow ni códigos de confirmación).

### B. `order_fulfillments`

- Guarda información de envío: `tracking_number`, `courier_name` (ej. 'URBANO'), `courier_status`.
- Se actualiza vía cronjob o webhook consultando la API de Urbano.

### C. `business_integrations`

- Tabla esencial donde cada negocio guarda localmente sus credenciales:
  - `culqi_public_key`, `culqi_private_key`.
  - `urbano_api_key`, `urbano_client_id`.

## Conclusión Arquitectónica

Este diseño reduce la carga regulatoria, tributaria y operativa de STORE LITE al mínimo, delegando el riesgo de contracargos y fraudes de entrega al negocio y a su propio contrato con sus pasarelas financieras y logísticas.
