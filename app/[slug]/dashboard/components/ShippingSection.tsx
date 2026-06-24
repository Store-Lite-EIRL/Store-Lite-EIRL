'use client';

import type { OrderItem } from '@/lib/types/orderStatus';
import { URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Home, MapPin, Store, Truck } from 'lucide-react';
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
>;

interface ShippingSectionProps {
  order: ShippingSectionOrderItem;
}

export default function ShippingSection({ order }: ShippingSectionProps) {
  const type = order.shippingType?.toLowerCase();
  const statusInfo = URBANO_STATUS_MAP[order.status] || { progress: 0 };

  return (
    <section className={styles.infoSection}>
      <h3 className={styles.sectionTitle}>
        <MapPin size={18} /> Ruta de Entrega
      </h3>
      <div className={styles.shippingPathHorizontal}>
        {/* Inicio */}
        <div className={styles.pathItemHorizontal}>
          <div
            className={`${styles.pathIcon} ${statusInfo.progress >= 10 ? styles.pathIconActive : ''}`}
          >
            <Store size={20} />
          </div>
          <div className={styles.pathLabelAlwaysVisible}>Inicio</div>
          <div className={styles.pathTooltip}>
            <p className={styles.pathValue}>Almacén Central (Lima)</p>
          </div>
        </div>

        {type !== 'recojo' && (
          <>
            <div className={styles.pathArrow}>→</div>
            <div className={styles.pathItemHorizontal}>
              <div
                className={`${styles.pathIcon} ${statusInfo.progress >= 40 ? styles.pathIconActive : ''}`}
              >
                <Truck size={20} />
              </div>
              <div className={styles.pathLabelAlwaysVisible}>Agencia</div>
              <div className={styles.pathTooltip}>
                <p className={styles.pathValue}>{order.shippingAgency || 'Distribución local'}</p>
              </div>
            </div>
          </>
        )}

        {type === 'domicilio' && (
          <>
            <div className={styles.pathArrow}>→</div>
            <div className={styles.pathItemHorizontal}>
              <div
                className={`${styles.pathIcon} ${statusInfo.progress >= 80 ? styles.pathIconActive : ''}`}
              >
                <Home size={20} />
              </div>
              <div className={styles.pathLabelAlwaysVisible}>Destino</div>
              <div className={styles.pathTooltip}>
                <p className={styles.pathValue}>
                  {order.shippingDistrict}, {order.shippingProvince}
                </p>
                <p className={styles.pathSubValue}>{order.shippingAddress}</p>
                {order.shippingReference && (
                  <p className={styles.refText}>Ref: {order.shippingReference}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarTrack}>
          <div className={styles.progressBarFill} style={{ width: `${statusInfo.progress}%` }} />
        </div>
        <span className={styles.progressText}>{statusInfo.progress}% completado</span>
      </div>
    </section>
  );
}
