import Link from 'next/link';

import styles from './CtaBanner.module.css';

export default function CtaBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.banner}>
          <div className={styles.bannerInner}>
            <div>
              <h3 className={styles.typeHeadline}>Tu tienda lista para vender, sin esperar</h3>
              <p className={styles.typeBodyLg}>
                Todo lo que acabas de ver, disponible ahora mismo. Crea tu cuenta y arranca hoy.
              </p>
            </div>
            <Link className={`${styles.btn} ${styles.btnOnPrimary}`} href="/auth">
              Crear mi tienda gratis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
