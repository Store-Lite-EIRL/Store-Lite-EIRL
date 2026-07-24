# Lógica de Negocio y Operaciones — Modelo SaaS Directo

## 1. Visión General del Modelo

**STORE LITE** opera bajo un modelo de software como servicio (SaaS) puro. Esto significa que **proporciona la infraestructura tecnológica**, pero no interviene como intermediario financiero ni logístico en las transacciones.

Cada negocio (`pepe-store`) que utiliza STORE LITE conecta **sus propias pasarelas de pago** (ej. Culqi) y **sus propias credenciales logísticas** (ej. Urbano Express).

### Flujo Exacto de Compra:

1. **Pago Directo:** El comprador paga en la web de `pepe-store`. El dinero va 100% y de forma inmediata a la cuenta Culqi de `pepe-store`. La orden nace en estado `pagada`.
2. **Generación del Envío:** El sistema usa la cuenta de Urbano Express de `pepe-store` para generar la guía de remisión (waybill) y el número de rastreo (`tracking_number`).
3. **Despacho:** `pepe-store` entrega físicamente el paquete al motorizado de Urbano.
4. **Entrega y Cierre:** El motorizado de Urbano entrega el paquete al comprador. Urbano actualiza su sistema a "Entregado". STORE LITE lee este estado y marca la orden automáticamente como `completada` informando al cliente vía WhatsApp.

---

## 2. Gestión de Seguridad y Prevención de Confusiones

Como STORE LITE automatizará el cierre de ventas basado en el **ESTADO que provee Urbano**, es crucial tener claro cómo se maneja la seguridad operativa y quién se hace responsable ante fallas.

### A. ¿De quién es la responsabilidad del envío?

**Total y exclusiva de `pepe-store` y Urbano.**
STORE LITE actúa como un "espejo" informático. Si la API de Urbano dice "Entregado", STORE LITE confía ciegamente en ese dato porque las credenciales pertenecen a `pepe-store`.

### B. ¿Qué pasa si el paquete no llega o Urbano no marca "COMPLETADO"?

Si la orden se queda en "En camino" eternamente o el paquete se pierde físicamente:

1. **La queja inicial del Comprador:** El comprador usará el enlace de soporte/WhatsApp configurado en la tienda de `pepe-store`.
2. **El reclamo de la Tienda:** El dueño de `pepe-store` debe acceder a su panel propio de Urbano Express (o llamar a su ejecutivo de Urbano) para ejecutar la póliza de seguro por pérdida.
3. **Resolución en UI:** El dueño de `pepe-store` tendrá un botón en STORE LITE para "Marcar como fallido/Devolver dinero a través de Culqi" si el paquete nunca llegó.

### C. Sistema Antifraude y Resolución Extrema (Contracargos)

¿Qué pasa si el negocio (`pepe-store`) cobró la plata pero **nunca** mandó el paquete a Urbano, y además no le responde los mensajes al comprador?

1. **La Acción del Comprador (El Contracargo):** El comprador llama a su banco (Visa/Mastercard) y desconoce el pago. El banco de inmediato le quita el dinero a la cuenta Culqi de `pepe-store`.
2. **El Rol Punitivo de Store Lite:** STORE LITE mantendrá un registro de "Tickets/Denuncias". Si una tienda (`pepe-store`) recibe múltiples quejas de compradores (identificados por DNI/Email) reportando que nunca reciben sus compras y no fueron procesados en Urbano:
   - STORE LITE procederá al **BANEO DEFINITIVO** y cancelación de suscripción de la tienda por fraude, protegiendo el ecosistema sin tener que compensar montos financieros.

---

## 3. Por Qué Este Modelo Asegura el Éxito

- **Cero estrés financiero:** STORE LITE nunca retiene dinero de compradores, evitando problemas regulatorios con la SBS y riesgos de caja.
- **Fricción Cero para el Comprador:** El comprador no tiene que acordarse de guardar ni ingresar "Códigos de Confirmación". El tracking de Urbano es la única prueba necesaria.
- **Transparencia Inmediata:** La plataforma WhatsApp API mantiene a las dos partes comunicadas automáticamente basándose únicamente en la logística real.
