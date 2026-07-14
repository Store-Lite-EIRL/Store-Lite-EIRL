# 🛒 Store Lite

<!-- Logo Oficial -->
<p align="center">
  <img src="https://raw.githubusercontent.com/devkittpo/store-lite/main/docs/assets/logo-store-lite.svg" alt="Store Lite Logo" width="120" />
</p>

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

## 📢 Notificaciones Broadcast (SASS → Sellers)

Hay **3 formas** de crear notificaciones para los sellers desde el panel SASS:

### 1. CLI script (`scripts/notify.mjs`)

```bash
node scripts/notify.mjs "Título" "Mensaje" [flags]

# Ejemplo
node scripts/notify.mjs "Novedad" "Plan Pro 50% OFF" --target all --category plan
```

Flags disponibles:

- `--target all` — todos los sellers (default)
- `--target id1,id2,id3` — business IDs específicos
- `--category sistema` — categoría visual (default: sistema)
- `--type system` — tipo interno (default: system)

Requiere `SASS_API_KEY` en el entorno.

### 2. curl / HTTP directo

```bash
curl -X POST http://localhost:3000/api/sass/notifications/broadcast \
  -H "Content-Type: application/json" \
  -H "x-sass-key: $SASS_API_KEY" \
  -d '{
    "title": "Novedad",
    "message": "Plan Pro 50% OFF",
    "category": "plan",
    "type": "system",
    "target": "all"
  }'
```

El endpoint acepta `target: "all"` o `target: ["id1", "id2"]`.

### 3. CRON automático (`GET /api/cron/check-plans`)

Ejecutado por **Vercel Cron** diariamente a las 8:00 AM. Revisa los planes próximos a vencer y envía notificaciones automáticas:

- **D-7**: "Tu plan {nombre} vence en 7 días"
- **D-3**: "Tu plan {nombre} vence en 3 días — renovalo para no perder funciones"
- **D-1**: "Tu plan {nombre} vence mañana"
- **Expirado**: "Tu plan {nombre} ha expirado — tus funciones están limitadas"

Incluye deduplicación: no envía la misma notificación dos veces en el mismo día.

### Variables de entorno

| Variable       | Descripción                                         |
| -------------- | --------------------------------------------------- |
| `SASS_API_KEY` | Clave para autenticar broadcasts contra el endpoint |
| `CRON_SECRET`  | Clave para autenticar requests de Vercel Cron       |

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
