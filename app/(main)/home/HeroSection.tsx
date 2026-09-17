import Link from 'next/link';

import styles from './HeroSection.module.css';
import ProductFrame from './ProductFrame';

export default function HeroSection() {
  return (
    <section className={styles.hero} id="inicio">
      <div className={`${styles.blob} ${styles.blob1}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blob2}`} aria-hidden="true" />

      <div className={styles.wrap}>
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <h1 className={styles.typeDisplay}>
              Enfócate en vender con <span className={styles.brandName}>Store Lite</span>
            </h1>

            <div className={styles.actions}>
              <Link href="/auth" className={`${styles.btn} ${styles.btnPrimary}`}>
                Crear mi tienda gratis
              </Link>
              <Link href="#pricing" className={`${styles.btn} ${styles.btnOutline}`}>
                Ver planes
              </Link>
            </div>
          </div>

          <ProductFrame />
        </div>
      </div>
    </section>
  );
}
