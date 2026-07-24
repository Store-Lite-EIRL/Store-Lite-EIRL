# Guías de Desarrollo de Base de Datos

Para mantener la integridad del sistema y asegurar una coordinación adecuada, se establecen las siguientes reglas para cualquier modificación de la base de datos:

## 1. Planificación Obligatoria

**QUEDA PROHIBIDO** realizar modificaciones directas en el esquema (`schema.ts`), modelos de Drizzle o la base de datos de Supabase sin un plan previo.

Antes de cualquier cambio, se debe:

1. Identificar la necesidad técnica.
2. Proponer el cambio mediante un `implementation_plan.md` o discusión técnica.
3. Obtener la aprobación del dueño del proyecto.

## 2. Fuente de Verdad

Siempre verifica si una tabla o columna ya existe en el entorno de producción (Supabase) antes de asumir su ausencia basado únicamente en los archivos de migración locales.

## 3. Migraciones

Cualquier cambio en el esquema debe ir acompañado de su correspondiente archivo de migración generado mediante Drizzle-kit para asegurar la paridad entre entornos.

---

_Nota: Estas reglas son críticas para evitar inconsistencias entre el código y los datos reales del negocio._
