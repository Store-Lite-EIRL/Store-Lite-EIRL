import { formatSoles, PLAN_PRICES } from '@/shared/billing/planPrices';
import Link from 'next/link';

export default function PricingSection() {
  const plans = [
    {
      name: 'Emprendedor',
      price: formatSoles(PLAN_PRICES.emprendedor.monthly),
      period: 'mes',
      description:
        'Perfecto para ti que empiezas. Ten tu tienda online lista en minutos, sin complicaciones técnicas ni costos ocultos.',
      features: [
        '🌐 Tu dominio personalizado (tutienda.com)',
        '📦 Hasta 150 productos en tu catálogo',
        '💬 Gestión de pedidos por WhatsApp y Chat',
        '🔒 Seguridad básica incluida',
        '⚡ Configuración en menos de 10 minutos',
        '📱 Diseño adaptado a celular',
      ],
      cta: 'Crear mi tienda gratis',
      popular: false,
    },
    {
      name: 'Business Pro',
      price: formatSoles(PLAN_PRICES.business_pro.monthly),
      period: 'mes',
      badge: 'Más elegido',
      description:
        'Para negocios que ya venden y quieren escalar. Herramientas profesionales para crecer sin límites y con equipo de trabajo.',
      features: [
        '💳 Pagos con tarjetas y billeteras digitales',
        '📦 Hasta 300 productos premium',
        '🎨 Personalización completa del diseño',
        '👥 Equipo de 2 usuarios adicionales',
        '📊 Dashboard con métricas de ventas',
        '📦 Integración con envíos Urbano',
        '🎯 SEO avanzado incluido',
      ],
      cta: 'Escalar mi negocio',
      popular: true,
    },
    {
      name: 'Enterprise Pro',
      price: formatSoles(PLAN_PRICES.enterprise_pro.monthly),
      period: 'mes',
      description:
        'Para marcas que necesitan el máximo rendimiento y todas las herramientas para escalar.',
      features: [
        '📊 Dashboard avanzado con métricas en tiempo real',
        '👥 Hasta 4 usuarios en tu equipo',
        '📦 Hasta 600 productos',
        '🎨 Personalización completa del diseño',
        '💳 Pagos con tarjetas y billeteras digitales',
        '🎯 SEO avanzado incluido',
      ],
      cta: 'Obtener máxima potencia',
      popular: false,
    },
  ];

  return (
    <section className="landing-section" id="pricing">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Planes</span>
          <h2 className="section-title-landing">Encuentra el plan que hace crecer tu negocio</h2>
          <p className="section-description">
            Precios claros. Sin letras chiquitas. Empieza gratis y escala cuando quieras.
          </p>
        </div>

        <div className="pricing-cards-flow">
          {plans.map((plan) => (
            <article className={`pricing-card ${plan.popular ? 'popular' : ''}`} key={plan.name}>
              {plan.popular && <span className="pricing-badge">{plan.badge}</span>}
              <div className="pricing-card-header">
                <span className="pricing-plan-name">{plan.name}</span>
                <div className="pricing-price-wrapper">
                  <span className="pricing-currency">S/</span>
                  <span className="pricing-price">{plan.price}</span>
                  <span className="pricing-period">/{plan.period}</span>
                </div>
              </div>
              <p className="pricing-description">{plan.description}</p>
              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="material-symbols-outlined check-icon">check_circle</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                className={`pricing-cta-btn ${
                  plan.popular ? 'pricing-btn-primary' : 'pricing-btn-secondary'
                }`}
                href="/auth"
              >
                {plan.cta}
                <span className="material-symbols-outlined btn-icon">arrow_forward</span>
              </Link>
            </article>
          ))}
        </div>

        <p className="pricing-footer-note">
          <span className="material-symbols-outlined">verified</span>
          Todos los planes incluyen dominio gratis · Soporte básico · Sin permanencia
        </p>
      </div>
    </section>
  );
}
