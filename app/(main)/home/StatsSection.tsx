import styles from './StatsSection.module.css';

const STATS = [
  { value: '50+', label: 'Tiendas activas' },
  { value: '2K+', label: 'Productos publicados' },
  { value: '99%', label: 'Uptime' },
  { value: '24h', label: 'Soporte' },
] as const;

export default function StatsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2>
            <span className="material-symbols-rounded" aria-hidden="true">
              trending_up
            </span>
            Lo que va generando
          </h2>
          <p>Acabamos de arrancar y ya tenemos tracción. Estos son los números actuales.</p>
        </div>

        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <div className={styles.statNumber}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.statsNote}>
          <span className="material-symbols-rounded">trending_up</span>
          <span>Nuevas tiendas cada semana · seguimos creciendo</span>
        </div>
      </div>
    </section>
  );
}
