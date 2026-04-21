import type { BusinessEntitlements } from '@/core/entitlements/plans';
import Link from 'next/link';
import styles from './PlanStatusBar.module.css';

interface PlanStatusBarProps {
  entitlements: BusinessEntitlements;
  currentProducts: number;
  currentCategories: number;
  planStartDate?: string | null;
  planEndDate?: string | null;
  lastUpdatedAt?: string | null;
}

export function PlanStatusBar({
  entitlements,
  currentProducts,
  currentCategories,
  planStartDate,
  planEndDate,
  lastUpdatedAt,
}: PlanStatusBarProps) {
  const maxProducts = entitlements.maxProducts;
  const maxCategories = entitlements.maxCategories;

  const productUsage = maxProducts > 0 ? Math.min((currentProducts / maxProducts) * 100, 100) : 0;
  const categoryUsage = maxCategories > 0 ? Math.min((currentCategories / maxCategories) * 100, 100) : 0;

  const showUpgrade = entitlements.plan !== 'enterprise_ai';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentDate = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.usageInfo}>
          <div className={styles.usageItem}>
            <span className={styles.label}>Productos:</span>
            <span className={styles.value}>
              {currentProducts} / {maxProducts === -1 ? 30 : maxProducts}
            </span>
            {maxProducts > 0 && (
              <div className={styles.miniBar}>
                <div className={styles.fill} style={{ width: `${productUsage}%` }} />
              </div>
            )}
          </div>
          <div className={styles.usageItem}>
            <span className={styles.label}>Categorías:</span>
            <span className={styles.value}>
              {currentCategories} / {maxCategories === 1 ? 30 : maxCategories}
            </span>
            {maxCategories > 0 && (
              <div className={styles.miniBar}>
                <div className={styles.fill} style={{ width: `${categoryUsage}%` }} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.metaRow}>
          {(planStartDate || planEndDate) && (
            <div className={styles.planDates}>
              {planStartDate && (
                <span className={styles.dateLabel}>
                  Inicio: <span className={styles.dateValue}>{formatDate(planStartDate)}</span>
                </span>
              )}
              {planEndDate && (
                <span className={styles.dateLabel}>
                  Vence: <span className={styles.dateValue}>{formatDate(planEndDate)}</span>
                </span>
              )}
            </div>
          )}

          <div className={styles.timeInfo}>
            <span className={styles.dateLabel}>
              Hoy: <span className={styles.dateValue}>{currentDate}</span>
            </span>
            {lastUpdatedAt && (
              <span className={styles.dateLabel}>
                Sincronizado: <span className={styles.dateValue}>{formatTime(lastUpdatedAt)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {showUpgrade && (
        <Link href="/pricing" className={styles.upgradeLink}>
          Mejorar plan <span className={styles.arrow}>→</span>
        </Link>
      )}
    </div>
  );
}
