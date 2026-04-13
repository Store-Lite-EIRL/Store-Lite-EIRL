import type { BusinessEntitlements } from '@/core/entitlements/plans';
import styles from './DashboardHeader.module.css';

const PLAN_LABELS: Record<string, string> = {
  emprendedor: 'Emprendedor',
  business_pro: 'Business Pro',
  enterprise_ai: 'Enterprise AI',
  basico: 'Básico',
};

const PLAN_COLORS: Record<string, string> = {
  emprendedor: 'var(--md-sys-color-primary)',
  business_pro: '#7c3aed',
  enterprise_ai: '#0891b2',
  basico: 'var(--md-sys-color-outline)',
};

interface DashboardHeaderProps {
  businessName: string;
  logoUrl: string | null;
  entitlements: BusinessEntitlements;
  /** ISO date string — si hay vencimiento próximo */
  planEndDate?: string | null;
}

export function DashboardHeader({
  businessName,
  logoUrl,
  entitlements,
  planEndDate,
}: DashboardHeaderProps) {
  const planLabel = PLAN_LABELS[entitlements.plan] ?? entitlements.plan;
  const planColor = PLAN_COLORS[entitlements.plan] ?? 'var(--md-sys-color-outline)';

  const daysUntilExpiry = planEndDate
    ? /* eslint-disable-next-line */
      Math.ceil((new Date(planEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const showExpiryWarning =
    daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  const initials = businessName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <div className={styles.logoWrap}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className={styles.logo} />
          ) : (
            <div className={styles.logoFallback}>{initials}</div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.businessName}>{businessName}</h1>
          <div className={styles.meta}>
            <span
              className={styles.planBadge}
              style={{ '--plan-color': planColor } as React.CSSProperties}
            >
              {planLabel}
            </span>
            {entitlements.isActive ? (
              <span className={styles.statusActive}>Activo</span>
            ) : (
              <span className={styles.statusInactive}>Inactivo</span>
            )}
          </div>
        </div>
      </div>

      {showExpiryWarning && (
        <div className={styles.expiryWarning}>
          <span className={styles.expiryIcon}>⚠️</span>
          <span className={styles.expiryText}>
            {daysUntilExpiry === 0
              ? 'Tu plan vence hoy'
              : `Tu plan vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}`}
          </span>
        </div>
      )}
    </header>
  );
}
