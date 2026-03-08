# Sistema de Layout Responsivo - Mobile First

## Descripción General

Sistema de diseño completamente responsivo basado en **Mobile First** con medidas exactas de tipografía, espaciado y márgenes para cada punto de quiebre.

---

## Breakpoints Definidos

| Dispositivo      | Rango         | Variable                     | Uso                        |
| ---------------- | ------------- | ---------------------------- | -------------------------- |
| **Mobile Small** | 320px - 479px | `--breakpoint-mobile-small`  | Teléfonos pequeños         |
| **Tablet**       | 480px - 839px | `--breakpoint-mobile`        | Tablets, teléfonos grandes |
| **Desktop**      | 1024px+       | `--breakpoint-desktop`       | Computadoras               |
| **Desktop XL**   | 1440px+       | `--breakpoint-desktop-large` | Monitores grandes          |
| **Extra XL**     | 1920px+       | `--breakpoint-desktop-xl`    | Monitores extra grandes    |

---

## Tipografía Responsiva

### Mobile (320px - 479px)

```css
h1     → 32px, font-weight: 700, line-height: 1.2
h2     → 28px, font-weight: 700, line-height: 1.25
h3     → 24px, font-weight: 700, line-height: 1.3
h4     → 20px, font-weight: 600, line-height: 1.35
h5     → 18px, font-weight: 600, line-height: 1.4
h6     → 16px, font-weight: 600, line-height: 1.5

body      → 16px, line-height: 1.5
p         → 16px (body-large)
.body-medium  → 14px, line-height: 1.5
.body-small   → 12px, line-height: 1.4
```

### Tablet (480px - 839px)

```css
h1     → 36px, font-weight: 700, line-height: 1.25
h2     → 32px, font-weight: 700, line-height: 1.3
h3     → 28px, font-weight: 700, line-height: 1.35
h4     → 24px, font-weight: 600, line-height: 1.4
h5     → 20px, font-weight: 600, line-height: 1.45
h6     → 18px, font-weight: 600, line-height: 1.5

body      → 16px, line-height: 1.6
```

### Desktop (1024px+)

```css
h1     → 40px, font-weight: 700, line-height: 1.25
h2     → 36px, font-weight: 700, line-height: 1.3
h3     → 32px, font-weight: 700, line-height: 1.35
h4     → 28px, font-weight: 600, line-height: 1.4
h5     → 24px, font-weight: 600, line-height: 1.45
h6     → 20px, font-weight: 600, line-height: 1.5

body      → 16px, line-height: 1.7
```

---

## Espaciado Responsivo

### Mobile (320px - 479px)

```css
--mobile-spacing-xs: 4px --mobile-spacing-sm: 8px --mobile-spacing-md: 12px
  --mobile-spacing-lg: 16px --mobile-spacing-xl: 20px --mobile-spacing-2xl: 24px
  --mobile-spacing-3xl: 32px;
```

### Tablet (480px - 839px)

```css
--tablet-spacing-xs: 6px --tablet-spacing-sm: 12px --tablet-spacing-md: 16px
  --tablet-spacing-lg: 20px --tablet-spacing-xl: 24px --tablet-spacing-2xl: 32px
  --tablet-spacing-3xl: 40px;
```

### Desktop (1024px+)

```css
--desktop-spacing-xs: 8px --desktop-spacing-sm: 16px --desktop-spacing-md: 20px
  --desktop-spacing-lg: 24px --desktop-spacing-xl: 32px --desktop-spacing-2xl: 40px
  --desktop-spacing-3xl: 48px;
```

---

## Contenedores y Ancho Máximo

### Mobile

- **Ancho máximo**: 100% (sin límite)
- **Padding**: 16px (ambos lados)
- **Ancho disponible**: 100% - 32px

### Tablet

- **Ancho máximo**: 768px
- **Padding**: 24px (ambos lados)
- **Ancho disponible**: 768px

### Desktop

- **Ancho máximo**: 1440px
- **Padding**: 32px (ambos lados)
- **Ancho disponible**: 1440px

### Large Desktop

- **Ancho máximo**: 1320px
- **Padding**: 32px (ambos lados)

---

## Grillas Responsivas

### Mobile

```css
grid-template-columns: 1fr  /* 1 columna */
gap: 12px
```

### Tablet

```css
grid-template-columns: repeat(2, 1fr)  /* 2 columnas */
gap: 16px
```

### Desktop

```css
grid-template-columns: repeat(3, 1fr)  /* 3 columnas */
gap: 24px
```

### Large Desktop

```css
grid-template-columns: repeat(4, 1fr)  /* 4 columnas */
gap: 24px
```

---

## Clases CSS Disponibles

### Contenedores

```html
<div class="container">
  <!-- Contenedor responsivo -->
  <div class="page-container">
    <!-- Contenedor principal de página -->
    <div class="section"><!-- Sección con padding responsivo --></div>
  </div>
</div>
```

