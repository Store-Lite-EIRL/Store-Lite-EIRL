'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './PricingSection.module.css';

type BillingPeriod = 'monthly' | 'annual';

interface Plan {
  name: string;
  featured: boolean;
  tag?: string;
  monthly: number;
  annual: number;
  description: string;
  features: readonly string[];
  cta: string;
  ctaVariant: 'primary' | 'outline';
}

const PLANS: Plan[] = [
  {
    name: 'Lite Pago',
    featured: true,
    tag: 'Más elegido',
    monthly: 39,
    annual: 31,
    description: 'Para negocios que ya venden y quieren llevar su marca al siguiente nivel.',
    features: [
      'Pagos con tarjetas y billeteras digitales',
      'Hasta 300 productos publicados',
      'Dashboard con métricas de ventas',
      'Equipo de 2 usuarios adicionales',
      'SEO avanzado incluido',
    ],
    cta: 'Escalar mi negocio',
    ctaVariant: 'primary',
  },
  {
    name: 'Lite Plus',
    featured: false,
    monthly: 79,
    annual: 63,
    description: 'Para marcas que necesitan el máximo rendimiento y todas las herramientas.',
    features: [
      'Dashboard avanzado con métricas en tiempo real',
      'Hasta 4 usuarios en el equipo',
      'Hasta 600 productos publicados',
      'Personalización completa del diseño',
      'SEO avanzado incluido',
    ],
    cta: 'Obtener máxima potencia',
    ctaVariant: 'outline',
  },
];

function periodLabel(period: BillingPeriod): string {
  return period === 'annual' ? '/mes facturado anual' : '/mes';
}

export default function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section className={styles.section} id="pricing">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2>Encuentra el plan que hace crecer tu negocio</h2>
          <p>Precios claros. Sin letras chiquitas. Empieza gratis y escala cuando quieras.</p>
        </div>

        <div className={styles.pricingToggle} role="group" aria-label="Período de facturación">
          <button
            type="button"
            className={`${styles.toggleButton} ${
              period === 'monthly' ? styles.toggleActive : styles.toggleInactive
            }`}
            onClick={() => setPeriod('monthly')}
            aria-pressed={period === 'monthly'}
          >
            Mensual
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${
              period === 'annual' ? styles.toggleActive : styles.toggleInactive
            }`}
            onClick={() => setPeriod('annual')}
            aria-pressed={period === 'annual'}
          >
            Anual
          </button>
        </div>

        <div className={styles.plans}>
          {PLANS.map((plan) => (
            <div
              className={`${styles.plan} ${plan.featured ? styles.planFeatured : ''}`}
              key={plan.name}
            >
              {plan.tag && <span className={styles.planTag}>{plan.tag}</span>}
              <h3>{plan.name}</h3>
              <p className={styles.price}>
                {`S/ ${period === 'monthly' ? plan.monthly : plan.annual}`}
                <span>{periodLabel(period)}</span>
              </p>
              <p className={styles.desc}>{plan.description}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="material-symbols-rounded">check</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                className={`${styles.btn} ${
                  plan.ctaVariant === 'primary' ? styles.btnPrimary : styles.btnOutline
                }`}
                href="/auth"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className={styles.plansNote}>
          Todos los planes incluyen dominio gratis · soporte básico · sin permanencia
        </p>
      </div>
    </section>
  );
}
