# Taskt - Storefront Theme Plan (Fuente + Colores)

## Objetivo

Definir el plan de implementación para la siguiente evolución del storefront:

- hacer la UI de settings más compacta
- agregar configuración de **fuente**
- agregar configuración de **colores**
- reutilizar como base la lógica visual del preview de creación de negocio

---

## Contexto verificado

En `app/created/components/BusinessPreview.tsx` ya existe:

- un botón con ícono `palette`
- una función `randomizeColors()`
- un gradiente de 3 colores
- cálculo de luminancia para decidir contraste claro/oscuro

### Importante

Hoy esa lógica:

- es local al preview
- no se persiste
- no se comparte con settings
- no afecta el storefront real

Por eso, la próxima fase NO debe copiar esa implementación tal cual.
Debe convertirla en una base compartida del sistema visual del storefront.

---

## Alcance de esta tarea

### Sí incluye

- inputs más compactos en settings
- fuente del storefront
- colores base del storefront
- defaults visuales persistidos por negocio
- reutilización del generador de paleta del preview como inspiración/base

### No incluye

- fuentes externas
- editor visual avanzado de paletas
- theming total del sistema Material Design 3
- dark mode completo por negocio con múltiples variantes
- layouts editoriales complejos (ej. categorías al lado del hero)

---

## Principio rector

Primero se diseña:

1. **contrato**
2. **persistencia**
3. **defaults**
4. **aplicación controlada**

Después se agregan más opciones.

No al revés.

---

# Fase A - Compactar la UI de settings

## Objetivo

Hacer que los controles del editor se vean más ordenados y profesionales.

## Implementación propuesta

- inputs/selects en **2 columnas**
- desktop y tablet: dos controles por fila
- mobile: una columna

## Beneficio

- menos scroll
- mejor lectura
- mayor densidad visual sin verse apretado

## Riesgo

Que en pantallas chicas se vea forzado.

## Mitigación

- layout responsivo
- una sola columna en mobile

---

# Fase B - Contrato de datos para tema visual

## Objetivo

Definir una estructura persistible y estable para fuente + colores.

## Propuesta inicial

Guardar en `business_settings.preferences`.

### Estructura sugerida

```json
{
  "storefrontTheme": {
    "version": 1,
    "fontFamily": "inter",
    "palette": {
      "primary": "#6366f1",
      "secondary": "#a855f7",
      "accent": "#ec4899"
    },
    "surfaceMode": "dark"
  }
}
```

## Campos mínimos recomendados

- `fontFamily`
- `primary`
- `secondary`
- `accent`
- `surfaceMode` o `isDark`

## Riesgo

Meter demasiados tokens desde el inicio.

## Mitigación

Mantener esta primera versión chica y extensible.

---

# Fase C - Fuente del storefront

## Restricción del usuario

Usar solo fuentes soportadas por Next.js de forma nativa.

## Propuesta

Implementar fuentes vía `next/font`.

## Set inicial recomendado

- `Inter`
- `Roboto`
- `Poppins`

## UX recomendada

No mostrarle al usuario nombres técnicos solamente.

### Ejemplo

- Moderna → Inter
- Neutral → Roboto
- Comercial → Poppins

## Riesgo

Que la fuente se aplique de forma inconsistente entre preview y storefront.

## Mitigación

Centralizar la fuente elegida en el contrato `storefrontTheme`.

---

# Fase D - Colores del storefront

## Objetivo

Tomar la lógica random del preview como semilla de identidad visual por negocio.

## Propuesta

Cuando se crea un negocio:

- generar una paleta inicial de 3 colores
- calcular contraste básico
- guardar esos valores como defaults del negocio

Después, en settings:

- mostrar la paleta actual
- permitir regenerarla
- permitir editarla
- guardar cambios

## Colores iniciales mínimos

- `primary`
- `secondary`
- `accent`

## Riesgo

Que los colores random sean demasiado agresivos o rompan legibilidad.

## Mitigación

- validar contraste
- acotar saturación/luminancia
- usar superficie clara/oscura derivada del promedio visual

---

# Fase E - Extraer lógica compartida desde BusinessPreview

## Objetivo

Evitar duplicación entre preview, settings y storefront real.

## Propuesta

Crear un módulo compartido, por ejemplo:

- `src/core/storefront/storefrontTheme.ts`

## Ese módulo debería encargarse de:

- defaults del tema
- generación de paleta inicial
- normalización del tema
- cálculo de contraste
- merge seguro con `preferences`

## Riesgo

Dejar la lógica encerrada en el preview y duplicarla después.

## Mitigación

Extraer la lógica antes de conectar settings y storefront.

---

# Fase F - Aplicar tema al storefront real

## Objetivo

Hacer visible la fuente y los colores elegidos en la tienda pública.

## Aplicación inicial recomendada

No tocar todo el sistema todavía.

### Empezar por:

- títulos principales
- botones principales
- acentos/chips
- fondos destacados
- algunos bloques visuales del storefront

## No empezar por:

- rehacer todo MD3
- reemplazar todos los tokens del sistema
- theming total del panel privado

## Riesgo

Intentar tematizar toda la app de una sola vez.

## Mitigación

Aplicación progresiva y controlada por bloques.

---

# Orden recomendado de implementación

## Iteración 1

- compactar UI de settings
- definir contrato `storefrontTheme`

## Iteración 2

- extraer generador de paleta desde el preview
- persistir paleta/fuente por negocio

## Iteración 3

- aplicar fuente + colores básicos al storefront

## Iteración 4

- mejorar editor de tema
- agregar regeneración y edición más cómoda

---

# Riesgos generales

## 1. Mezclar preview decorativo con sistema real

El preview hoy es un componente visual aislado.

### Mitigación

Convertir su lógica en módulo compartido antes de reutilizarla.

## 2. Exceso de opciones en settings

Demasiadas opciones complican al usuario y al producto.

### Mitigación

Pocas decisiones, bien nombradas.

## 3. Inconsistencia entre preview y storefront

Si un negocio ve una paleta en preview y otra en storefront, se pierde confianza.

### Mitigación

Una sola fuente de verdad: `storefrontTheme`.

## 4. Mala legibilidad por colores random

Los colores pueden verse lindos pero romper contraste.

### Mitigación

Validación de contraste y superficie derivada.

---

# Criterios de éxito

La fase estará bien hecha si:

1. settings se ve más compacto y claro
2. la fuente se puede elegir desde opciones nativas
3. cada negocio nace con una paleta inicial persistida
4. settings y preview usan la misma base visual
5. el storefront refleja realmente esos valores

---

# Idea futura registrada

Queda anotada como evolución posterior:

- permitir layouts más editoriales
- por ejemplo: mover categorías junto al hero
- ocultar otras secciones para lograr una composición más visual

### Estado

**Fuera de alcance por ahora**.

Primero consolidamos:

- builder restringido
- tema persistido
- fuente y colores básicos

---

# Próximo paso recomendado

Arrancar por:

1. **Fase A** — compactar settings
2. **Fase B** — contrato `storefrontTheme`

Eso nos deja la base lista para conectar colores y fuente sin caos.
