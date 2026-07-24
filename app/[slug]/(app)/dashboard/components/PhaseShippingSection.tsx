'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { CheckCircle, RefreshCw, Store, Truck } from 'lucide-react';
import styles from './PhaseShippingSection.module.css';
import ShippingSection from './ShippingSection';

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
  shippingPhone: string | null;
}

interface PhaseShippingSectionProps {
  order: PhaseShippingSectionOrderItem;
  onNotifyDelivery: () => void;
  onFinalizeOrder: () => void;
  notifyingDelivery: boolean;
  finalizingOrder: boolean;
  onMarkReadyForPickup?: () => void;
  onConfirmPickedUp?: () => void;
  markingReady?: boolean;
  confirmingPickup?: boolean;
  pickupCodeInput?: string;
  onPickupCodeChange?: (value: string) => void;
  codeError?: string | null;
}

export default function PhaseShippingSection({
  order,
  onNotifyDelivery,
  onFinalizeOrder,
  notifyingDelivery,
  finalizingOrder,
  onMarkReadyForPickup,
  onConfirmPickedUp,
  markingReady,
  confirmingPickup,
  pickupCodeInput,
  onPickupCodeChange,
  codeError,
}: PhaseShippingSectionProps) {
  const status = String(order.status);
  const isPickup = order.shippingType?.toLowerCase() === 'recojo';
  const showNotifyDelivery =
    !isPickup && (status === 'READY_TO_SHIP' || status === 'delivered' || status === 'aceptado');
  const showNotifyArrival = status === 'IN_TRANSIT' || status === 'en_reparto';
  const showMarkReadyForPickup =
    isPickup && (status === 'PREPARING_ORDER' || status === 'paid' || status === 'PAID');

  return (
    <>
      <ShippingSection
        order={order}
        pickupCodeInput={pickupCodeInput}
        onPickupCodeChange={onPickupCodeChange}
        codeError={codeError}
        onMarkReadyForPickup={onMarkReadyForPickup}
        onConfirmPickedUp={onConfirmPickedUp}
        markingReady={markingReady}
        confirmingPickup={confirmingPickup}
      />

      {showNotifyDelivery && (
        <div className={styles.actionsWrapper}>
          <Button variant="filled" onClick={onNotifyDelivery} disabled={notifyingDelivery}>
            <span className={styles.buttonInner}>
              {notifyingDelivery ? <RefreshCw size={18} /> : <Truck size={18} />}
              {notifyingDelivery ? 'Notificando...' : 'Notificar Entrega'}
            </span>
          </Button>
        </div>
      )}

      {showNotifyArrival && (
        <div className={styles.actionsWrapper}>
          <Button variant="filled" onClick={onFinalizeOrder} disabled={finalizingOrder}>
            <span className={styles.buttonInner}>
              {finalizingOrder ? <RefreshCw size={18} /> : <CheckCircle size={18} />}
              {finalizingOrder ? 'Notificando...' : 'Notificar Llegada'}
            </span>
          </Button>
        </div>
      )}

      {showMarkReadyForPickup && (
        <div className={styles.actionsWrapper}>
          <Button variant="filled" onClick={onMarkReadyForPickup} disabled={markingReady}>
            <span className={styles.buttonInner}>
              {markingReady ? <RefreshCw size={18} /> : <Store size={18} />}
              {markingReady ? 'Preparando...' : 'Marcar como listo para recojo'}
            </span>
          </Button>
        </div>
      )}

      {/* Confirm pickup: the input + Verificar button are rendered inside ShippingSection/PickupContent.
          No duplicate button needed here — firing confirmPickedUp without the code value causes a silent no-op. */}
    </>
  );
}
