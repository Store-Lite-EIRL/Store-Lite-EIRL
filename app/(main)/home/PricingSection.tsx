import Link from 'next/link';

export default function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      description: 'Para validar tu tienda y empezar a vender sin complicarte.',
      price: 'Gratis',
      features: ['Acceso inicial', 'Setup rápido', 'Base visual profesional'],
    },
    {
      name: 'Growth',
      description: 'Para negocios que ya venden y necesitan una operación más seria.',
      price: 'Escalable',
      features: [
        'Más control operativo',
        'Mejor visibilidad del negocio',
        'Experiencia más sólida',
      ],
      highlighted: true,
    },
    {
      name: 'Scale',
      description: 'Para marcas que necesitan una base lista para evolucionar con el equipo.',
      price: 'A medida',
      features: ['Acompañamiento estratégico', 'Mayor personalización', 'Roadmap de crecimiento'],
    },
  ];

  return (
    <section className="landing-section" id="pricing">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Planes</span>
          <h2 className="section-title-landing">Elegí el ritmo de crecimiento que necesitás</h2>
          <p className="section-description">
            En vez de cajas vacías, ahora hay una comparación visual decente para orientar la
            decisión y empujar al usuario hacia la acción correcta.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`price-card ${plan.highlighted ? 'highlighted' : ''}`}
              key={plan.name}
            >
              <div className="price-card-header">
                <span className="price-card-name">{plan.name}</span>
                <strong className="price-card-value">{plan.price}</strong>
              </div>
              <p className="price-card-description">{plan.description}</p>
              <ul className="price-card-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                className={plan.highlighted ? 'btn-primary-glow' : 'btn-secondary-ghost'}
                href="/auth"
              >
                Empezar
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
