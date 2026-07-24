# Mejora del Flujo de Pagos Culqi

**Estado:** ⚠️ Pendiente  
**Prioridad:** Alta  
**Responsables:** Dev Backend + Dev Frontend  
**Fecha estimada:** 3 sprints

## Problemas Actuales

1. Falta verificación doble del estado del pago
2. No hay manejo de reintentos para webhooks fallidos
3. Logging insuficiente para debugging
4. Riesgo potencial de race conditions

## Plan de Acción

### Fase 1: Refuerzo de Seguridad ✅

```typescript
// Pseudocódigo - nuevo módulo de verificación
import { verifyCulqiPayment } from '@/lib/culqi-verify';

async function validatePayment(paymentId: string) {
  // 1. Verificar firma Culqi
  // 2. Consultar API de Culqi para confirmar estado
  // 3. Validar monto coincidente
}
```

### Fase 2: Webhooks Resilientes

| Paso | Acción                                           |
| ---- | ------------------------------------------------ |
| 1    | Implementar cola de reintentos (RabbitMQ/Celery) |
| 2    | Añadir timeout de 15min antes de confirmar pago  |
| 3    | Crear tabla `payment_retries` para tracking      |

### Fase 3: Mejoras en Frontend

- [ ] Añadir pantalla de "Verificando pago..." mientras se confirma backend
- [ ] Implementar polling como fallback si webhook demora
- [ ] Mejorar mensajes de error para usuario

### Pruebas Obligatorias

```bash
# 1. Simular webhook fallido (usar PowerShell válido)
curl.exe -X POST -H "Content-Type: application/json" -d '{"test_failure":1}' https://tudominio.com/api/webhooks/culqi

# 2. Verificar reintentos automáticos
SELECT * FROM payment_retries WHERE payment_id = 'test_123';
```

### Criterios de Aceptación

1. 100% de logs auditables para cada flujo
2. Tolerancia a 3 fallos consecutivos en webhook
3. Tiempo máximo de confirmación: 20min
4. Tests E2E cubriendo 4 escenarios fallidos

## Documentación Relacionada

- [API Culqi Webhooks](https://www.culqi.com/api/docs/#webhooks)
- [Ejemplo Webhook Seguro](https://github.com/culqi/culqi-node/blob/master/examples/webhook.js)
