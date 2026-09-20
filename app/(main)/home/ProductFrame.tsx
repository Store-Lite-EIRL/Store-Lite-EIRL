import styles from './ProductFrame.module.css';

const SIDE_ICONS = ['dashboard', 'inventory_2', 'receipt_long', 'chat', 'settings'] as const;

const METRICS = [
  { value: 'S/ 1,240', label: 'Ventas hoy' },
  { value: '36', label: 'Pedidos nuevos' },
  { value: '128', label: 'Visitas hoy' },
] as const;

const CHART_BARS = [35, 55, 85, 48, 64, 92, 40] as const;
const HI_BAR_INDEXES: ReadonlySet<number> = new Set([2, 5]);

const ORDERS = [
  'Pedido #1042 · Ana R.',
  'Pedido #1041 · Carlos M.',
  'Pedido #1040 · Lucía P.',
] as const;

export default function ProductFrame() {
  return (
    <div className={styles.productFrame}>
      <div className={styles.topbar}>
        <div className={styles.dots} data-testid="topbar-dots" aria-hidden="true">
          <span className={styles.dot} data-testid="topbar-dot" />
          <span className={styles.dot} data-testid="topbar-dot" />
          <span className={styles.dot} data-testid="topbar-dot" />
        </div>
        <div className={styles.title}>Panel de mi tienda</div>
        <span className="material-symbols-rounded" aria-hidden="true">
          more_horiz
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.side}>
          {SIDE_ICONS.map((icon, index) => (
            <div
              key={icon}
              className={index === 0 ? `${styles.iconWrap} ${styles.iconActive}` : styles.iconWrap}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                {icon}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.main}>
          <div className={styles.cards}>
            {METRICS.map((metric) => (
              <div className={styles.card} key={metric.label}>
                <div className={styles.cardNumber}>{metric.value}</div>
                <div className={styles.cardLabel}>{metric.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.chart} data-testid="chart" aria-hidden="true">
            {CHART_BARS.map((height, index) => (
              <div
                key={index}
                data-testid="chart-bar"
                className={HI_BAR_INDEXES.has(index) ? `${styles.bar} ${styles.barHi}` : styles.bar}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className={styles.list}>
            {ORDERS.map((order) => (
              <div className={styles.row} key={order}>
                <span>{order}</span>
                <span className={styles.status}>Pagado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
