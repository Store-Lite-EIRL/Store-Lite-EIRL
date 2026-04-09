import styles from './MarketInsights.module.css';

interface InsightItem {
  name: string;
  count: number;
  progress: number; // 0 to 100
}

interface TrendDay {
  day: string;
  intensity: number; // 0 to 100
}

interface MarketInsightsProps {
  topProducts: InsightItem[];
  topCategories: InsightItem[];
  bestDays: TrendDay[];
}

export function MarketInsights({ topProducts, topCategories, bestDays }: MarketInsightsProps) {
  return (
    <section className={styles.insightsGrid}>
      {/* ─── Column: Top Products ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Productos más comprados</h3>
          <span className={styles.cardSub}>Basado en frecuencia</span>
        </div>
        <ul className={styles.list}>
          {topProducts.map((p, _index) => (
            <li key={p.name} className={styles.listItem}>
              <div className={styles.itemInfo}>
                <span className={styles.rank}>#{_index + 1}</span>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.count}>{p.count} vtas</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${p.progress}%` }} 
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      {/* ─── Column: Top Categories ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Categorías populares</h3>
          <span className={styles.cardSub}>Volumen de ventas</span>
        </div>
        <ul className={styles.list}>
          {topCategories.map((c, _index) => (
            <li key={c.name} className={styles.listItem}>
              <div className={styles.itemInfo}>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.count}>{c.count} vtas</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${c.progress}%`, backgroundColor: 'var(--md-sys-color-secondary)' }} 
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      {/* ─── Column: Best Days (Tendencias) ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Días con más ventas</h3>
          <span className={styles.cardSub}>Actividad semanal</span>
        </div>
        <div className={styles.trendsRow}>
          {bestDays.map((d) => (
            <div key={d.day} className={styles.trendItem}>
              <div className={styles.barStack}>
                <div 
                  className={styles.barFill} 
                  style={{ height: `${d.intensity}%` }} 
                />
              </div>
              <span className={styles.dayLabel}>{d.day}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
