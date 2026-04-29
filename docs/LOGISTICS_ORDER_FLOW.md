# LOGÍSTICA Y ESTADOS DE PEDIDO — Seller vs Customer

## 1. Sistema de Envío (Sin Courier)

El negocio configura precios solo para:

- **Lima**: Lugar donde está la tienda
- **Provincia/Exterior**: Otras regiones

El cliente al pagar recibe un **ID/Token** para rastrear su pedido.

---

## 2. Estados del Pedido (Enum en ESPAÑOL)

### Flujo Principal:

```
PENDIENTE → ANALIZANDO → ACEPTADO → FINALIZADO
    ↓           ↓             ↓
RECHAZADO    (rechazo)   REPORTE
```

| Estado       | Descripción                                        | Color UI     |
| ------------ | -------------------------------------------------- | ------------ |
| `pendiente`  | Cliente pagó, esperando que seller procese         | Amarillo     |
| `analizando` | Seller subió ticket, esperando que cliente apruebe | Azul         |
| `aceptado`   | Cliente aprobó el ticket                           | Verde        |
| `finalizado` | 3 días sin reporte (auto)                          | Verde oscuro |
| `rechazado`  | Cliente rechazó con motivo                         | Rojo         |
| `reporte`    | Cliente reportó después de FINALIZADO              | Naranja      |
| `fallido`    | Error en el proceso                                | Rojo         |

### Descripción de cada estado:

- **PENDIENTE**: El cliente realizó el pago. El pedido aparece en el dashboard del seller como nuevo.
- **ANALIZANDO**: El seller subió el ticket del courier y está esperando que el cliente lo revise y apruebe.
- **ACEPTADO**: El cliente revisó y aceptó el ticket. El producto está en camino.
- **FINALIZADO**: El producto fue entregado y pasaron 3 días sin reclamos (auto).
- **RECHAZADO**: El cliente rechazó el ticket (debe poner motivo + imagen).
- **REPORTE**: El cliente reportó un problema después de FINALIZADO.
- **FALLIDO**: Error en el proceso de pago o envío.

---

## 3. Estados del Seller (seller_status)

| Estado       | Descripción                                     |
| ------------ | ----------------------------------------------- |
| `pendiente`  | Nuevo pedido recibido                           |
| `por_enviar` | Seller tiene el producto, por llevar al courier |
| `enviado`    | Ya envioucon imagen del ticket                  |

---

## 4. Fechas del Pedido

| Campo         | Descripción                       |
| ------------- | --------------------------------- |
| `createdAt`   | Fecha de compra/pedido            |
| `shippedAt`   | Fecha cuando seller marca enviado |
| `verifiedAt`  | Fecha verificación ticket         |
| `completedAt` | Fecha confirmación del cliente    |
| `rejectedAt`  | Fecha rechazo del cliente         |

---

## 5. Página Privada del Customer

**Ruta**: `/{slug}/payment/{token}`

### Funcionalidades:

- Ver ticket de envío (imagen subida por seller)
- **Aceptar** → Estado pasa a `aceptado`
- **Rechazar** → Debe ingresar motivo + imagen → Estado `rechazado`
- Chat con el seller (token en localStorage)

### Lógica de Accept/Reject:

- **Aceptar**: Inmediato → Estado `aceptado`, `completedAt` = ahora
- **Rechazar**: Obligatorio motivo + imagen → Estado `rechazado`, `rejectedAt` = ahora
- **Default**: Si pasan 3 días sin respuesta → Auto-aceptar → `finalizado`

---

## 6.Chat entre Seller y Customer

- Se genera un **token** al iniciar conversación
- Se guarda en **localStorage**
- El sistema notifica que NO debe borrarlo

---

## 7. Security — Verificación de Ticket

El seller sube:

- Imagen del ticket de envío
- Código de seguimiento
- Fecha de envío

El customer puede **rechazar** si:

- Código no existe en el courier
- Imagen unclear
- Datos incorrectos

---

## 8. Reclamaciones

### Flujo de Rechazo:

1. Customer rechaza → debe poner **motivo + imagen evidencia**
2. Sistema guarda: `rejectionReason`, `rejectionImage`, `rejectedAt`
3. Estado del payment = `rechazado`
4. Notificación al seller con los datos
5. Seller ve: motivo, imagen, y puede:
   - Regenerar nuevo ticket correcto
   - Coordinar directamente con el customer

---

## 9. Base de Datos — Campos Nuevos

### Tabla `payments`:

```sql
-- Fechas del flujo
shipped_at timestamptz,
verified_at timestamptz,
completed_at timestamptz,
rejected_at timestamptz,

-- Estado del seller
seller_status text, -- 'pendiente' | 'por_enviar' | 'enviado'

-- Datos del ticket de envío
ticket_image_url text,

-- Rechazo del cliente
rejection_reason text,
rejection_image text,

-- Tracking token para el cliente
tracking_token text unique,
```

### Nueva Tabla `payment_chats`:

```sql
-- Chat entre seller y customer por pedido
id uuid primary key,
payment_id uuid references payments,
token text not null,
sender text not null, -- 'seller' | 'customer'
message text not null,
is_read boolean default false,
created_at timestamptz not null
```

---

## 10. Pendiente por Confirmar

- [ ] ¿El token de tracking se genera automáticamente al crear payment?
- [ ] ¿Cuántos días para auto-aceptar? (propuesto: 3)
- [ ] ¿El chat se guarda por sesión o siempre-visible?
- [ ] ¿Necesitamos WebSocket para chat real-time?
