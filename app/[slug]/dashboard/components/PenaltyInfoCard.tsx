import Link from 'next/link';
import styles from './PenaltyInfoCard.module.css';

interface PenaltyInfoCardProps {
  businessSlug: string;
}

export function PenaltyInfoCard({ businessSlug }: PenaltyInfoCardProps) {
  return (
    <Link href={`/${businessSlug}/dashboard/penalties`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.title}>Multas</span>
      </div>
      <p className={styles.description}>
        Infracciones por incumplimiento en la preparación de pedidos
      </p>
      <div className={styles.footer}>
        <span className={styles.action}>Ver estado</span>
        <span className={styles.arrow}>&rarr;</span>
      </div>
    </Link>
  );
}
