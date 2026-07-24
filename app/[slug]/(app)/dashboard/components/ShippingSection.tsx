'use client';

import type { OrderItem } from '@/lib/types/orderStatus';
import { Button } from '@/shared/components/ui/buttons/Button';
import { CheckCircle, Clock, Home, Package, RefreshCw, Store, Truck } from 'lucide-react';
import styles from './ShippingSection.module.css';

type ShippingSectionOrderItem = Pick<
  OrderItem,
  | 'id'
  | 'status'
  | 'shippingType'
  | 'shippingAgency'
  | 'shippingDistrict'
  | 'shippingProvince'
  | 'shippingAddress'
  | 'shippingReference'
  | 'shippingPhone'
> & {
  courierName?: string | null;
  trackingNumber?: string | null;
  pickupCode?: string | null;
};

interface ShippingSectionProps {
  order: ShippingSectionOrderItem;
  onMarkReadyForPickup?: () => void;
  onConfirmPickedUp?: () => void;
  markingReady?: boolean;
  confirmingPickup?: boolean;
  pickupCodeInput?: string;
  onPickupCodeChange?: (value: string) => void;
  codeError?: string | null;
}

const SHIPPING_STATUS_LABEL: Record<string, string> = {
  en_reparto: 'En reparto',
  IN_TRANSIT: 'En tránsito',
  esperando_confirmacion: 'Esperando confirmación',
  DELIVERED: 'Entregado',
  READY_TO_SHIP: 'Listo para enviar',
  READY_FOR_PICKUP: 'Listo para recojo',
  PICKED_UP: 'Recogido',
  delivered: 'Entregado',
  aceptado: 'Aceptado',
};

function StatusTag({ status }: { status: string }) {
  const label = SHIPPING_STATUS_LABEL[status] || status;
  const isActive = status === 'en_reparto' || status === 'IN_TRANSIT';
  const isDone = status === 'DELIVERED' || status === 'esperando_confirmacion';

  return (
    <span
      className={`${styles.statusTag} ${isDone ? styles.statusDone : isActive ? styles.statusActive : styles.statusIdle}`}
    >
      {isDone ? <Truck size={14} /> : <Clock size={14} />}
      {label}
    </span>
  );
}

