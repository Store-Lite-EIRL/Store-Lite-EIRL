'use client';

import styles from './MarketingPanel.module.css';

interface Feature {
  title: string;
  subtitle: string;
  icon: string;
}

/** Four feature cards pinned by spec R4 (mockup icon set). */
const FEATURES: Feature[] = [
  { title: 'Tu tienda', subtitle: 'Lista para vender', icon: 'storefront' },
  { title: 'Pagos simples', subtitle: 'Directos a tu cuenta', icon: 'payments' },
  { title: 'Inventario', subtitle: 'Siempre al día', icon: 'inventory_2' },
  { title: 'Pedidos', subtitle: 'Bajo control', icon: 'receipt_long' },
];

/** Feature grid — four cards with exact titles/subtitles (R4). */
export default function FeatureGrid() {
  return (
    <div className={styles.featureGrid}>
      {FEATURES.map((feature) => (
        <div key={feature.title} className={styles.featureCard}>
          <div className={styles.iconChip}>
            <span className="material-symbols-rounded" aria-hidden="true">
              {feature.icon}
            </span>
          </div>
          <h4>{feature.title}</h4>
          <p>{feature.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
