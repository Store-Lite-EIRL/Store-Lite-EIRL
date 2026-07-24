# Architectural SaaS Maturity Roadmap: Store Lite 🚀

Este documento define la base técnica y operativa necesaria para transformar el MVP de **Store Lite** en una plataforma SaaS de clase empresarial, escalable y mantenible. Como arquitectos, no solo tiramos código; construimos sistemas que pueden fallar con elegancia y recuperarse rápido.

---

## 🏗️ Filosofía de Trabajo

> **CONCEPTS > CODE**: No instalamos herramientas por moda; las instalamos porque resuelven un problema de costo, velocidad o seguridad.

---

## 1. Fase: Calidad y Estandarización del Ciclo de Vida (CI/CD)

El objetivo es que ningún código suba a `develop` o `main` sin haber pasado por un filtro automático de calidad.

### Acciones Inmediatas:

- [ ] **Commitlint**: Forzar el uso de [Conventional Commits](https://www.conventionalcommits.org/). Esto permite generar changelogs automáticos y entender el historial de cambios sin adivinar.
- [ ] **Lint-Staged**: Configurar Husky para que solo corra el linter/formateador en los archivos que están en el `stage` de Git. Ya tenés Husky, pero falta el gatillo real.
- [ ] **GitHub Actions Hardening**:
  - Crear un job de `build` preventivo en el PR.
  - Bloquear merges si el CI falla (Status Checks).

---

## 2. Fase: La Red de Seguridad (Automated Testing)

Un SaaS sin tests es una deuda técnica que se paga con fines de semana arruinados por bugs en producción.

### Estrategia:

- [ ] **Unit Testing (Vitest)**:
  - Cero mocks innecesarios.
  - Foco: Lógica de precios, validación de permisos en el proxy, y transformaciones de datos de Drizzle.
- [ ] **E2E Testing (Playwright)**:
  - El "Critical Path": Login -> Crear Tienda -> Configurar Pago -> Checkout.
  - Playwright es superior a Cypress en entornos modernos de Next.js.
- [ ] **Visual Regresion Testing**: Asegurar que los tokens de Material Design3 no se rompan accidentalmente en actualizaciones de estilos.

---

## 3. Fase: Observabilidad y Radar (Monitoring)

Si no lo medís, no lo podés mejorar. Si no lo ves, no sabés que está roto.

### Herramientas Críticas:

- [ ] **Sentry**: Reporte de errores en tiempo real (Client & Server). Configurar `sourcemaps` para que los errores en Vercel muestren la línea exacta de TypeScript.
- [ ] **PostHog**: No solo analíticas, sino **Recording de sesiones**. Ver cómo los usuarios usan el Grid Builder para detectar fricción en el UI.
- [ ] **Log Management**: Si usamos Supabase Edge Functions, centralizar logs para depurar fallos en la integración con Culqi.

---

## 4. Fase: Mantenibilidad y Seguridad Proactiva

El SaaS debe "cuidarse solo" mientras nosotros dormimos.

### Tareas:

- [ ] **Dependabot**: Activar el escaneo de vulnerabilidades. Si un paquete de `node_modules` tiene un fallo de seguridad, queremos un PR automático el lunes a la mañana.
- [ ] **ADRs (Architecture Decision Records)**: Documentar el _por qué_ de las decisiones de diseño (ej: ¿por qué usamos MD3 y no Tailwind?).
- [ ] **Schema Migrations Verification**: Asegurar que las migraciones de Drizzle se validen contra una base de datos de "shadow" en el CI antes de tocar producción.

---

## 🚀 Próximos Pasos (Decision del Dueño)

Para no quemarnos en el intento, el orden recomendado es:

1. **Calidad de Commit** (Garantiza orden hoy).
2. **Observabilidad** (Nos dice qué está fallando hoy en silencio).
3. **Tests Unitarios** (Protege la lógica core).
4. **E2E** (Protege el negocio).

---

> **Firmado**: Antigravity (Architectural Intelligence) 🛠️
