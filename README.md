# 🛒 Store Lite

Store Lite es una solución de comercio electrónico ligera y escalable construida con **Next.js 16 (App Router)** y **React 19**. Implementa el sistema de diseño **Material Design 3** mediante Web Components nativos para una experiencia de usuario fluida y de alto rendimiento.

## 🚀 Tecnologías Core (Stack Técnico)

- **Frontend Framework:** [Next.js 16.1+](https://nextjs.org/) (App Router, Server Components).
- **Runtime UI:** [React 19](https://react.dev/) (Hooks avanzados, Server Actions).
- **Design System:** [Material Web Components (@material/web)](https://github.com/material-components/material-web) + Material Design 3 tokens.
- **Base de Datos & ORM:** [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/).
- **Infraestructura (BaaS):** [Supabase](https://supabase.com/) (Autenticación, Almacenamiento de archivos, Realtime).
- **Gestión de Estados:** Server-side state con Next.js Cache y Client-side global con React Context.
- **Tipado:** [TypeScript 5+](https://www.typescriptlang.org/).

## 📂 Arquitectura del Proyecto

El proyecto sigue una arquitectura **basada en características (Feature-driven)** dentro de un directorio `src`, facilitando el mantenimiento y la escalabilidad horizontal.

```text
├── app/                  # Rutas (App Router), Server Actions y Composición
│   ├── (main)/           # Layouts y vistas protegidas
│   ├── actions/          # Lógica de mutación de datos (Server Actions)
│   ├── api/              # Endpoints API (Node.js/Edge Runtime)
│   └── auth/             # Flujos de autenticación e inicio de sesión
├── src/
│   ├── features/         # Módulos de dominio encapsulados (Products, Cart, Auth)
│   ├── core/             # Proveedores globales, esquemas de DB y configuración base
│   ├── lib/              # Adaptadores e inicialización de SDKs (Supabase, MD3)
│   ├── shared/           # UI Kit atómico, hooks transversales y utilidades
│   ├── styles/           # Design Tokens, temas Dark/Light y utilidades CSS
│   └── types/            # Definiciones globales de TypeScript
├── database/             # Modelado de datos y scripts Drizzle
└── migrations/           # Control de versiones del esquema de base de datos
```

## 🧠 Lógica de Operación y Patrones

### 1. Estrategia de Renderizado

Se priorizan los **React Server Components (RSC)** para la recuperación inicial de datos (Data Fetching), reduciendo el bundle de JavaScript en el cliente y optimizando el Core Web Vitals (LCP, CLS).

### 2. Flujo de Datos

- **Lectura:** Acceso directo a la base de datos mediante Drizzle dentro de Server Components para latencia mínima.
- **Escritura:** Mutaciones mediante **Server Actions**, asegurando validación en el servidor y revalidación de caché instantánea con `revalidatePath`.

### 3. Sistema de Diseño (Material 3)

Utiliza **Material Web (@material/web)**, lo que permite componentes con fidelidad visual de Google sin las dependencias pesadas de librerías tipo CSS-in-JS. El tema es dinámico y soporta esquemas de color avanzados (Dark, Light, High Contrast).

### 4. Seguridad y Autenticación

Protección de rutas mediante **Supabase Middleware** en el Edge, permitiendo verificaciones de sesión antes de que el servidor Next.js procese la petición.

## 🛠️ Configuración de Desarrollo

```bash
# Instalación de dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Generar migraciones de base de datos
pnpm drizzle-kit generate
```

---

_Store Lite v1.0 - Enfocado en robustez técnica y agilidad._
