# LOTE 1 — Dominio y Contratos (Pago Directo y Logística Manual)

## Objetivo

Definir los estados oficiales y las transiciones del nuevo flujo donde el pago es directo y la logística es responsabilidad del Seller mediante carga de evidencia (tickets).

---

## E01-T01 — Estados Oficiales de la Orden

### Estados Activos

- **`pendiente`**: Orden pagada en Culqi exitosamente. El dinero ya está en la cuenta del Seller.
- **`enviado`**: El Seller ha subido el ticket de envío (foto) y opcionalmente el tracking number.
- **`finalizado`**: El Seller marca como entregado. Inicia la ventana de 3 días para reclamos.

### Estados Terminales

- **`cerrado`**: Fin del ciclo de vida (3 días después de `finalizado`).
- **`cancelado`**: La orden no pudo completarse. El Seller es responsable de devolver el dinero por Culqi.

---

## E01-T02 — Reglas de Transición y Evidencia

### Transición: `pendiente` -> `enviado`

- **Actor:** Seller.
- **Requisito Obligatorio:** Subida de imagen a Supabase Storage (`shipping_ticket_url`).
- **Acción:** Notificar al comprador vía Email/WhatsApp que su pedido está en camino.

### Transición: `enviado` -> `finalizado`

- **Actor:** Seller.
- **Condición:** El Seller confirma la entrega física.

### Transición: `finalizado` -> `cerrado`

- **Actor:** Sistema (Cronjob).
- **Condición:** 72 horas después de `finalizado_at` sin denuncias activas.

---

## E01-T03 — Política de Zonas de Envío

### Configuración del Seller

- El Seller debe poder crear, editar y eliminar zonas (ej: "Lima", "Callao", "Resto del País").
- Cada zona debe tener un precio (`shipping_cost`).

### Aplicación en Checkout

- El Comprador DEBE seleccionar una zona para finalizar el pago.
- El monto total cobrado en Culqi será `SUM(items.price) + selected_zone.shipping_cost`.

---

## E01-T04 — Protección y Vetting (KYB Lite)

### Registro de Negocio

- Solicitar RUC y razón social.
- Validar conectividad con Culqi mediante un "Test Charge" o validación de Public Key.
- Reputación: Cada denuncia confirmada resta puntos. Al llegar a un umbral, baneo automático.

---

## Criterios de Aceptación del Lote 1

- [ ] No existen referencias a "Escrow" o "Holding" de dinero.
- [ ] El flujo de estados es lineal y depende de la acción del Seller + tiempo de gracia.
- [ ] El comprador tiene un canal de tracking basado en DNI/ID Orden.
