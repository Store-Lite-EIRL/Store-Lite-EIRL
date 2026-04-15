import Link from 'next/link';

export default function SolutionsSection() {
  const problems = [
    {
      icon: 'attach_money',
      problem: 'Crear una tienda online cuesta miles',
      solution: 'Es gratis. Sin mensualidad, sin sorpresa.',
      badge: 'GRATIS',
    },
    {
      icon: 'speed',
      problem: 'Te toma semanas poner algo en marcha',
      solution: 'Listo en minutos. Tu tienda online desde el día uno.',
      badge: 'MINUTOS',
    },
    {
      icon: 'payment',
      problem: 'Te complicas con pagos y cobros',
      solution: 'Pagos directos y seguros integrados.',
      badge: 'SEGURO',
    },
    {
      icon: 'local_shipping',
      problem: 'Gestionar envíos es un dolor de cabeza',
      solution: 'Todo desde la app. Control total sin salir de casa.',
      badge: 'APP',
    },
    {
      icon: 'inventory_2',
      problem: 'Perdés productos y stock en hojas de cálculo',
      solution: 'Tu catálogo siempre al día y sin esfuerzo.',
      badge: 'STOCK',
    },
    {
      icon: 'trending_up',
      problem: 'No sabés qué está funcionando y qué no',
      solution: 'Datos reales. Decisiones basadas en info, no en intuición.',
      badge: 'DATOS',
    },
  ];

  const integrations = [
    {
      name: 'Culqi',
      category: 'Pagos',
      description: 'Pagos con tarjetas y billeteras digitales',
      icon: 'credit_card',
    },
    {
      name: 'Shalom',
      category: 'Envíos',
      description: 'Envíos a todo el Perú',
      icon: 'local_shipping',
    },
    {
      name: 'Instagram',
      category: 'Ventas',
      description: 'Vende directamente por Instagram',
      icon: 'photo_camera',
    },
    {
      name: 'WhatsApp',
      category: 'Atención',
      description: 'Gestión de pedidos por chat',
      icon: 'chat',
    },
    {
      name: 'Google',
      category: 'Dominio',
      description: 'Tu dominio personalizado gratis',
      icon: 'language',
    },
    {
      name: 'Analytics',
      category: 'Datos',
      description: 'Métricas y reportes en tiempo real',
      icon: 'insights',
    },
  ];

  return (
    <section className="landing-section" id="soluciones">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">¿Te suena conocido?</span>
          <h2 className="section-title-landing">
            Dejá de complicarte.
            <br /> Enfocáte en vender.
          </h2>
          <p className="section-description">
            Crear y mantener un e-commerce no debería ser un proyecto de ingeniería. Store.Lite te
            da lo que necesitás, sin lo que no necesitás.
          </p>
        </div>

        <div className="problems-grid">
          {problems.map((item) => (
            <article className="problem-card" key={item.problem}>
              <div className="problem-icon-wrapper">
                <div className="problem-icon-glow" />
                <div className="problem-icon">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
              </div>
              <div className="problem-content">
                <span className="problem-label">El problema</span>
                <h3 className="problem-title">{item.problem}</h3>
                <div className="solution-divider" />
                <span className="solution-label">La solución</span>
                <p className="solution-text">{item.solution}</p>
              </div>
              <span className="highlight-badge">{item.badge}</span>
            </article>
          ))}
        </div>

        <div className="integrations-section">
          <div className="integrations-header">
            <span className="section-eyebrow">Integraciones</span>
            <h3>Todo lo que necesitás, conectado</h3>
            <p>Herramientas que ya usás, ahora integradas en tu tienda.</p>
          </div>

          <div className="integrations-grid">
            {integrations.map((item) => (
              <div className="integration-card" key={item.name}>
                <div className="integration-icon-wrapper">
                  <span className="material-symbols-outlined integration-icon">{item.icon}</span>
                </div>
                <div className="integration-info">
                  <span className="integration-name">{item.name}</span>
                  <span className="integration-category">{item.category}</span>
                  <p className="integration-description">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="integrations-note">
            <span className="material-symbols-outlined">add_circle</span>+ Más integraciones coming
            soon
          </p>
        </div>

        <div className="spotlight-card solutions-spotlight">
          <div className="spotlight-content">
            <span className="spotlight-label">Tu próximo paso</span>
            <h3>Tu tienda lista para vender, sin esperar</h3>
            <p>Todo lo que acabás de ver, disponible ahora mismo. Creá tu cuenta y arrancá hoy.</p>
          </div>
          <div className="spotlight-actions">
            <Link href="/auth" className="btn-primary-glow">
              Crear mi tienda gratis <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
