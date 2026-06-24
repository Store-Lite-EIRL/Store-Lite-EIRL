'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { AlertCircle, CheckCircle, RefreshCw, Truck } from 'lucide-react';
import styles from './PhaseShippingSection.module.css';
import ShippingSection from './ShippingSection';

const PHASE_GUIDANCE: Record<number, string> = {
  2: 'Seguí el estado del envío. Una vez que el comprador confirme la recepción, el pedido se finalizará automáticamente.',
};

function GuidanceBanner({ phase }: { phase: number }) {
  const text = PHASE_GUIDANCE[phase];
  if (!text) return null;
  return (
    <div className={styles.guidanceBanner}>
      <AlertCircle size={16} className={styles.guidanceIcon} />
      <p className={styles.guidanceText}>{text}</p>
    </div>
  );
}

interface PhaseShippingSectionOrderItem {
  id: string;
  status: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  pickupCode?: string | null;
  shippingType: string | null;
  shippingAgency: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  shippingAddress: string | null;
  shippingReference: string | null;
}

interface PhaseShippingSectionProps {
  order: PhaseShippingSectionOrderItem;
  onNotifyDelivery: () => void;
  onFinalizeOrder: () => void;
  notifyingDelivery: boolean;
  finalizingOrder: boolean;
}

export default function PhaseShippingSection({
  order,
  onNotifyDelivery,
  onFinalizeOrder,
  notifyingDelivery,
  finalizingOrder,
}: PhaseShippingSectionProps) {
  const status = String(order.status);
  const showNotifyDelivery =
    status === 'READY_TO_SHIP' || status === 'delivered' || status === 'aceptado';
  const showNotifyArrival = status === 'IN_TRANSIT' || status === 'en_reparto';

  return (
    <>
      <GuidanceBanner phase={2} />
      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <Truck size={18} /> Seguimiento de Envío
        </h3>
        <ShippingSection order={order} />
        {(order.courierName || order.trackingNumber) && (
          <div className={styles.courierInfoWrapper}>
            {order.courierName && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Courier:</span>
                <span>{order.courierName}</span>
              </div>
            )}
            {order.trackingNumber && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tracking:</span>
                <span>{order.trackingNumber}</span>
              </div>
            )}
            {order.pickupCode && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Código recojo:</span>
                <span>{order.pickupCode}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {showNotifyDelivery && (
        <div className={`${styles.ticketActionsCentered} ${styles.notifyButtonWrapper}`}>
          <Button variant="filled" onClick={onNotifyDelivery} disabled={notifyingDelivery}>
            <span className={styles.notifyButtonInner}>
              {notifyingDelivery ? <RefreshCw size={18} /> : <Truck size={18} />}
              {notifyingDelivery ? 'Notificando...' : 'Notificar Entrega'}
            </span>
          </Button>
        </div>
      )}

      {showNotifyArrival && (
        <div className={`${styles.ticketActionsCentered} ${styles.notifyButtonWrapper}`}>
          <Button variant="filled" onClick={onFinalizeOrder} disabled={finalizingOrder}>
            <span className={styles.notifyButtonInner}>
              {finalizingOrder ? <RefreshCw size={18} /> : <CheckCircle size={18} />}
              {finalizingOrder ? 'Notificando...' : 'Notificar Llegada'}
            </span>
          </Button>
        </div>
      )}
    </>
  );
}
