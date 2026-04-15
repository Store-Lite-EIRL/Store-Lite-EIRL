# ADR 0003: Estrategia de Testing (Vitest + Playwright)

**Status**: Accepted

## Contexto

El MVP no tenía pruebas automatizadas, lo que ponía en riesgo la estabilidad de los flujos de negocio (pagos, gestión de stock).

## Decisión

Implementamos un enfoque dual:

1. **Vitest**: Para unit testing rápido y lógica de negocio.
2. **Playwright**: Para pruebas de integración y E2E que garanticen que el flujo de compra funciona de punta a punta.

## Consecuencias

- **Positivas**: Red de seguridad para refactorizaciones, despliegues más seguros en Vercel.
- **Negativas**: Mayor tiempo de ejecución en el CI (especialmente los navegadores de Playwright).
