'use client';

import Link from 'next/link';
import styles from './MarketingPanel.module.css';

/**
 * In-panel consent bar (design D1): persistent preference shortcut
 * pill deep-linking /privacidad (spec R4). Complements the global
 * ConsentBanner (first-visit prompt) — out of scope here.
 */
export default function ConsentBar() {
  return (
    <div className={styles.consentBar}>
      <span className={styles.consentCaption}>Preferencias de seguimiento</span>
      <Link href="/privacidad" className={styles.consentLink}>
        Cambiar preferencias
      </Link>
    </div>
  );
}
