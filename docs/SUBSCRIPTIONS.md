# Sistema de Planes de Suscripción

Este documento detalla los niveles de suscripción disponibles para los negocios en la plataforma.

## Introducción

Para monetizar la plataforma y ofrecer características avanzadas, los negocios pueden actualizar su plan. Por defecto, todos los nuevos negocios comienzan en el plan **Básico**.

## Tabla de Planes

| Plan              | Precio (Mensual) | Estado Inicial | Descripción                                          |
| :---------------- | :--------------- | :------------- | :--------------------------------------------------- |
| **Básico**        | S/ 0 (Gratis)    | `inactive`     | Funciones esenciales para micro-negocios.            |
| **Emprendedor**   | S/ 59            | `active`       | Herramientas avanzadas para negocios en crecimiento. |
| **Business Pro**  | S/ 99            | `active`       | Soporte prioritario y acceso multi-usuario.          |
| **Enterprise AI** | S/ 149           | `active`       | Automatización con IA y soluciones personalizadas.   |

> Los precios mostrados son el **precio final, IGV incluido** (18%). La fuente única de verdad de los precios es `src/shared/billing/planPrices.ts` (en céntimos).

## Estructura de Datos (Tabla `businesses`)

Se han añadido los siguientes campos a la tabla de negocios para gestionar las suscripciones:

- `plan_type`: Tipo de plan actual (`basico`, `emprendedor`, `business_pro`, `enterprise_ai`).
- `plan_status`: Estado de la suscripción (`active`, `inactive`, `past_due`, `canceled`, `expired`, `trialing`).
- `plan_start_date`: Fecha de inicio del plan actual.
- `plan_end_date`: Fecha de vencimiento del plan (si aplica).
- `plan_updated_at`: Última vez que se actualizó el plan.

## Lógica de Negocio

1. **Plan Básico**: El estado por defecto es `inactive` porque no requiere una suscripción activa de pago.
2. **Actualizaciones**: Cuando un usuario paga por un plan superior, el `plan_status` cambia a `active` y se establecen las fechas correspondientes.
3. **Expiración**: Un proceso en segundo plano (Edge Function o CRON) debe verificar las fechas y cambiar el estado a `past_due` o `expired` si no se renueva.

---

_Última actualización: Marzo 2026 — Proyecto Supabase: `cncmbykyycuajxcjfjfp` — Migración aplicada con `drizzle-kit push`_
