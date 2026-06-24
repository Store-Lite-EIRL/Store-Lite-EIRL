'use client';

import { getBusinessPath } from '@/shared/utils/url';
import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  IdCard,
  MapPin,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import phaseStyles from './PhaseContent.module.css';
import styles from './RecentOrders.module.css';

interface PhaseReadySectionOrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string | null;
  amount: string;
  shippingCost: string;
  currency: string;
  paymentMethod: string;
  shippingType: string | null;
  shippingAgency: string | null;
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  shippingDepartment: string | null;
  shippingReference: string | null;
  shippingPhone: string | null;
  buyerEmail: string | null;
  maskedDni: string;
}

interface PhaseReadySectionProps {
  order: PhaseReadySectionOrderItem;
  businessSlug: string;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: 'Tarjeta de Crédito/Débito',
  yape: 'Yape',
  plin: 'Plin',
};

const SHIPPING_TYPE_MAP: Record<string, string> = {
  agencia: 'Agencia',
  domicilio: 'Domicilio',
  recojo: 'Recojo en tienda',
};

const PHASE_GUIDANCE: Record<number, string> = {
  0: 'Revisá los datos del pedido y prepará el producto para el envío. Recordá que el comprador ya pagó el costo de envío que configuraste.',
};

function GuidanceBanner({ phase }: { phase: number }) {
  const text = PHASE_GUIDANCE[phase];
  if (!text) return null;
  return (
    <div className={phaseStyles.guidanceBanner}>
      <AlertCircle size={16} className={phaseStyles.guidanceIcon} />
      <p className={phaseStyles.guidanceText}>{text}</p>
    </div>
  );
}

export default function PhaseReadySection({
  order,
  businessSlug,
}: PhaseReadySectionProps) {
  return (
    <>
      <GuidanceBanner phase={0} />
      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <User size={18} /> Comprador y Producto
        </h3>
        <div className={`${styles.unifiedCard} ${styles.unifiedContent}`}>
          <div className={styles.customerSection}>
            <div className={styles.customerHeader}>
              <div className={styles.customerAvatar}>
                <User size={28} />
              </div>
              <div className={styles.customerBasicInfo}>
                <p className={styles.customerLabel}>Comprador</p>
                <div className={styles.customerDataRow}>
                  <div className={styles.dataItemInline}>
                    <IdCard size={18} />
                    <span>DNI: {order.maskedDni || 'No registrado'}</span>
                  </div>
                  <div className={styles.dataItemInline}>
                    <Phone size={18} />
                    <span>Tel: {order.shippingPhone || 'Sin teléfono'}</span>
                  </div>
                </div>
                <p className={styles.customerEmail}>
                  {order.buyerEmail || 'No registrado'}
                </p>
              </div>
            </div>
          </div>
          <div className={styles.unifiedDivider} />
          <div className={styles.productSection}>
            <div className={styles.productImageWrapper}>
              {order.productImage ? (
                <Image
                  src={order.productImage}
                  alt={order.productTitle}
                  width={100}
                  height={100}
                  className={styles.productImg}
                />
              ) : (
                <div className={styles.productPlaceholder}>
                  <ShoppingBag size={36} />
                </div>
              )}
            </div>
            <div className={styles.productInfo}>
              <Link
                href={getBusinessPath(
                  businessSlug,
                  `/product/${order.productId || order.productSlug}`,
                )}
                target="_blank"
                className={styles.productLink}
              >
                {order.productTitle} <ExternalLink size={14} />
              </Link>
              <div className={styles.productMetaRow}>
                <span className={styles.productMetaItem}>
                  <span className={styles.metaLabel}>ID:</span>{' '}
                  {order.productId?.slice(0, 10)}...
                </span>
              </div>
              <div className={styles.productMetaRow}>
                <span className={styles.productMetaItem}>
                  <span className={styles.metaLabel}>Cant.:</span> 1 unid.
                </span>
                <span className={styles.productMetaItem}>
                  <span className={styles.metaLabel}>Envío:</span>{' '}
                  {new Intl.NumberFormat('es-PE', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(Number(order.shippingCost))}
                </span>
              </div>
              <p className={styles.itemPrice}>
                {new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: order.currency,
                }).format(Number(order.amount) - Number(order.shippingCost))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <CreditCard size={18} /> Pago
        </h3>
        <div className={styles.paymentDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Método:</span>
            <span className={styles.capitalizeText}>
              {PAYMENT_METHOD_MAP[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Subtotal:</span>
            <span>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: order.currency,
              }).format(Number(order.amount) - Number(order.shippingCost))}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Envío:</span>
            <span>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: order.currency,
              }).format(Number(order.shippingCost))}
            </span>
          </div>
          <div className={`${styles.detailRow} ${styles.totalRow}`}>
            <span className={styles.detailLabel}>Total:</span>
            <span className={styles.totalValue}>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: order.currency,
              }).format(Number(order.amount))}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <MapPin size={18} /> Datos del Envío
        </h3>
        <div className={`${styles.unifiedCard} ${phaseStyles.shippingCard}`}>
          <div className={phaseStyles.shippingRow}>
            <MapPin size={16} className={phaseStyles.shippingIcon} />
            <div>
              <span className={phaseStyles.shippingLabel}>Tipo de envío</span>
              <span className={phaseStyles.shippingTypeBadge}>
                {SHIPPING_TYPE_MAP[order.shippingType?.toLowerCase() || ''] ||
                  order.shippingType ||
                  'No especificado'}
              </span>
            </div>
          </div>
          {order.shippingAddress && (
            <div className={phaseStyles.shippingRow}>
              <MapPin size={16} className={phaseStyles.shippingIcon} />
              <div>
                <span className={phaseStyles.shippingLabel}>Dirección</span>
                <span className={phaseStyles.shippingValue}>
                  {order.shippingAddress}
                </span>
              </div>
            </div>
          )}
          <div className={phaseStyles.shippingRow}>
            <MapPin size={16} className={phaseStyles.shippingIcon} />
            <div>
              <span className={phaseStyles.shippingLabel}>
                Distrito / Provincia / Departamento
              </span>
              <span className={phaseStyles.shippingValue}>
                {[order.shippingDistrict, order.shippingProvince]
                  .filter(Boolean)
                  .join(', ') || 'No especificado'}
                {order.shippingDepartment
                  ? `, ${order.shippingDepartment}`
                  : ''}
              </span>
            </div>
          </div>
          {order.shippingType?.toLowerCase() === 'agencia' &&
            order.shippingAgency && (
              <div className={phaseStyles.shippingRow}>
                <MapPin size={16} className={phaseStyles.shippingIcon} />
                <div>
                  <span className={phaseStyles.shippingLabel}>Agencia</span>
                  <span className={phaseStyles.shippingValue}>
                    {order.shippingAgency}
                  </span>
                </div>
              </div>
            )}
          {order.shippingPhone && (
            <div className={phaseStyles.shippingRow}>
              <Phone size={16} className={phaseStyles.shippingIcon} />
              <div>
                <span className={phaseStyles.shippingLabel}>
                  Teléfono de contacto
                </span>
                <span className={phaseStyles.shippingValue}>
                  {order.shippingPhone}
                </span>
              </div>
            </div>
          )}
          {order.shippingReference && (
            <div className={phaseStyles.shippingRow}>
              <MapPin size={16} className={phaseStyles.shippingIcon} />
              <div>
                <span className={phaseStyles.shippingLabel}>Referencia</span>
                <span className={phaseStyles.shippingValue}>
                  {order.shippingReference}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