### Tipografía

```html
<h1 class="heading-1">
  <!-- Heading 1 responsivo -->
  <p class="body-large"><!-- Texto grande --></p>
  <p class="body-medium"><!-- Texto medio --></p>
  <p class="body-small">
    <!-- Texto pequeño -->
    <span class="label-large">
      <!-- Etiqueta grande -->
      <span class="label-medium">
        <!-- Etiqueta media -->
        <span class="label-small"> <!-- Etiqueta pequeña --></span></span
      ></span
    >
  </p>
</h1>
```

### Grillas

```html
<div class="grid">
  <!-- Grilla responsiva -->
  <div class="grid--2col">
    <!-- Grilla de 2 columnas (desktop) -->
    <div class="grid--4col"><!-- Grilla de 4 columnas (desktop) --></div>
  </div>
</div>
```

### Flexbox

```html
<div class="flex-mobile">
  <!-- Flex responsivo -->
  <div class="row">
    <!-- Fila con gap responsivo -->
    <div class="row--vertical">
      <!-- Fila vertical -->
      <div class="form-row"><!-- Fila de formulario --></div>
    </div>
  </div>
</div>
```

### Visibilidad Responsiva

```html
<div class="show-mobile">
  <!-- Solo visible en mobile -->
  <div class="show-tablet">
    <!-- Solo visible en tablet -->
    <div class="show-desktop"><!-- Solo visible en desktop --></div>
  </div>
</div>
```

### Espaciado

```html
<div class="p-mobile">
  <!-- Padding responsivo -->
  <div class="m-mobile">
    <!-- Margin responsivo -->
    <div class="gap-mobile"><!-- Gap responsivo --></div>
  </div>
</div>
```

---

## Ejemplos de Uso

### Ejemplo 1: Página Responsiva Completa

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="responsive-layout.css" />
  </head>
  <body>
    <div class="container">
      <header>
        <h1 class="heading-1">Mi Sitio Web</h1>
        <p class="body-large">Bienvenido</p>
      </header>

      <main class="page-container">
        <section class="section">
          <h2 class="heading-2">Sección Principal</h2>
          <div class="grid">
            <article>
              <h3 class="heading-3">Artículo 1</h3>
              <p class="body-medium">Contenido responsivo...</p>
            </article>
            <article>
              <h3 class="heading-3">Artículo 2</h3>
              <p class="body-medium">Contenido responsivo...</p>
            </article>
            <article>
              <h3 class="heading-3">Artículo 3</h3>
              <p class="body-medium">Contenido responsivo...</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  </body>
</html>
```

### Ejemplo 2: Card Responsiva

```html
<div class="section">
  <h3 class="heading-3">Tarjeta</h3>
  <div class="flex-mobile">
    <img src="image.jpg" alt="Imagen" />
    <div>
      <h4 class="heading-4">Título de Card</h4>
      <p class="body-medium">Descripción de la tarjeta...</p>
    </div>
  </div>
</div>
```

### Ejemplo 3: Formulario Responsivo

```html
<form class="page-container">
  <div class="form-row">
    <label for="name" class="label-large">Nombre</label>
    <input id="name" type="text" />
  </div>

  <div class="form-row">
    <label for="email" class="label-large">Email</label>
    <input id="email" type="email" />
  </div>

  <div class="grid">
    <button>Enviar</button>
    <button>Cancelar</button>
  </div>
</form>
```

---

## Variables CSS por Viewport

Las variables están estructuradas así:

```css
/* Mobile */
--mobile-<propiedad>

/* Tablet */
--tablet-<propiedad>

/* Desktop */
--desktop-<propiedad>
```

Puedes usar estas variables directamente en tus estilos:

```css
.mi-elemento {
  font-size: var(--mobile-heading-3);
  padding: var(--mobile-spacing-lg);
}

@media (min-width: 480px) {
  .mi-elemento {
    font-size: var(--tablet-heading-3);
    padding: var(--tablet-spacing-lg);
  }
}

@media (min-width: 1024px) {
  .mi-elemento {
    font-size: var(--desktop-heading-3);
    padding: var(--desktop-spacing-lg);
  }
}
```

---

## Notas Importantes

1. **Mobile First**: Siempre comienza definiendo estilos para mobile (320px)
2. **Media Queries**: Usa `min-width` para ir de mobile → desktop
3. **Tipografía**: Los tamaños de fuente se heredan automáticamente
4. **Container Queries**: Si necesitas queries basadas en contenedor, extiende el CSS
5. **Accesibilidad**: Todos los tamaños respetan las pautas WCAG 2.1

---

## Integración con Material Design 3

Este sistema de layout es completamente compatible con:

- Variables de color de Material Design 3 (`--md-sys-color-*`)
- Componentes de Material Web (`<md-*>`)
- Sistema de tipografía de MD3
