'use client';

import styles from './MarketingPanel.module.css';

interface Tile {
  icon: string;
  className: string;
}

/** Four rotated glass deco tiles (design "Viewport decor" icon set). */
const TILES: Tile[] = [
  { icon: 'shopping_bag', className: styles.deco1 },
  { icon: 'sell', className: styles.deco2 },
  { icon: 'payments', className: styles.deco3 },
  { icon: 'receipt_long', className: styles.deco4 },
];

/**
 * Four rotated glass deco tiles for the marketing panel (R4/R7).
 * Purely decorative — the whole layer is hidden from assistive
 * technology, mirroring the orbs/particles on the viewport layer.
 */
export default function DecoTiles() {
  return (
    <div className={styles.decoLayer} aria-hidden="true">
      {TILES.map((tile) => (
        <div key={tile.icon} className={`${styles.deco} ${tile.className}`}>
          <span className="material-symbols-rounded">{tile.icon}</span>
        </div>
      ))}
    </div>
  );
}
