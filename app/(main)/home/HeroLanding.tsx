import Link from 'next/link';

const proofCards = [
  {
    title: 'Setup simple',
    description: 'Publica tu negocio y empieza a cobrar sin una curva absurda.',
    icon: 'bolt',
    accentClass: 'accent-blue-dark',
  },
  {
    title: 'Operación clara',
    description: 'Inventario, pedidos y comunicación en un solo flujo.',
    icon: 'dashboard_customize',
    accentClass: 'accent-blue-medium',
  },
  {
    title: 'Escala real',
    description: 'Una base visual fuerte para crecer sin rehacer todo después.',
    icon: 'trending_up',
    accentClass: 'accent-blue-light',
  },
];

export default function HeroLanding() {
  return (
    <section className="hero-landing" id="inicio">
      <div className="glow-effect glow-blue-strong" />
      <div className="glow-effect glow-blue-weak" />
      <div className="hero-text-spotlight" />

      <div className="hero-content">
        <div className="spotlight-fixture">
          <span className="spotlight-light" />
        </div>
        <div className="hero-eyebrow">Escala tu negocio sin pelearte con herramientas rotas</div>
        <h1 className="hero-title">
          Tu vitrina digital,
          <br />
          lista para vender desde el día uno
        </h1>
        <p className="hero-subtitle">
          <span className="spotlight-name">Store Lite</span> te da todo lo que necesitas para que tu
          marca se vea profesional desde el primer click.
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
        {/* Outer glow frame */}
        <div className="preview-frame-glow" />

        <div className="dashboard-mockup">
          {/* Browser chrome bar */}
          <div className="browser-chrome">
            <div className="chrome-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="chrome-url-bar">
              <div className="chrome-url-text" />
            </div>
            <div className="chrome-actions">
              <div className="chrome-action-btn" />
              <div className="chrome-action-btn" />
            </div>
          </div>

          <div className="preview-shell">
            {/* ── SIDEBAR ── */}
            <aside className="preview-sidebar">
              <div className="preview-profile-item">
                <div className="preview-avatar" />
                <div className="profile-copy">
                  <div className="sk-line sk-short sk-white" />
                  <div className="sk-line sk-tiny sk-muted" />
                </div>
              </div>

              <div className="sidebar-divider" />

              <div className="preview-nav-mock">
                {[
                  { color: 'blue', active: true },
                  { color: 'violet', active: false },
                  { color: 'emerald', active: false },
                  { color: 'amber', active: false },
                  { color: 'rose', active: false },
                ].map(({ color, active }, i) => (
                  <div
                    className={`nav-item-sk${active ? ' active' : ''}`}
                    key={i}
                    data-color={color}
                  >
                    <div className={`nav-icon-sk nav-icon-${color}`} />
                    <div className="sk-line sk-medium sk-muted" />
                  </div>
                ))}
              </div>

              <div className="sidebar-spacer" />

              <div className="sidebar-footer-sk">
                <div className="sk-badge sk-badge-emerald" />
                <div className="sk-line sk-short sk-muted" />
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="preview-main">
              {/* Topbar */}
              <div className="preview-topbar-mock">
                <div className="topbar-left">
                  <div className="sk-line sk-heading sk-white" style={{ width: '140px' }} />
                  <div className="sk-line sk-tiny sk-muted" style={{ width: '90px' }} />
                </div>
                <div className="mock-search-bar">
                  <div className="search-inner-icon" />
                  <div className="sk-line sk-medium sk-muted" style={{ flex: 1 }} />
                </div>
                <div className="topbar-right">
                  <div className="topbar-notif-btn">
                    <div className="notif-dot" />
                  </div>
                  <div className="preview-avatar sm" />
                </div>
              </div>

              {/* KPI Stats Row */}
              <div className="preview-kpi-row">
                {[
                  { color: 'blue', w: '55%' },
                  { color: 'violet', w: '70%' },
                  { color: 'emerald', w: '40%' },
                  { color: 'amber', w: '60%' },
                ].map(({ color, w }, i) => (
                  <div className={`kpi-card kpi-${color}`} key={i}>
                    <div className={`kpi-icon-block kpi-icon-${color}`} />
                    <div className="kpi-body">
                      <div className="sk-line sk-tiny sk-muted" />
                      <div className="sk-line sk-short sk-white" style={{ width: w }} />
                    </div>
                    <div className={`kpi-sparkline kpi-spark-${color}`}>
                      {[40, 65, 45, 80, 60, 90, 70].map((h, j) => (
                        <div
                          key={j}
                          className={`spark-bar spark-${color}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Middle content: Chart + Product grid */}
              <div className="preview-mid-grid">
                {/* Chart panel */}
                <section className="mock-panel chart-panel">
                  <div className="panel-header">
                    <div className="sk-line sk-short sk-white" />
                    <div className="sk-badge sk-badge-blue" />
                  </div>
                  <div className="mock-chart-area">
                    <div className="chart-y-axis">
                      {[4].map((_, i) => (
                        <div
                          key={i}
                          className="sk-line sk-tiny sk-muted"
                          style={{ width: '28px' }}
                        />
                      ))}
                    </div>
                    <div className="chart-plot">
                      <div className="chart-grid-lines">
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} className="chart-grid-line" />
                        ))}
                      </div>
                      <div className="chart-bars-inner">
                        {[56, 74, 48, 90, 62, 84, 68, 77, 55, 88].map((height, i) => (
                          <div className="bar-col" key={i}>
                            <div
                              className={`chart-bar-new cb-${['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan', 'blue', 'violet', 'emerald', 'amber'][i % 6]}`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="chart-legend">
                    {['Revenue', 'Orders', 'Visitors'].map((label, i) => (
                      <div
                        key={i}
                        className={`legend-item legend-${['blue', 'violet', 'emerald'][i]}`}
                      >
                        <div className="legend-dot" />
                        <div className="sk-line sk-tiny sk-muted" style={{ width: '40px' }} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Product grid panel */}
                <section className="mock-panel products-panel">
                  <div className="panel-header">
                    <div className="sk-line sk-short sk-white" />
                    <div className="sk-badge sk-badge-violet" />
                  </div>
                  <div className="products-grid-sk">
                    {[
                      { bg: 'prod-rose' },
                      { bg: 'prod-cyan' },
                      { bg: 'prod-orange' },
                      { bg: 'prod-blue' },
                    ].map(({ bg }, i) => (
                      <div className="product-card-sk" key={i}>
                        <div className={`product-thumb ${bg}`} />
                        <div className="product-meta-sk">
                          <div className="sk-line sk-tiny sk-white" />
                          <div
                            className={`product-price-sk price-${['blue', 'violet', 'emerald', 'amber'][i]}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Bottom: Orders table + Activity */}
              <div className="preview-bottom-grid">
                {/* Orders table */}
                <section className="mock-panel orders-panel">
                  <div className="panel-header">
                    <div className="sk-line sk-short sk-white" />
                    <div className="sk-badge sk-badge-emerald" />
                  </div>
                  <div className="orders-table-sk">
                    <div className="orders-thead">
                      {[60, 45, 35, 50].map((w, i) => (
                        <div
                          key={i}
                          className="sk-line sk-tiny sk-muted"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    {[
                      { color: 'blue' },
                      { color: 'emerald' },
                      { color: 'amber' },
                      { color: 'rose' },
                    ].map(({ color }, i) => (
                      <div className="order-row-sk" key={i}>
                        <div className={`order-avatar-sk oa-${color}`} />
                        <div className="sk-line sk-short sk-white" style={{ flex: 1 }} />
                        <div className="sk-line sk-tiny sk-muted" style={{ width: '55px' }} />
                        <div className={`order-status-sk os-${color}`} />
                        <div className="order-action-sk" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Activity feed */}
                <section className="mock-panel activity-panel">
                  <div className="panel-header">
                    <div className="sk-line sk-short sk-white" />
                  </div>
                  <div className="activity-feed-sk">
                    {[
                      { color: 'blue' },
                      { color: 'emerald' },
                      { color: 'violet' },
                      { color: 'amber' },
                      { color: 'rose' },
                    ].map(({ color }, i) => (
                      <div className="activity-row-sk" key={i}>
                        <div className="activity-line-sk">
                          {i < 4 && <div className="activity-connector" />}
                          <div className={`activity-dot-sk ad-${color}`} />
                        </div>
                        <div className="activity-text-sk">
                          <div className="sk-line sk-medium sk-white" />
                          <div className="sk-line sk-tiny sk-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </main>
          </div>

          <div className="dashboard-fade-bottom" />
        </div>
      </div>
    </section>
  );
}
