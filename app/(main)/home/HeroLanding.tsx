import Link from 'next/link';

const proofCards = [
  {
    title: 'Setup simple',
    description: 'Publicá tu negocio y empezá a cobrar sin una curva absurda.',
    icon: 'bolt',
    accentClass: 'accent-blue',
  },
  {
    title: 'Operación clara',
    description: 'Inventario, pedidos y comunicación en un solo flujo.',
    icon: 'dashboard_customize',
    accentClass: 'accent-violet',
  },
  {
    title: 'Escala real',
    description: 'Una base visual fuerte para crecer sin rehacer todo después.',
    icon: 'trending_up',
    accentClass: 'accent-amber',
  },
];

export default function HeroLanding() {
  return (
    <section className="hero-landing" id="inicio">
      <div className="glow-effect glow-purple" />
      <div className="glow-effect glow-orange" />

      <div className="hero-content">
        <div className="hero-eyebrow">Escalá tu negocio sin pelearte con herramientas rotas</div>
        <h1 className="hero-title">
          Tu vitrina digital,
          <br />
          lista para vender desde el día uno
        </h1>
        <p className="hero-subtitle">
          Store.Lite te da catálogo, pagos, gestión y una experiencia seria para que tu marca se vea
          profesional desde el primer click. Sin humo. Sin vueltas.
        </p>

        <div className="hero-actions">
          <Link href="/auth" className="btn-primary-glow btn-compact">
            Crear mi tienda <span className="arrow">→</span>
          </Link>
          <Link href="/pricing" className="btn-secondary-ghost">
            Ver planes
          </Link>
        </div>

        <div className="hero-proof-grid">
          {proofCards.map((card) => (
            <div className={`hero-proof-card ${card.accentClass}`} key={card.title}>
              <div className="hero-proof-top">
                <div className="hero-proof-icon">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <span className="hero-proof-chip">Activo</span>
              </div>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
              <div className="hero-proof-bar" />
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-preview-container" aria-hidden="true">
        <div className="dashboard-mockup">
          <div className="preview-shell">
            <aside className="preview-sidebar">
              <div className="window-controls-mock">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>

              <div className="preview-profile-item">
                <div className="profile-avatar-skeleton skeleton-block" />
                <div className="profile-copy">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line tiny" />
                </div>
              </div>

              <div className="preview-nav-mock">
                <div className="nav-item-skeleton active">
                  <div className="nav-dot-skeleton" />
                  <div className="skeleton-line medium" />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="nav-item-skeleton" key={i}>
                    <div className="nav-dot-skeleton" />
                    <div className="skeleton-line short" />
                  </div>
                ))}
              </div>
            </aside>

            <main className="preview-main">
              <div className="preview-topbar-mock">
                <div className="mock-search-bar" />
                <div className="topbar-actions-mock">
                  <div className="mock-chip-skeleton skeleton-block" />
                  <div className="mock-avatar-circle skeleton-block" />
                </div>
              </div>

              <div className="preview-header-mock">
                <div className="preview-badge" />
                <div className="preview-headline-group">
                  <div className="skeleton-line heading" />
                </div>
              </div>

              <div className="preview-summary-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="summary-card-skeleton" key={i}>
                    <div className="summary-card-icon skeleton-block" />
                    <div className="summary-card-copy">
                      <div className="skeleton-line tiny" />
                      <div className="skeleton-line short" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="preview-product-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="product-card-skeleton" key={i}>
                    <div className="product-media skeleton-block" />
                    <div className="product-card-footer">
                      <div className="product-pill skeleton-block" />
                      <div className="product-buy-button" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="preview-content-grid-mock">
                <section className="mock-panel main-panel">
                  <div className="panel-kicker" />
                  <div className="mock-chart-skeleton">
                    <div className="mock-chart-lines">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span className="chart-line" key={i} />
                      ))}
                    </div>
                    <div className="mock-chart-bars">
                      {[56, 74, 48, 90, 62, 84, 68].map((height, i) => (
                        <div className="chart-bar-wrap" key={i}>
                          <div className="chart-bar" style={{ height: `${height}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mock-table-skeleton">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div className="mock-table-row" key={i}>
                        <div className="mock-table-cell main">
                          <div className="skeleton-line short" />
                        </div>
                        <div className="mock-table-cell">
                          <div className="skeleton-line tiny" />
                        </div>
                        <div className="mock-table-cell action">
                          <div className="mock-card-btn" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="side-panels-mock">
                  <section className="mock-panel stats-mock">
                    <div className="panel-kicker" />
                    <div className="kpi-stack-skeleton">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div className="kpi-item-skeleton" key={i}>
                          <div className="kpi-ring skeleton-block" />
                          <div className="kpi-copy">
                            <div className="skeleton-line short" />
                            <div className="skeleton-line tiny" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mock-panel activity-mock">
                    <div className="panel-kicker" />
                    <div className="activity-list-skeleton">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div className="activity-item-skeleton" key={i}>
                          <div className="activity-dot skeleton-block" />
                          <div className="activity-copy">
                            <div className="skeleton-line long" />
                            <div className="skeleton-line medium" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </main>
          </div>
          <div className="dashboard-fade-bottom" />
        </div>
      </div>
    </section>
  );
}
