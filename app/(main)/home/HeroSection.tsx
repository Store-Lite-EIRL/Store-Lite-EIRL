import Link from 'next/link';

import styles from './HeroSection.module.css';
import ProductFrame from './ProductFrame';

const FEATURES = [
  {
    emoji: '⚡',
    title: 'Setup simple',
    description: 'Publica tu tienda y empieza a cobrar sin curva de aprendizaje.',
  },
  {
    emoji: '🗂️',
    title: 'Operación clara',
    description: 'Inventario, pedidos y comunicación en un solo flujo.',
  },
] as const;

export default function HeroSection() {
  return (
    <section className={styles.hero} id="inicio">
      <div className={`${styles.blob} ${styles.blob1}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blob2}`} aria-hidden="true" />

      <div className={styles.wrap}>
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <h1 className={styles.typeDisplay}>
              Completa tu negocio con <span className={styles.brandName}>Store Lite</span>
            </h1>
            <p className={`${styles.typeBodyLg} ${styles.textSecondary} ${styles.subtitle}`}>
              Catálogo, pagos y pedidos en una sola herramienta — sin depender de un programador.
            </p>

            <div className={styles.actions}>
              <Link href="/auth" className={`${styles.btn} ${styles.btnPrimary}`}>
                Crear mi tienda gratis
              </Link>
              <Link href="#pricing" className={`${styles.btn} ${styles.btnOutline}`}>
                Ver planes
              </Link>
            </div>

            <div className={styles.featureRow}>
              {FEATURES.map((feature) => (
                <div className={styles.featureCard} key={feature.title}>
                  <div className={styles.featureTop}>
                    <span className={styles.emoji}>{feature.emoji}</span>
                    <span className={styles.live}>
                      <span className={styles.dot} aria-hidden="true" />
                      Activo
                    </span>
                  </div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductFrame />
        </div>
      </div>
    </section>
  );
}
