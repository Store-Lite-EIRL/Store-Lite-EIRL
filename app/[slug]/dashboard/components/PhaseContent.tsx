'use client';

import { Icon } from '@/shared';
import { Button } from '@/shared/components/ui/buttons/Button';
import { getBusinessPath } from '@/shared/utils/url';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  IdCard,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import phaseStyles from './PhaseContent.module.css';
import styles from './RecentOrders.module.css';
import ShippingSection from './ShippingSection';
import TicketSection from './TicketSection';

interface PhaseOrderItem {
  id: string;
  status: string;
  orderNumber: string | null;
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
  ticketImageUrl: string | null;
  finalizationDeadline: string | null;
  completedAt: string | null;
  createdAt: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  pickupCode?: string | null;
  trackingToken?: string | null;
  sellerNote?: string | null;
}

interface PhaseContentProps {
  order: PhaseOrderItem;
  selectedPhase: number;
  businessSlug: string;
  onNotifyDelivery: () => void;
  onFinalizeOrder: () => void;
  notifyingDelivery: boolean;
  finalizingOrder: boolean;
  ticketFile: File | null;
  ticketPreview: string | null;
  uploading: boolean;
  uploadResult: any;
  isEditingTicket: boolean;
  onTicketFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadTicket: () => void;
  onCancelUpload: () => void;
  onEditTicket: () => void;
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
  1: 'Subí una foto clara del comprobante/ticket de envío para que el comprador pueda validar y aceptar el envío.',
  2: 'Seguí el estado del envío. Una vez que el comprador confirme la recepción, el pedido se finalizará automáticamente.',
  3: 'El pedido está en su fase final. Revisá los detalles de finalización y el resumen del timeline.',
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getRemainingTimeMessage(deadline: string): { message: string; isPast: boolean } {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;
  if (diff <= 0) {
    return { message: 'El comprador tiene plazo vencido — contactalo', isPast: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return {
    message: `Tiempo restante: ${days} día${days !== 1 ? 's' : ''}, ${hours} hora${hours !== 1 ? 's' : ''}`,
    isPast: false,
  };
}

function Phase3Countdown({ deadline }: { deadline: string }) {
  const { message, isPast } = useMemo(() => getRemainingTimeMessage(deadline), [deadline]);

  if (isPast) {
    return (
      <div className={phaseStyles.countdownExpired}>
        <AlertCircle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        {message}
      </div>
    );
  }

  return (
    <div className={phaseStyles.countdownCard}>
      <Clock size={28} className={phaseStyles.countdownIcon} />
      <div className={phaseStyles.countdownContent}>
        <p className={phaseStyles.countdownTimer}>{message}</p>
        <p className={phaseStyles.countdownDeadline}>Fecha límite: {formatDate(deadline)}</p>
      </div>
    </div>
  );
}

function Phase3Completed({
  completedAt,
  createdAt,
}: {
  completedAt: string | null;
  createdAt: string;
}) {
  const timelineItems = [
    { label: 'Creado', date: createdAt, done: true },
    { label: 'Completado', date: completedAt, done: !!completedAt },
  ];

  return (
    <>
      <div className={styles.permanentSeal}>
        <div className={styles.sealIconWrapper}>
          <CheckCircle size={20} />
        </div>
        <div className={styles.sealText}>
          <strong>Pedido Finalizado</strong>
          <span>Esta operación ha sido completada exitosamente.</span>
          {completedAt && (
            <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
              {formatDate(completedAt)}
            </span>
          )}
        </div>
      </div>
      <div className={phaseStyles.timelineContainer}>
        {timelineItems.map((item, i) => (
          <div key={i} className={phaseStyles.timelineItem}>
            <div
              className={`${phaseStyles.timelineDot} ${
                item.done ? phaseStyles.timelineDotCompleted : phaseStyles.timelineDotMuted
              }`}
            />
            <div className={phaseStyles.timelineContent}>
              <span className={phaseStyles.timelineLabel}>{item.label}</span>
              {item.date && (
                <span className={phaseStyles.timelineDate}>{formatDate(item.date)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function PhaseContent({
  order,
  selectedPhase,
  businessSlug,
  onNotifyDelivery,
  onFinalizeOrder,
  notifyingDelivery,
  finalizingOrder,
  ticketFile,
  ticketPreview,
  uploading,
  uploadResult,
  isEditingTicket,
  onTicketFileSelect,
  onUploadTicket,
  onCancelUpload,
  onEditTicket,
}: PhaseContentProps) {
  return (
    <div className={styles.modalBodyNew}>
      {selectedPhase === 0 && (
        <>
          <GuidanceBanner phase={0} />
          {/* PEDIDO: Comprador y Producto + Pago */}
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
                    <p className={styles.customerEmail}>{order.buyerEmail || 'No registrado'}</p>
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
                      <span className={styles.metaLabel}>ID:</span> {order.productId?.slice(0, 10)}
                      ...
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
                    <span className={phaseStyles.shippingValue}>{order.shippingAddress}</span>
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
                    {[order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ') ||
                      'No especificado'}
                    {order.shippingDepartment ? `, ${order.shippingDepartment}` : ''}
                  </span>
                </div>
              </div>
              {order.shippingType?.toLowerCase() === 'agencia' && order.shippingAgency && (
                <div className={phaseStyles.shippingRow}>
                  <MapPin size={16} className={phaseStyles.shippingIcon} />
                  <div>
                    <span className={phaseStyles.shippingLabel}>Agencia</span>
                    <span className={phaseStyles.shippingValue}>{order.shippingAgency}</span>
                  </div>
                </div>
              )}
              {order.shippingPhone && (
                <div className={phaseStyles.shippingRow}>
                  <Phone size={16} className={phaseStyles.shippingIcon} />
                  <div>
                    <span className={phaseStyles.shippingLabel}>Teléfono de contacto</span>
                    <span className={phaseStyles.shippingValue}>{order.shippingPhone}</span>
                  </div>
                </div>
              )}
              {order.shippingReference && (
                <div className={phaseStyles.shippingRow}>
                  <MapPin size={16} className={phaseStyles.shippingIcon} />
                  <div>
                    <span className={phaseStyles.shippingLabel}>Referencia</span>
                    <span className={phaseStyles.shippingValue}>{order.shippingReference}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {selectedPhase === 1 && (
        <>
          <GuidanceBanner phase={1} />
          <section className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <Receipt size={18} /> Validación de Ticket
            </h3>
            <TicketSection
              order={order}
              ticketFile={ticketFile}
              ticketPreview={ticketPreview}
              uploading={uploading}
              uploadResult={uploadResult}
              isEditingTicket={isEditingTicket}
              onFileSelect={onTicketFileSelect}
              onUpload={onUploadTicket}
              onCancel={onCancelUpload}
              onEdit={onEditTicket}
            />
          </section>
        </>
      )}

      {selectedPhase === 2 && (
        <>
          <GuidanceBanner phase={2} />
          <section className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <Truck size={18} /> Seguimiento de Envío
            </h3>
            <ShippingSection order={order} />
            {(order.courierName || order.trackingNumber) && (
              <div style={{ padding: '0 1rem 1rem' }}>
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

          {(String(order.status) === 'READY_TO_SHIP' ||
            String(order.status) === 'delivered' ||
            String(order.status) === 'aceptado') && (
            <div className={styles.ticketActionsCentered} style={{ margin: '0 1rem 1rem' }}>
              <Button variant="filled" onClick={onNotifyDelivery} disabled={notifyingDelivery}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {notifyingDelivery ? <RefreshCw size={18} /> : <Truck size={18} />}
                  {notifyingDelivery ? 'Notificando...' : 'Notificar Entrega'}
                </span>
              </Button>
            </div>
          )}

          {(String(order.status) === 'IN_TRANSIT' || String(order.status) === 'en_reparto') && (
            <div className={styles.ticketActionsCentered} style={{ margin: '0 1rem 1rem' }}>
              <Button variant="filled" onClick={onFinalizeOrder} disabled={finalizingOrder}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {finalizingOrder ? <RefreshCw size={18} /> : <CheckCircle size={18} />}
                  {finalizingOrder ? 'Notificando...' : 'Notificar Llegada'}
                </span>
              </Button>
            </div>
          )}
        </>
      )}

      {selectedPhase === 3 && (
        <>
          <GuidanceBanner phase={3} />
          <section className={styles.infoSection}>
            {(order.status === 'esperando_confirmacion' || String(order.status) === 'DELIVERED') &&
            order.finalizationDeadline ? (
              <Phase3Countdown deadline={order.finalizationDeadline} />
            ) : order.status === 'completed' ||
              order.status === 'finalizado' ||
              String(order.status) === 'COMPLETED' ? (
              <Phase3Completed completedAt={order.completedAt} createdAt={order.createdAt} />
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>
                <Icon size={24}>lock</Icon>
                <p>Esta sección estará disponible cuando el pedido esté finalizado.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
