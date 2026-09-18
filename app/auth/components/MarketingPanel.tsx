'use client';

import Checklist from './Checklist';
import ConsentBar from './ConsentBar';
import DecoTiles from './DecoTiles';
import FeatureGrid from './FeatureGrid';
import styles from './MarketingPanel.module.css';

/**
 * Right shell column of /auth (design "Per-panel surfaces"): decorative
 * glass language + feature grid + checklist + in-panel consent bar.
 * Hidden ≤960px via the panel media query (R1, D3). Composes the
 * MarketingPanel family; the 5 components share MarketingPanel.module.css.
 */
export default function MarketingPanel() {
  return (
    <aside className={styles.panel} aria-label="Store Lite">
      <DecoTiles />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Tu negocio, en movimiento</p>
        <h2 className={styles.headline}>Todo lo que vendes, en un solo lugar.</h2>
        <p className={styles.sub}>
          Organiza tu catálogo, recibe pagos y haz crecer tu tienda desde cualquier lugar.
        </p>
        <FeatureGrid />
        <Checklist />
      </div>
      <ConsentBar />
    </aside>
  );
}
