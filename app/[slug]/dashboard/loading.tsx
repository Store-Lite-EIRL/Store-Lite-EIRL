import { Loader2 } from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardLoading() {
  return (
    <main className={styles.dashboardRoot}>
      <div className={styles.loadingContainer}>
        <Loader2
          size={48}
          className={styles.spinningIcon}
          style={{ color: 'var(--md-sys-color-primary)' }}
        />
        <p className={styles.loadingText}>Cargando pedidos...</p>
      </div>
    </main>
  );
}