function PickupContent({
  order,
  status,
  onMarkReadyForPickup,
  onConfirmPickedUp,
  markingReady,
  confirmingPickup,
  pickupCodeInput,
  onPickupCodeChange,
  codeError,
}: {
  order: ShippingSectionOrderItem;
  status: string;
  onMarkReadyForPickup?: () => void;
  onConfirmPickedUp?: () => void;
  markingReady?: boolean;
  confirmingPickup?: boolean;
  pickupCodeInput?: string;
  onPickupCodeChange?: (value: string) => void;
  codeError?: string | null;
}) {
  return (
    <div className={styles.shippingCard}>
      <div className={styles.shippingHeader}>
        <Store size={22} />
        <span className={styles.shippingTypeLabel}>Recojo en Tienda</span>
      </div>
      <p className={styles.shippingDesc}>
        El comprador pasará por tu tienda a recoger el producto.
      </p>

      {/* El código de recojo NO se muestra al seller — solo el cliente lo tiene en su ticket */}
      {order.shippingPhone && (
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Contacto</span>
            <span className={styles.infoValue}>{order.shippingPhone}</span>
          </div>
        </div>
      )}
      <StatusTag status={status} />

      {(status === 'PREPARING_ORDER' || status === 'paid' || status === 'PAID') &&
        onMarkReadyForPickup && (
          <div style={{ marginTop: '1rem' }}>
            <Button variant="filled" onClick={onMarkReadyForPickup} disabled={markingReady}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {markingReady ? <RefreshCw size={18} /> : <Store size={18} />}
                {markingReady ? 'Preparando...' : 'Marcar como listo para recojo'}
              </span>
            </Button>
          </div>
        )}

      {status === 'READY_FOR_PICKUP' && onConfirmPickedUp && (
        <div style={{ marginTop: '1rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              marginBottom: '0.5rem',
            }}
          >
            Pedí al cliente su código de recojo del ticket y verificálo:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="SL-XXXXXXXX-XXXXXXXX"
              maxLength={20}
              value={pickupCodeInput || ''}
              onChange={(e) => onPickupCodeChange?.(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${codeError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline)'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                background: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
              }}
              disabled={confirmingPickup}
            />
            <Button
              variant="filled"
              onClick={onConfirmPickedUp}
              disabled={confirmingPickup || !pickupCodeInput?.trim()}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {confirmingPickup ? <RefreshCw size={18} /> : <CheckCircle size={18} />}
                {confirmingPickup ? 'Verificando...' : 'Verificar'}
              </span>
            </Button>
          </div>
          {codeError && (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--md-sys-color-error)',
              }}
            >
              {codeError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AgencyContent({ order, status }: { order: ShippingSectionOrderItem; status: string }) {
  return (
    <div className={styles.shippingCard}>
      <div className={styles.shippingHeader}>
        <Package size={22} />
        <span className={styles.shippingTypeLabel}>Envío por Agencia</span>
      </div>
      <p className={styles.shippingDesc}>
        Llevá el paquete a la agencia indicada. El comprador recogerá allí.
      </p>
      <div className={styles.infoGrid}>
        {order.shippingAgency && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Agencia</span>
            <span className={styles.infoValue}>{order.shippingAgency}</span>
          </div>
        )}
        {order.trackingNumber && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tracking</span>
            <span className={styles.infoValue}>{order.trackingNumber}</span>
          </div>
        )}
        {order.shippingDistrict && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Destino</span>
            <span className={styles.infoValue}>
              {[order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>
      {order.shippingAddress && (
        <div className={styles.addressBlock}>
          <strong>Dirección de la agencia</strong>
          {order.shippingAddress}
          {order.shippingReference && (
            <span className={styles.addressRef}>Ref: {order.shippingReference}</span>
          )}
        </div>
      )}
      <StatusTag status={status} />
    </div>
  );
}

function DeliveryContent({ order, status }: { order: ShippingSectionOrderItem; status: string }) {
  return (
    <div className={styles.shippingCard}>
      <div className={styles.shippingHeader}>
        <Home size={22} />
        <span className={styles.shippingTypeLabel}>Envío a Domicilio</span>
      </div>
      <p className={styles.shippingDesc}>El paquete va directo al domicilio del comprador.</p>
      <div className={styles.infoGrid}>
        {order.courierName && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Courier</span>
            <span className={styles.infoValue}>{order.courierName}</span>
          </div>
        )}
        {order.trackingNumber && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tracking</span>
            <span className={styles.infoValue}>{order.trackingNumber}</span>
          </div>
        )}
        {order.shippingDistrict && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Distrito</span>
            <span className={styles.infoValue}>
              {[order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>
      {order.shippingAddress && (
        <div className={styles.addressBlock}>
          <strong>Dirección de entrega</strong>
          {order.shippingAddress}
          {order.shippingReference && (
            <span className={styles.addressRef}>Ref: {order.shippingReference}</span>
          )}
        </div>
      )}
      <StatusTag status={status} />
    </div>
  );
}

export default function ShippingSection({
  order,
  onMarkReadyForPickup,
  onConfirmPickedUp,
  markingReady,
  confirmingPickup,
  pickupCodeInput,
  onPickupCodeChange,
  codeError,
}: ShippingSectionProps) {
  const type = order.shippingType?.toLowerCase();
  const status = String(order.status);

  if (type === 'recojo')
    return (
      <PickupContent
        order={order}
        status={status}
        onMarkReadyForPickup={onMarkReadyForPickup}
        onConfirmPickedUp={onConfirmPickedUp}
        markingReady={markingReady}
        confirmingPickup={confirmingPickup}
        pickupCodeInput={pickupCodeInput}
        onPickupCodeChange={onPickupCodeChange}
        codeError={codeError}
      />
    );
  if (type === 'agencia') return <AgencyContent order={order} status={status} />;
  return <DeliveryContent order={order} status={status} />;
}
