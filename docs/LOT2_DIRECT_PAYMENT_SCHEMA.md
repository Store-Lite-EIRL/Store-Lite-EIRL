# LOTE 2 — Diseño de Base de Datos (Pago Directo y Logística)

## Objetivo

Definir las tablas y columnas necesarias para soportar el flujo de zonas de envío, estados de pedido y carga de tickets de evidencia.

---

## 1. Tabla `orders` (Refactorizada)

Esta tabla centraliza la transacción. Ya no hay campos de "Escrow".

### Columnas Clave:

- `id`: UUID PK.
- `business_id`: UUID FK -> `businesses.id`.
- `status`: Enum (`pendiente`, `enviado`, `finalizado`, `cancelado`, `cerrado`).
- `total_amount`: Decimal (Total pagado en Culqi).
- `shipping_cost`: Decimal (Costo de envío aplicado).
- `shipping_ticket_url`: Text (URL de la imagen del ticket en Supabase).
- `tracking_number`: Text (Código dado por la agencia de courier).
- `buyer_dni`: Text (Necesario para el tracking en storefront).
- `created_at`: Timestamp.
- `enviado_at`: Timestamp.
- `finalizado_at`: Timestamp.
- `closed_at`: Timestamp (Seteado por el cronjob de 3 días).

---

## 2. Tabla `shipping_rates` (Nueva)

Almacena las zonas de envío configuradas por el Seller.

### Columnas:

- `id`: UUID PK.
- `business_id`: UUID FK -> `businesses.id`.
- `region_name`: Text (ej. "Lima", "Provincias").
- `price`: Decimal.
- `is_active`: Boolean.
- `created_at`: Timestamp.

---

## 3. Tabla `order_disputes` (Nueva - Protección)

Registra si un comprador ha reportado un problema.

### Columnas:

- `id`: UUID PK.
- `order_id`: UUID FK -> `orders.id`.
- `reason`: Text.
- `evidence_url`: Text (Opcional, foto del comprador).
- `status`: Enum (`abierta`, `resuelta`, `denegada`).
- `created_at`: Timestamp.

---

## 4. Estrategia de Migración

1. **Crear Enums:** Crear el nuevo `order_status_enum` con los estados simplificados.
2. **Crear Tablas:** `shipping_rates` y `order_disputes`.
3. **Modificar `orders`:** Añadir los campos de logística (`shipping_ticket_url`, `tracking_number`, `buyer_dni`).
4. **Deprecar:** Marcar tablas o campos de "Escrow" anteriores como obsoletos para futura eliminación.

---

## 5. Consideraciones de Seguridad

- Las imágenes de los tickets deben subirse a un Bucket de Supabase con **RLS** que permita lectura pública (para el comprador) pero solo escritura al dueño del negocio.
