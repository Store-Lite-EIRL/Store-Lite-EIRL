# 💳 Guía Maestra: Integración API Culqi v4 (Perú)

Esta guía detalla el funcionamiento, la lógica y los estándares técnicos para integrar Culqi en proyectos modernos de Next.js.

## 1. Fundamentos de Autenticación

Culqi utiliza un sistema de dos llaves para separar la seguridad del cliente y del servidor.

| Llave            | Prefijo                       | Uso                                           | Ubicación                              |
| :--------------- | :---------------------------- | :-------------------------------------------- | :------------------------------------- |
| **Pública (PK)** | `pk_test_...` o `pk_live_...` | Tokenización de tarjetas.                     | Frontend (Lado del cliente).           |
| **Privada (SK)** | `sk_test_...` o `sk_live_...` | Generación de cargos, órdenes y devoluciones. | Backend (Server Actions / API Routes). |

> [!IMPORTANT]
> Nunca expongas la llave privada (`SK`) en el código del cliente o en repositorios públicos.

### 2.1 Flujo Específico Yape (Token -> Cargo)

1. **Cliente**: Abre su App YAPE -> Menú -> "Código de aprobación" (OTP de 6 dígitos).
2. **Frontend**: Captura el nro. de celular y el OTP.
3. **CulqiJS / Tokenización**: Crea un token de tipo `yape`.
4. **Backend**: Procesa el cargo usando ese `token_id`. El depósito llega a la cuenta de la plataforma.

---

## 3. El "Doble Depósito" y Seguridad (Marketplace)

Para cumplir con el flujo de "Plataforma -> Tienda", se debe seguir el **Modelo de Agregador**:

1. **Depósito 1 (Pago):** El cliente paga. El dinero llega a la cuenta de Culqi de la plataforma.
2. **Custodia (Escrow):** La plataforma mantiene el saldo como "No entregado".
3. **Depósito 2 (Liquidación/Payout):** Una vez que el comprador ingresa el **Código de Entrega**, la plataforma transfiere el dinero al vendedor (menos comisión).
   - _Nota:_ Culqi no realiza la transferencia al vendedor automáticamente. La plataforma debe gestionar el pago al vendedor (Transferencia bancaria o vía API de Banco).

---

## 2. Flujo de Pago Principal (Token -> Cargo)

El flujo estándar para pagos con tarjeta de crédito/débito consta de dos pasos críticos:

### Paso A: Tokenización (Frontend)

1. El usuario ingresa sus datos en el **Culqi Checkout** o un formulario personalizado.
2. Los datos se envían directamente a Culqi (sin pasar por nuestro servidor para mantener cumplimiento PCI).
3. Culqi responde con un `id` de objeto **Token** (ej: `tkn_test_abcd123`).

### Paso B: Generación del Cargo (Backend)

1. El `token_id` se envía a nuestro servidor (Next.js Server Action).
2. El servidor realiza un POST a `https://api.culqi.com/v2/charges` enviando el `token_id`, el monto (especificado en céntimos), la moneda (`PEN` o `USD`) y el correo del cliente.
3. Culqi procesa el pago y responde con el estado del cargo.

---

## 4. Integración en Next.js (App Router)

### Variables de Entorno (`.env`)

```env
NEXT_PUBLIC_CULQI_PK=pk_test_xxxxxx
CULQI_SK=sk_test_xxxxxx
```

### Implementación del Checkout (Client Component)

Se recomienda inyectar el script de Culqi en el `layout.tsx` o cargarlo dinámicamente.

```tsx
// Ejemplo de apertura del checkout
const openCulqi = (amount: number, description: string) => {
  if (typeof window.Culqi !== 'undefined') {
    window.Culqi.settings({
      title: 'Mi Tienda',
      currency: 'PEN',
      description: description,
      amount: amount * 100, // Convertir a céntimos (S/ 10.00 = 1000)
    });
    window.Culqi.open();
  }
};
```

### Procesamiento de Cargos (Server Action)

```typescript
'use server';

export async function processPayment(tokenId: string, amount: number) {
  const response = await fetch('https://api.culqi.com/v2/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CULQI_SK}`,
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency_code: 'PEN',
      email: 'cliente@ejemplo.com',
      source_id: tokenId,
    }),
  });

  const data = await response.json();
  return data;
}
```

---

## 4. Órdenes (PagoEfectivo, Yape, Billeteras)

Para métodos de pago diferidos (depósito en efectivo o transferencia), se utiliza el objeto **Order**.

1. Se crea una **Orden** en el servidor.
2. Culqi devuelve un código de pago (CIP) o un QR.
3. El pago es asíncrono; se requiere un **Webhook** para confirmar cuando el cliente pague.

---

## 5. Webhooks y Seguridad

Los Webhooks son necesarios para actualizar el estado del pedido en base de datos de manera confiable.

- **URL de Webhook**: Debe ser una ruta POST pública (ej: `/api/webhooks/culqi`).
- **Validación**: Culqi envía eventos. Debes verificar la autenticidad o consultar el estado del cargo/orden directamente a la API de Culqi antes de marcar como "Pagado".

---

## 6. Manejo de Errores Comunes

Culqi utiliza códigos de error estándar en el cuerpo de la respuesta:

- `card_declined`: La tarjeta fue rechazada por el banco.
- `expired_card`: Tarjeta vencida.
- `insufficient_funds`: Saldo insuficiente.
- `parameter_error`: Error en los datos enviados (ej: monto inválido).

> [!TIP]
> Siempre registra (log) el `request_id` que devuelve Culqi en caso de errores para poder reportarlos a su soporte técnico.

---

## 7. Seguridad Avanzada y Confiabilidad

### A. Idempotencia (Idempotency-Key)

Para evitar cargos duplicados en caso de reintentos por fallas de red, Culqi permite el uso de un header de idempotencia.

- **Header**: `Idempotency-Key` (aunque no siempre es obligatorio en todas las librerías, es una buena práctica).
- **Valor**: Un UUID v4 único por cada intento de transacción.

### B. Cifrado AES/RSA (x-culqi-rsa-id)

Si decides **no usar el Checkout de Culqi** y construir tu propio formulario capturando datos sensibles, Culqi v4 exige cifrado de extremo a extremo:

1. Generas un **RSA Key pair** en el panel de Culqi.
2. Cifras el payload con AES/RSA.
3. Envías el header `x-culqi-rsa-id` con el ID de tu llave pública.

> [!CAUTION]
> El manejo manual de datos de tarjeta aumenta drásticamente los requisitos de cumplimiento PCI DSS. Siempre que sea posible, utiliza **Culqi Checkout** o **CulqiJS** para tokenizar.

---

## 8. Diccionario Técnico Rápido

- **Céntimos**: Todos los montos en la API deben enviarse multiplicados por 100.
- **Metadata**: Puedes enviar un objeto `metadata` con IDs de pedidos internos para facilitar la reconciliación.
- **Request ID**: Captura el header `x-culqi-tracking-id` de la respuesta para auditoría y soporte.
