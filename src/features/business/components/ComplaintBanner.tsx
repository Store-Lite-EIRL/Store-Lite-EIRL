'use client';

import { Icon } from '@/shared/components/ui/data-display';
import styles from './ComplaintBanner.module.css';

interface ComplaintBannerProps {
  verifiedComplaints30d: number;
  deactivationRisk: 'none' | 'verified_complaints' | 'incomplete_orders';
  businessName: string;
}

export default function ComplaintBanner({
  verifiedComplaints30d,
  deactivationRisk,
  businessName,
}: ComplaintBannerProps) {
  const shouldShow = verifiedComplaints30d >= 2 || deactivationRisk !== 'none';

  if (!shouldShow) {
    return null;
  }

  const complaintText =
    verifiedComplaints30d === 1
      ? `Este negocio tiene 1 denuncia verificada en los últimos 30 días`
      : `Este negocio tiene ${verifiedComplaints30d} denuncias verificadas en los últimos 30 días`;

  return (
    <div data-testid="complaint-banner" className={styles.banner} role="alert" aria-live="polite">
      <Icon size={20}>warning</Icon>
      <span>{complaintText}</span>
    </div>
  );
}
