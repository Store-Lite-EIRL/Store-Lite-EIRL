# 📜 Store Lite: Estándares de Ingeniería y Código Limpio

Este documento define la "Constitución" del proyecto. Cualquier cambio, refactorización o nueva funcionalidad DEBE alinearse con estas reglas para garantizar la escalabilidad, mantenibilidad y calidad del software.

---

## 1. Calidad y Estructura de Código

- **Código Limpio (Clean Code)**: El código debe ser autodescriptivo. Nombres de variables y funciones que expliquen el "qué" y el "por qué", no el "cómo".
- **Funciones y Componentes Pequeños**:
  - Una función no debe exceder las 30 líneas (idealmente menos).
  - Un componente React no debe exceder las 150 líneas. Si es más grande, dividilo en subcomponentes o hooks.
- **Responsabilidad Única (SRP)**: Cada archivo, clase o función debe tener una sola razón para cambiar.
- **DRY (Don't Repeat Yourself)**: Evitá la duplicación de lógica. Si ves algo repetido 2 veces, abstraelo.

## 2. Tipado y TypeScript

- **Prohibido el uso de `any`**: El uso de `any` es una falla de diseño. Si es estrictamente necesario (ej. integración externa legacy), debe estar justificado con un comentario `@ts-expect-error` o un wrapper que tipé la salida.
- **Interfaces vs Types**: Usar `interface` para definiciones de objetos que pueden ser extendidos y `type` para uniones, tuplas o tipos primitivos.
- **Strict Null Checks**: Siempre manejar los casos de `null` o `undefined` de forma explícita.

## 3. Arquitectura y Organización

- **Feature-Oriented Architecture**: La lógica de negocio vive en `src/features/<feature_name>`.
- **Estructura de Carpetas**:
  - `src/core`: Configuración global, cliente de DB, esquemas.
  - `src/lib`: Adaptadores para librerías externas (Supabase, Sentry).
  - `src/shared`: Componentes UI atómicos, hooks globales, utilidades puras.
  - `src/features`: Módulos autocontenidos (business logic, components, hooks, services).
  - `app/`: Exclusivo para routing, composición de páginas y Server Actions de orquestación.
- **Dirección de Dependencias**:
  - `app` -> `features` -> `shared` -> `core` -> `lib`.
  - NUNCA una feature debe importar de otra feature directamente (usar `shared` o `core` para puntos comunes).

## 4. Convenciones de Nombres

- **Variables y Funciones**: `camelCase`.
- **Componentes React y Archivos de Componentes**: `PascalCase`.
- **Archivos de Lógica/Utilidades**: `kebab-case` o `camelCase` (consistente con el entorno). _Corregir archivos como `CreateBusiness.ts` a `create-business.ts`_.
- **Constantes**: `SCREAMING_SNAKE_CASE`.

## 5. Seguridad y Buenas Prácticas

- **Validación de Entradas**: Usar Zod para validar TODA entrada de datos (Server Actions, API routes, Forms).
- **Manejo de Errores**: Centralizar errores en `app/global-error.tsx` y usar bloques `try/catch` con logging adecuado (Sentry).
- **Secrets**: NUNCA subir claves al repo. Usar `.env.local` y validar su existencia en `src/config`.

## 6. Estética y UI

- **Mobile First**: Diseño responsivo usando tokens de Material Design 3 (MD3).
- **CSS Modules**: Preferir CSS Modules para evitar colisiones de estilos globales.
- **Iconografía**: Usar exclusivamente el componente `Icon` de `@/shared/components/ui`.

## 7. Workflow de Base de Datos

- **Planificación**: Prohibido modificar `schema.ts` sin un `implementation_plan.md` aprobado.
- **Migraciones**: Siempre usar `drizzle-kit generate` y revisar el SQL resultante.

---

_Nota: Esta guía es dinámica. Si encontrás un patrón mejor, proponelo, discutimos y actualizamos._
