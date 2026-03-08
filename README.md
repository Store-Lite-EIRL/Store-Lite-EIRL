# Template Frontend Next.js - Material Design 3

Un template técnico avanzado utilizando Next.js 16+, React 19 y Material Design 3 (Material Web), diseñado para escalabilidad mediante una arquitectura modular basada en características (`features`).

## 🛠️ Stack Tecnológico

- **Core:** [Next.js 16.1 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **UI System:** [Material Web Components (@material/web)](https://github.com/material-components/material-web) + Google Sans
- **Database / ORM:** [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/)
- **Backend-as-a-Service:** [Supabase](https://supabase.com/) (Auth, Storage, Realtime)
- **Gestión de Estado & Lógica:** Server Actions para mutaciones, Context API para estado UI global.
- **Utilidades:** [dnd-kit](https://dndkit.com/) (Drag & Drop), [Day.js](https://day.js.org/), [xlsx](https://sheetjs.com/) (Data Export).
- **Tooling:** pnpm, TypeScript, ESLint, Prettier.

## 📂 Arquitectura y Estructura

El proyecto utiliza una arquitectura orientada a dominios (`features`) para desacoplar la lógica de negocio de la infraestructura.

```text
├── app/                  # Orquestación de rutas, páginas y Server Actions
│   ├── actions/          # Acciones del servidor centralizadas
│   ├── api/              # Route Handlers (REST)
│   └── (main)/           # Layout principal y rutas protegidas
├── src/
│   ├── features/         # Lógica de dominio encapsulada (Auth, Products, etc.)
│   ├── core/             # Proveedores globales, esquemas de DB y configuración core
│   ├── lib/              # Inicialización de SDKs externos (Supabase, material)
│   ├── shared/           # Componentes UI atómicos, hooks y utilidades reusables
│   ├── styles/           # Tokens de diseño y CSS modular
│   └── types/            # Definiciones de tipos TypeScript globales
├── database/             # Scripts SQL y definiciones Drizzle
└── migrations/           # Historial de migraciones de base de datos
```

## 🧠 Lógica de Operación

1. **Rendering:** Prioriza Server Components (RSC) para despacho de datos y SEO. Los Client Components se limitan a interactividad granular (Material Components).
2. **Data Flow:**
   - **Lectura:** Next.js Fetch + Drizzle directamente en RSC.
   - **Escritura:** React Server Actions con revalidación de caché mediante `revalidatePath`.
3. **Autenticación:** Gestión mediante Middleware de Supabase para protección de rutas a nivel de edge.
4. **Diseño:** Implementación estricta de Material Design 3 utilizando Web Components nativos para máxima performance y fidelidad visual.

## 🚀 Inicio Rápido

```bash
pnpm install
pnpm dev
```

---
*Este proyecto está en migración activa hacia la estructura completa de `features`.*

