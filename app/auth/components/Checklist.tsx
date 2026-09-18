'use client';

import styles from './MarketingPanel.module.css';

interface Benefit {
  icon: string;
  text: string;
}

/** Three Spanish benefit rows. Copy and icons match the pre-rebuild
 *  insight panel (design: "keep current copy"); row 3 keeps its
 *  trailing period — spec R6 pin. */
const BENEFITS: Benefit[] = [
  { icon: 'check_circle', text: 'Empieza gratis y crece a tu ritmo' },
  { icon: 'cloud_done', text: 'Tus datos, desde cualquier dispositivo' },
  { icon: 'verified', text: 'Una experiencia simple para empezar.' },
];

/** Checklist — benefit rows that carry meaning, so NOT aria-hidden. */
export default function Checklist() {
  return (
    <ul className={styles.checklist}>
      {BENEFITS.map((benefit) => (
        <li key={benefit.icon} className={styles.checklistRow}>
          <span className={styles.checkIcon} aria-hidden="true">
            <span className="material-symbols-rounded">{benefit.icon}</span>
          </span>
          {benefit.text}
        </li>
      ))}
    </ul>
  );
}
