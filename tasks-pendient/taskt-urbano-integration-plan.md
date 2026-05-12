# 📦 Plan: IntegraciÃ³n Urbano Courier

> **Fecha:** 2026-04-16 (actualizado)
> **Planes habilitados:** Business Pro Â· Enterprise AI
> **Estado:** âš§ En desarrollo - MigraciÃ³n desde Shalom/Olva a Urbano terminada para UI

## 🔍 1. InvestigaciÃ³n de la API de Urbano (Pendiente)

El usuario proporcionarÃ¡ los tokens y secretos pronto. Por ahora la UI estÃ¡ preparada con:

1. Urbano (Agencia)
2. Urbano (Domicilio)

## âš™ï¸ 2. LÃ³gica de Negocio

### RestricciÃ³n por Plan

Se mantiene la restricciÃ³n para los planes:
| Plan | EnvÃos Integrados |
| --------------- | ------------------ |
| `basico` | âŒ |
| `emprendedor` | âŒ |
| `business_pro` | âœ… |
| `enterprise_ai` | âœ… |

## ï¸âœ… 3. Checklist de ImplementaciÃ³n

- [x] Cambiar Shalom/Olva por Urbano en Checkout UI
- [x] Actualizar landing page y planes
- [ ] Implementar conexiÃ³n con API de Urbano (cuando se reciban las llaves)
- [ ] Implementar generaciÃ³n de guÃas automÃ¡ticas/manuales
- [ ] Implementar tracking en tiempo real
