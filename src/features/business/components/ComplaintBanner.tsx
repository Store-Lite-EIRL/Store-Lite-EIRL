'use client';

import { Icon } from '@/shared/components/ui/data-display';
import styles from './ComplaintBanner.module.css';

interface ComplaintBannerProps {
  verifiedComplaints30d: number;
  deactivationRisk: 'none' | 'verified_complaints' | 'incomplete_orders';
  businessName: string;
  /** Incomplete order rate as percentage * 100 (6000 = 60.00%). DS 011 risk signal. */
  incompleteRate30d?: number;
}

export default function ComplaintBanner({
  verifiedComplaints30d,
  deactivationRisk,
  businessName,
  incompleteRate30d,
}: ComplaintBannerProps) {
  const shouldShow = verifiedComplaints30d >= 2 || deactivationRisk !== 'none';

  if (!shouldShow) {
    return null;
  }

  // DS 011 §3: the banner is defined for "Denuncias verificadas >0 en 30d".
  // When the risk is a high incomplete-order rate with NO verified complaints,
  // show the actual risk (order completion) instead of "0 denuncias verificadas".
  const showIncompleteOrdersMessage =
    verifiedComplaints30d === 0 && deactivationRisk === 'incomplete_orders';

  const complaintText =
    verifiedComplaints30d === 1
      ? `Este negocio tiene 1 denuncia verificada en los últimos 30 días`
      : `Este negocio tiene ${verifiedComplaints30d} denuncias verificadas en los últimos 30 días`;

  const incompleteOrdersText =
    typeof incompleteRate30d === 'number' && incompleteRate30d > 0
      ? `Pedidos incompletos este mes (${Math.round(incompleteRate30d / 100)}%)`
      : 'Pedidos incompletos este mes';

  return (
    <div data-testid="complaint-banner" className={styles.banner} role="alert" aria-live="polite">
      <Icon size={20}>warning</Icon>
      <span>{showIncompleteOrdersMessage ? incompleteOrdersText : complaintText}</span>
    </div>
  );
}
