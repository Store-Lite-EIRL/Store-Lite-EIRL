export default function StatsSection() {
  const stats = [
    {
      value: '50+',
      label: 'Tiendas activas',
      description: 'Emprendedores arrancando',
      icon: 'storefront',
    },
    {
      value: '2K+',
      label: 'Productos',
      description: 'Productos publicados',
      icon: 'inventory_2',
    },
    {
      value: '99%',
      label: 'Uptime',
      description: 'Plataforma siempre disponible',
      icon: 'verified',
    },
    {
      value: '24h',
      label: 'Soporte',
      description: 'Tiempo de respuesta',
      icon: 'support_agent',
    },
  ];

  return (
    <section className="landing-section" id="stats">
      <div className="section-container">
        <div className="stats-header">
          <span className="section-eyebrow">Números reales</span>
          <h2 className="section-title-landing">Lo que va generando</h2>
          <p className="section-description">
            Acabamos de arrancar y ya tenemos traction. Estos son los números actuales.
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon-wrapper">
                <span className="material-symbols-outlined stat-icon">{stat.icon}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <p className="stat-description">{stat.description}</p>
            </div>
          ))}
        </div>

        <div className="stats-footer">
          <p>
            <span className="stats-emoji">🚀</span>
            <strong>Nuevas tiendas cada semana</strong> ·{' '}
            <span className="stats-growth">Y creciendo</span>
          </p>
        </div>
      </div>
    </section>
  );
}
