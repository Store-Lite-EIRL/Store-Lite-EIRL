/* eslint-disable max-lines-per-function */
export default function ResponsiveLayoutDemo() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="page-container">
        <h1 className="heading-1">Sistema Responsivo Mobile-First</h1>
        <p className="body-large">
          Demostracion del layout responsivo con medidas exactas para cada viewport.
        </p>
      </section>

      {/* Typography Section */}
      <section className="section">
        <h2 className="heading-2">Tipografía Responsiva</h2>

        <h3 className="heading-3">Encabezados</h3>
        <div className="form-row">
          <p className="body-medium">
            <strong>H1 (32px mobile, 36px tablet, 40px desktop)</strong>
          </p>
          <p className="body-medium">
            <strong>H2 (28px mobile, 32px tablet, 36px desktop)</strong>
          </p>
          <p className="body-medium">
            <strong>H3 (24px mobile, 28px tablet, 32px desktop)</strong>
          </p>
          <p className="body-medium">
            <strong>H4 (20px mobile, 24px tablet, 28px desktop)</strong>
          </p>
        </div>

        <div className="form-row">
          <h3 className="heading-3">Body Text</h3>
          <p className="body-large">
            <strong>Body Large (16px):</strong> Este es el tamaño de fuente principal para párrafos
            y contenido principal.
          </p>
          <p className="body-medium">
            <strong>Body Medium (14px):</strong> Texto secundario con tamaño intermedio, ideal para
            descripciones.
          </p>
          <p className="body-small">
            <strong>Body Small (12px):</strong> Texto pequeño para ayudas, notas al pie o metadatos.
          </p>
        </div>

        <h3 className="heading-3">Labels</h3>
        <div className="form-row">
          <span className="label-large">
            <strong>Label Large (14px)</strong> - Etiquetas principales
          </span>
          <span className="label-medium">
            <strong>Label Medium (12px)</strong> - Etiquetas secundarias
          </span>
          <span className="label-small">
            <strong>Label Small (11px)</strong> - Etiquetas pequeñas
          </span>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="section">
        <h2 className="heading-2">Espaciado Responsivo</h2>
        <p className="body-large">El espaciado se ajusta automáticamente según el viewport:</p>

        <div className="grid">
          <div className="section">
            <h4 className="heading-4">Mobile</h4>
            <ul className="body-small">
              <li>XS: 4px</li>
              <li>SM: 8px</li>
              <li>MD: 12px</li>
              <li>LG: 16px</li>
              <li>XL: 20px</li>
              <li>2XL: 24px</li>
              <li>3XL: 32px</li>
            </ul>
          </div>

          <div className="section">
            <h4 className="heading-4">Tablet</h4>
            <ul className="body-small">
              <li>XS: 6px</li>
              <li>SM: 12px</li>
              <li>MD: 16px</li>
              <li>LG: 20px</li>
              <li>XL: 24px</li>
              <li>2XL: 32px</li>
              <li>3XL: 40px</li>
            </ul>
          </div>

          <div className="section">
            <h4 className="heading-4">Desktop</h4>
            <ul className="body-small">
              <li>XS: 8px</li>
              <li>SM: 16px</li>
              <li>MD: 20px</li>
              <li>LG: 24px</li>
              <li>XL: 32px</li>
              <li>2XL: 40px</li>
              <li>3XL: 48px</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="section">
        <h2 className="heading-2">Grillas Responsivas</h2>
        <p className="body-large">
          Las grillas se adaptan automáticamente:
          <br />
          <strong>Mobile:</strong> 1 columna | <strong>Tablet:</strong> 2 columnas |{' '}
          <strong>Desktop:</strong> 3 columnas
        </p>

        <div className="grid">
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p className="body-medium">
              <strong>Card 1</strong>
            </p>
            <p className="body-small">Contenido responsivo</p>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p className="body-medium">
              <strong>Card 2</strong>
            </p>
            <p className="body-small">Contenido responsivo</p>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-tertiary-container)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p className="body-medium">
              <strong>Card 3</strong>
            </p>
            <p className="body-small">Contenido responsivo</p>
          </div>
        </div>
      </section>

      {/* Breakpoints Section */}
      <section className="section">
        <h2 className="heading-2">Puntos de Quiebre</h2>
        <p className="body-large">Redimensiona la ventana para ver cómo cambian los estilos:</p>

        <div className="form-row">
          <div
            className="show-mobile"
            style={{
              backgroundColor: 'var(--md-sys-color-error-container)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <p className="body-medium">
              <strong>📱 Mobile (320px - 479px)</strong>
            </p>
            <p className="body-small">1 columna, espaciado compacto</p>
          </div>

          <div
            className="show-tablet"
            style={{
              backgroundColor: 'var(--md-sys-color-warning-container)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <p className="body-medium">
              <strong>📊 Tablet (480px - 1023px)</strong>
            </p>
            <p className="body-small">2 columnas, espaciado intermedio</p>
          </div>

          <div
            className="show-desktop"
            style={{
              backgroundColor: 'var(--md-sys-color-success-container)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <p className="body-medium">
              <strong>🖥️ Desktop (1024px+)</strong>
            </p>
            <p className="body-small">3+ columnas, espaciado amplio</p>
          </div>
        </div>
      </section>

      {/* Container Section */}
      <section className="section">
        <h2 className="heading-2">Ancho Máximo del Contenedor</h2>
        <div className="form-row">
          <p className="body-medium">
            <strong>Mobile:</strong> 100% (sin límite)
          </p>
          <p className="body-medium">
            <strong>Tablet:</strong> 768px
          </p>
          <p className="body-medium">
            <strong>Desktop:</strong> 1440px
          </p>
        </div>
      </section>

      {/* Flex Section */}
      <section className="section">
        <h2 className="heading-2">Flexbox Responsivo</h2>
        <p className="body-large">En mobile es columna, en tablet y desktop es fila:</p>

        <div className="flex-mobile">
          <div
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-surface-dim)',
              borderRadius: '8px',
              minHeight: '100px',
            }}
          >
            <p className="body-medium">
              <strong>Flex Item 1</strong>
            </p>
          </div>

          <div
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-surface-bright)',
              borderRadius: '8px',
              minHeight: '100px',
            }}
          >
            <p className="body-medium">
              <strong>Flex Item 2</strong>
            </p>
          </div>

          <div
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '8px',
              minHeight: '100px',
            }}
          >
            <p className="body-medium">
              <strong>Flex Item 3</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Implementation Tips */}
      <section className="section">
        <h2 className="heading-2">Tips de Implementación</h2>

        <h3 className="heading-3">1. Usa Clases Predefinidas</h3>
        <p className="body-medium">
          Siempre usa las clases CSS predefinidas como <code>.container</code>,{' '}
          <code>.section</code>, <code>.grid</code>, etc.
        </p>

        <h3 className="heading-3">2. Mobile First</h3>
        <p className="body-medium">
          Define los estilos para mobile primero, luego usa @media para versiones más grandes.
        </p>

        <h3 className="heading-3">3. Variables CSS</h3>
        <p className="body-medium">
          Usa las variables CSS definidas para mantener consistencia:
          <br />
          <code>font-size: var(--mobile-body-large)</code>
        </p>

        <h3 className="heading-3">4. Breakpoints Estándar</h3>
        <p className="body-medium">
          Usa siempre los breakpoints definidos: 480px, 1024px, 1440px, 1920px
        </p>
      </section>
    </div>
  );
}
