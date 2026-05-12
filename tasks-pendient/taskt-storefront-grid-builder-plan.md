# Taskt - Storefront Grid Builder Plan (Bloques Restringidos)

## Objetivo

Definir un plan de implementación para un **builder restringido por bloques** enfocado únicamente en el **grid del storefront público** de cada negocio.

## Decisión de alcance

Esta tarea **NO** incluye:

- colores
- tipografías
- fuentes
- edición libre por píxeles
- drag-and-drop absoluto tipo Canva/Webflow
- personalización de todas las secciones

Esta tarea **SÍ** incluye:

- ordenar bloques del storefront
- mostrar/ocultar bloques permitidos
- configurar el bloque principal de **grid de productos**
- persistir la configuración por negocio
- respetar responsive para mobile, tablet y desktop

---

## Problema actual

Hoy el storefront público está compuesto de forma fija en `app/[slug]/BusinessPageContent.tsx`.

La página renderiza secciones concretas:

- `Hero`
- `FeaturedItems`
- `FilterBar`
- `Feed`
- `Pagination`

Esto tiene una ventaja: el storefront es estable.

Pero tiene una limitación clara:

- el negocio no puede reordenar la experiencia pública
- no existe configuración persistida del layout por negocio
- no hay un schema visual reusable para futuras personalizaciones

---

## Decisión arquitectónica

Se implementará un **builder schema-driven**.

Eso significa que NO vamos a guardar:

- coordenadas absolutas
- `top/left`
- tamaños arbitrarios por píxel

Vamos a guardar:

- el **orden** de los bloques
- si el bloque está **visible**
- la **variante** del bloque
- la configuración del **grid responsive**

### Razón

En e-commerce, permitir libertad total rompe:

- responsive
- accesibilidad
- consistencia de UX
- mantenibilidad del código

El builder restringido resuelve el problema real sin destruir la base del producto.

---

## Bloques permitidos en esta fase

Primera fase mínima:

1. `hero`
2. `featured_categories`
3. `product_grid`

### Regla

El foco principal de esta tarea es `product_grid`.

Los otros bloques solo necesitan:

- orden
- visibilidad

---

## Modelo conceptual

Cada negocio tendrá una configuración de storefront.

### Opción inicial recomendada

Guardar la configuración en:

- `business_settings.preferences`

### Estructura sugerida

```json
{
  "storefrontLayout": {
    "version": 1,
    "sections": [
      {
        "id": "hero",
        "type": "hero",
        "visible": true,
        "order": 0
      },
      {
        "id": "featured_categories",
        "type": "featured_categories",
        "visible": true,
        "order": 1
      },
      {
        "id": "product_grid",
        "type": "product_grid",
        "visible": true,
        "order": 2,
        "config": {
          "columns": {
            "mobile": 1,
            "tablet": 2,
            "desktop": 4
          },
          "gap": {
            "mobile": "md",
            "tablet": "lg",
            "desktop": "xl"
          },
          "cardStyle": "default"
        }
      }
    ]
  }
}
```

---

## Restricciones funcionales del grid

Para evitar locuras cósmicas de layout, el `product_grid` debe tener límites.

### Columnas permitidas

- mobile: `1` o `2`
- tablet: `2` o `3`
- desktop: `3` o `4`

### Gaps permitidos

- `sm`
- `md`
- `lg`
- `xl`

### Variantes iniciales de card/grid

- `default`
- `compact`
- `comfortable`

### Reglas

- no permitir `0` columnas
- no permitir desktop menor que tablet
- no permitir tablet menor que mobile si rompe la progresión visual
- no permitir valores arbitrarios enviados desde cliente sin validación server-side

---

## UI del editor

La interfaz del editor debe ser simple y restringida.

### Componentes del editor

1. **Lista sortable de bloques**
   - reorder con drag-and-drop
   - toggle visible/no visible

2. **Panel de configuración del bloque `product_grid`**
   - columnas por breakpoint
   - gap por breakpoint
   - variante visual

3. **Vista previa**
   - preview desktop
   - luego mobile/tablet

### Librería

Usar `@dnd-kit`, que ya está instalada en el proyecto.

---

## Persistencia

La persistencia debe hacerse con:

- **Server Actions**
- validación de ownership
- `revalidatePath('/[slug]')` o equivalente real del negocio

### Reglas de seguridad

- solo el owner del negocio puede editar
- validar schema del layout en servidor
- ignorar valores fuera del contrato

---

## Estrategia de render en storefront público

El storefront no debe depender de condicionales caóticos repartidos por toda la UI.

### Propuesta

Crear una capa que:

1. lea la configuración persistida
2. ordene las secciones
3. renderice componentes conocidos según `type`

Ejemplo conceptual:

- `hero` -> `Hero`
- `featured_categories` -> `FeaturedItems`
- `product_grid` -> `Feed + Pagination`

### Importante

El render sigue siendo controlado por el sistema.
El usuario configura, pero **NO define HTML libre**.

---

## Fases de implementación

### Fase 1 - Contrato de datos

- definir schema TypeScript del layout
- definir defaults del storefront
- definir mapper seguro desde `preferences`

### Fase 2 - Persistencia

- crear server action para guardar layout
- validar ownership
- validar schema
- revalidar storefront

### Fase 3 - Render público

- adaptar `BusinessPageContent.tsx`
- reemplazar composición fija por render basado en `sections`
- aplicar configuración del `product_grid`

### Fase 4 - Editor privado

- crear panel de administración del layout
- agregar reorder de bloques con `@dnd-kit`
- agregar controles del grid

### Fase 5 - QA funcional

- validar mobile
- validar tablet
- validar desktop
- validar fallback cuando no exista configuración guardada

---

## Riesgos

### 1. Acoplamiento con la UI actual

`BusinessPageContent.tsx` hoy está pensado como composición fija.

**Mitigación**

- extraer render por secciones
- crear una capa de mapping

### 2. Responsive inconsistente

Si permitimos demasiada libertad, el grid se rompe entre breakpoints.

**Mitigación**

- usar solo presets y límites cerrados

### 3. Persistencia frágil

Si se guarda JSON sin contrato, después nadie sabe qué estructura soportar.

**Mitigación**

- tipado fuerte
- versión del schema
- defaults claros

---

## Criterios de éxito

La tarea estará bien resuelta si:

1. un negocio puede reordenar bloques permitidos
2. un negocio puede ocultar/mostrar bloques permitidos
3. el grid de productos puede configurarse por breakpoint dentro de límites
4. los cambios quedan guardados por negocio
5. el storefront público respeta responsive sin estilos arbitrarios

---

## Fuera de alcance inmediato

Esto queda para después:

- paleta de colores
- tipografías
- fondos por sección
- banners promocionales avanzados
- editor visual completo con preview simultáneo multi-device
- bloques custom nuevos

---

## Próximo entregable recomendado

Después de aprobar este plan, el siguiente paso debería ser:

1. definir el **schema TypeScript**
2. decidir si guardamos en `business_settings.preferences` o en tabla dedicada
3. implementar el **MVP del bloque `product_grid`**

---

## Idea principal que NO debemos olvidar

El usuario del negocio necesita **controlar la estructura pública sin romper responsive**.

Por eso, la solución correcta es:

**builder restringido por bloques + configuración persistida + reglas responsive cerradas**

NO:

**editor libre por píxeles**
