# 🔄 Comandos para Actualizar Base de Datos

## Ubicación de Archivos

- **Schema:** `database/schema.ts`
- **Cliente:** `database/client.ts`
- **Config:** `drizzle.config.ts`

## 🚀 Workflow Rápido

### 1. Editar Schema

```bash
# Abrir y editar
code database/schema.ts
```

### 2. Generar Migración SQL

```bash
npx drizzle-kit generate
```

### 3. Aplicar a Supabase

```bash
# Opción A: Pedir al AI
"Aplica la última migración a Supabase"

# Opción B: Push directo
npx drizzle-kit push
```

## 📦 Comandos Útiles

```bash
# Ver BD visualmente
npx drizzle-kit studio

# Verificar cambios pendientes
npx drizzle-kit check

# Listar migraciones
ls migrations/
```

## 💾 Proyecto Supabase

- **Nombre:** ecommerce-sass
- **ID:** cncmbykyycuajxcjfjfp

## ✅ Tablas Actuales

1. `profiles`
2. `stores`
3. `store_settings`
4. `product_categories` ⭐ NUEVO (max 5 por tienda)
5. `products` (con `category_id`)
6. `product_media`
7. `messages`

Ver documentación completa en `UPDATE_GUIDE.md`
