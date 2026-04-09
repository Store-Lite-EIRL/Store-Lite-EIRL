import styles from './EarningsStats.module.css';

interface EarningItem {
  label: string;
  amount: string;
  percentage: number;
  isPositive: boolean;
  color: 'blue' | 'green' | 'purple';
}

interface EarningsStatsProps {
  data: {
    daily: EarningItem;
    weekly: EarningItem;
    monthly: EarningItem;
  };
}

export function EarningsStats({ data }: EarningsStatsProps) {
  const items = [
    { ...data.daily, key: 'daily', title: 'Ganancias Hoy' },
    { ...data.weekly, key: 'weekly', title: 'Esta Semana' },
    { ...data.monthly, key: 'monthly', title: 'Este Mes' },
  ];

  return (
    <section className={styles.container}>
      {items.map((item) => (
        <div key={item.key} className={`${styles.card} ${styles[item.color]}`}>
          <div className={styles.content}>
            <span className={styles.title}>{item.title}</span>
            <div className={styles.row}>
              <span className={styles.amount}>{item.amount}</span>
              <div className={`${styles.trend} ${item.isPositive ? styles.up : styles.down}`}>
                {item.isPositive ? '↑' : '↓'} {item.percentage}%
              </div>
            </div>
          </div>
          <div className={styles.decoration} />
        </div>
      ))}
    </section>
  );
}
