'use client';

import { formatSoles, PLAN_LABELS, PLAN_PRICES } from '@/shared/billing/planPrices';
import Link from 'next/link';
import { useState } from 'react';

type BillingPeriod = 'mes' | 'anual';

interface LandingPlan {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  badge?: string;
}

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('mes');
  const isAnnual = billingPeriod === 'anual';
  const periodLabel = isAnnual ? 'año' : 'mes';

  const plans: LandingPlan[] = [
    {
      name: PLAN_LABELS.lite_pago,
      monthlyPrice: formatSoles(PLAN_PRICES.lite_pago.monthly),
      annualPrice: formatSoles(PLAN_PRICES.lite_pago.annual),
      badge: 'Más elegido',
      description:
        'Para negocios que ya venden y quieren escalar. Herramientas profesionales para crecer sin límites y con equipo de trabajo.',
      features: [
        '💳 Pagos con tarjetas y billeteras digitales',
        '📦 Hasta 300 productos premium',
        '🎨 Personalización completa del diseño',
        '👥 Equipo de 2 usuarios adicionales',
        '📊 Dashboard con métricas de ventas',
        '🎯 SEO avanzado incluido',
      ],
      cta: 'Escalar mi negocio',
      popular: true,
    },
    {
      name: PLAN_LABELS.lite_plus,
      monthlyPrice: formatSoles(PLAN_PRICES.lite_plus.monthly),
      annualPrice: formatSoles(PLAN_PRICES.lite_plus.annual),
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

        <div
          className="pricing-billing-toggle pricing-billing-toggle--landing"
          role="group"
          aria-label="Período de facturación"
        >
          <button
            type="button"
            className={`pricing-billing-option ${!isAnnual ? 'pricing-billing-option--active' : ''}`}
            onClick={() => setBillingPeriod('mes')}
            aria-pressed={!isAnnual}
          >
            Mensual
          </button>
          <button
            type="button"
            className={`pricing-billing-option ${isAnnual ? 'pricing-billing-option--active' : ''}`}
            onClick={() => setBillingPeriod('anual')}
            aria-pressed={isAnnual}
          >
            Anual
          </button>
        </div>

        <div className="pricing-cards-flow">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <article className={`pricing-card ${plan.popular ? 'popular' : ''}`} key={plan.name}>
                {plan.popular && <span className="pricing-badge">{plan.badge}</span>}
                <div className="pricing-card-header">
                  <span className="pricing-plan-name">{plan.name}</span>
                  <div className="pricing-price-wrapper">
                    <span className="pricing-currency">S/</span>
                    <span className="pricing-price">{price}</span>
                    <span className="pricing-period">/{periodLabel}</span>
                  </div>
                  {isAnnual && (
                    <div className="pricing-annual-save">Ahorra 2 meses con pago anual</div>
                  )}
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
            );
          })}
        </div>

        <p className="pricing-footer-note">
          <span className="material-symbols-outlined">verified</span>
          Todos los planes incluyen dominio gratis · Soporte básico · Sin permanencia · Empieza
          gratis en Lite
        </p>
      </div>
    </section>
  );
}
