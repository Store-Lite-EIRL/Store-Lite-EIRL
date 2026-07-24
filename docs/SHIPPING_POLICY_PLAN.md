# Plan de Envíos Simplificado (Custom Shipping)

Este documento define la estrategia de envíos "Manual Asistida" para la V1 de Store Lite, eliminando la dependencia de APIs de Couriers (como Envíame u Olva) y dándole el control total al negocio mediante una configuración súper sencilla.

---

## 🚚 Estrategia Elegida: "El Modelo Híbrido Simplificado"

Para evitar que el vendedor tenga que configurar una matriz compleja de 24 departamentos x provincias x pesos, implementaremos una combinación de las 3 opciones más usadas en el e-commerce PYME de Perú:

### 1. Recojo en Tienda (Gratis)

- El comprador se acerca al local del vendedor.
- Costo en Checkout: **S/ 0.00**.

### 2. Envío a Domicilio Simplificado (Local vs Provincia)

El vendedor define solo 2 tarifas estáticas:

- **Costo Local:** (Ej: "A todo Lima" -> S/ 10.00)
- **Costo Nacional:** (Ej: "Resto del Perú" -> S/ 18.00)
  _Lógica en Checkout:_ El sistema lee el departamento del comprador. Si es igual al departamento del vendedor, aplica el "Costo Local". Si es distinto, aplica el "Costo Nacional".

### 3. Envío con "Flete en Destino" (Agencia)

Muy usado con **Shalom, Marvisur, y algunas modalidades de Olva**.

- El comprador paga en el checkout **solo el valor del producto**.
- El vendedor despacha el producto indicando "Flete en Destino".
- El comprador paga el costo del envío **directamente a la agencia** al momento de recoger su paquete.
- Costo en Checkout: **S/ 0.00** (Con un _disclaimer_ gigante: "Pagarás el envío al recoger").

---

## 🗄️ Implementación en Base de Datos

En la tabla `businesses` (archivo `schema.ts`), agregaremos una columna JSONB para guardar esta configuración de forma compacta y sin crear tablas extra innecesarias:

```typescript
shippingPolicy: jsonb('shipping_policy').default({
  allow_pickup: true,
  allow_pay_on_delivery: false, // Flete en destino
  home_delivery: {
    enabled: true,
    local_price: 10.00,
    national_price: 18.00
  }
}),
```

---

## 🛒 Impacto en el Checkout (Fórmula Financiera)

El monto a cobrar vía **Culqi** dependerá de la opción elegida por el usuario final:

1. **Si elige Recojo en Tienda:** `Total = Precio Producto`
2. **Si elige Flete en Destino:** `Total = Precio Producto`
3. **Si elige Domicilio (Local):** `Total = Precio Producto + local_price`
4. **Si elige Domicilio (Nacional):** `Total = Precio Producto + national_price`

_Nota sobre el Split de Pagos (Marketplace):_ La comisión del SaaS (10%) se calcula sobre el **Total** cobrado por Culqi (es decir, el envío a domicilio también comisiona, lo cual es estándar en marketplaces como MercadoLibre).

---

## 📱 Impacto en la UI del Dashboard (Vendedor)

En la sección **"Ajustes -> Envíos"**, el vendedor verá un formulario simple:

- [Toggle] Permitir Recojo en Tienda local.
- [Toggle] Ofrecer envío por Agencia (Shalom/Marvisur) con pago en destino.
- [Toggle] Ofrecer envíos a Domicilio.
  - [Input S/] ¿Cuánto cobras por enviar dentro de tu región?
  - [Input S/] ¿Cuánto cobras por enviar a otras regiones?

---

## 🚦 Trazabilidad de Estados (Control Interno)

Dado que no hay API de courier, el control de estados lo maneja el vendedor:

1. `Pagado` (Automático por Culqi).
2. `Preparando` (Manual por vendedor).
3. `Enviado` / `En Agencia` (Manual por vendedor).
   - **Requisito Antifraude:** Para pasar a este estado, el vendedor DEBE subir una foto de la guía de remisión, boleta de la agencia o ticket. Esto se guarda en la columna `evidence_url` de la tabla `payments`.
4. `Entregado` (Manual por vendedor o confirmado por comprador).

---

## ✅ Resumen de Beneficios

- **Cero bloqueos técnicos:** Salimos a producción sin esperar aprobaciones de APIs de logística.
- **Baja fricción para el negocio:** Solo llenan 2 precios.
- **Seguridad:** La foto de la evidencia de envío nos protege de reclamos en el sistema Escrow.
