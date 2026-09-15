'use client';

import { Icon } from '@/shared/components/ui/data-display';
import styles from './BusinessBadge.module.css';

interface BusinessBadgeProps {
  kybVerified: boolean;
  trustLevel: 'verified' | 'confiable' | 'new' | 'warning' | 'deactivated';
  verifiedComplaints30d: number;
  incompleteRate30d: number;
}

const TRUST_LEVEL_CONFIG = {
  verified: {
    label: 'Negocio Verificado',
    icon: 'verified',
    baseClass: styles.badgeVerified,
    testId: 'business-badge-verified',
  },
  confiable: {
    label: 'Confiable',
    icon: 'thumb_up',
    baseClass: styles.badgeConfiable,
    testId: 'business-badge-confiable',
  },
  new: {
    label: 'Nuevo',
    icon: 'fiber_new',
    baseClass: styles.badgeNew,
    testId: 'business-badge-new',
  },
  warning: {
    label: 'Advertencia',
    icon: 'warning',
    baseClass: styles.badgeWarning,
    testId: 'business-badge-warning',
  },
  deactivated: {
    label: 'Cuenta Desactivada',
    icon: 'block',
    baseClass: styles.badgeDeactivated,
    testId: 'business-badge-deactivated',
  },
} as const;

export default function BusinessBadge({
  kybVerified,
  trustLevel,
  verifiedComplaints30d,
  incompleteRate30d,
}: BusinessBadgeProps) {
  const config = TRUST_LEVEL_CONFIG[trustLevel];
  const isFullyVerified = kybVerified && trustLevel === 'verified';

  // Determine tooltip text
  const hasComplaintTooltip = verifiedComplaints30d >= 2;
  const tooltipText = hasComplaintTooltip
    ? `${verifiedComplaints30d} ${verifiedComplaints30d === 1 ? 'denuncia verificada' : 'denuncias verificadas'} en los últimos 30 días`
    : undefined;

  return (
    <span
      className={`${styles.badge} ${config.baseClass} ${isFullyVerified ? styles.badgeVerifiedFull : ''}`}
      data-testid={config.testId}
      title={tooltipText}
    >
      <Icon size={14}>{config.icon}</Icon>
      <span>{config.label}</span>
    </span>
  );
}
