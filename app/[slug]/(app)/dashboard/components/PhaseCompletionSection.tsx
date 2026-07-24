'use client';

import { Icon } from '@/shared';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useMemo } from 'react';
import styles from './PhaseCompletionSection.module.css';

export function formatDate(iso: string): string {
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

export function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getRemainingTimeMessage(deadline: string): {
  message: string;
  isPast: boolean;
} {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;
  if (diff <= 0) {
    return {
      message: 'El comprador tiene plazo vencido — contactalo',
      isPast: true,
    };
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
      <div className={styles.countdownExpired}>
        <AlertCircle size={18} className={styles.countdownExpiredIcon} />
        {message}
      </div>
    );
  }

  return (
    <div className={styles.countdownCard}>
      <Clock size={28} className={styles.countdownIcon} />
      <div className={styles.countdownContent}>
        <p className={styles.countdownTimer}>{message}</p>
        <p className={styles.countdownDeadline}>Fecha límite: {formatDate(deadline)}</p>
      </div>
    </div>
  );
}

interface TimelineItem {
  label: string;
  date: string | null;
  done: boolean;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: 'Tarjeta de Crédito/Débito',
  yape: 'Yape',
  plin: 'Plin',
};

function getDurationDays(from: string, to: string): number {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const diffMs = toMs - fromMs;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(days, 0);
}

function getTimelineItems(
  shippingType: string | null,
  createdAt: string,
  completedAt: string | null,
): TimelineItem[] {
  const isDelivery = shippingType !== 'recojo';

  if (isDelivery) {
    return [
      { label: 'Creado', date: createdAt, done: true },
      { label: 'Pagado', date: null, done: true },
      { label: 'Validado', date: null, done: true },
      { label: 'En Reparto', date: null, done: true },
      { label: 'Entregado', date: null, done: true },
      { label: 'Completado', date: completedAt, done: !!completedAt },
    ];
  }

  return [
    { label: 'Creado', date: createdAt, done: true },
    { label: 'Pagado', date: null, done: true },
    { label: 'Recojo', date: null, done: true },
    { label: 'Completado', date: completedAt, done: !!completedAt },
  ];
}

function CompletedOrderSummary({
  completedAt,
  createdAt,
  orderNumber,
  productTitle,
  amount,
  currency,
  paymentMethod,
  shippingType,
  maskedDni,
}: {
  completedAt: string | null;
  createdAt: string;
  orderNumber: string | null;
  productTitle: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  shippingType: string | null;
  maskedDni: string;
}) {
  const duration = completedAt ? getDurationDays(createdAt, completedAt) : 0;
  const timelineItems = getTimelineItems(shippingType, createdAt, completedAt);

  return (
    <>
      <div className={styles.completedCard}>
        {/* Header */}
        <div className={styles.completedHeader}>
          <div className={styles.completedSeal}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.completedHeaderText}>
            <span className={styles.completedTitle}>¡Pedido Finalizado!</span>
            {orderNumber && <span className={styles.completedOrderNo}>N° {orderNumber}</span>}
          </div>
          {completedAt && (
            <span className={styles.completedDuration}>
              {duration} día{duration !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Timeline — hero section */}
        <div className={styles.heroTimeline}>
          {timelineItems.map((item, i) => (
            <div key={i} className={styles.heroTimelineRow}>
              <div
                className={`${styles.heroTimelineDot} ${
                  item.done ? styles.heroTimelineDotDone : styles.heroTimelineDotMuted
                }`}
              >
                {item.done && <CheckCircle size={14} />}
              </div>
              <span className={styles.heroTimelineLabel}>{item.label}</span>
              <span className={styles.heroTimelineSpacer} />
              <span className={styles.heroTimelineDate}>
                {item.date
                  ? item.label === 'Creado' || item.label === 'Completado'
                    ? formatDateTime(item.date)
                    : formatDateShort(item.date)
                  : '✓'}
              </span>
            </div>
          ))}
        </div>

        {/* Order summary — compact */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Producto</span>
            <span className={styles.summaryValue}>{productTitle}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Monto</span>
            <span className={styles.summaryValue}>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency,
              }).format(Number(amount))}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pago</span>
            <span className={styles.summaryValue}>
              {PAYMENT_METHOD_MAP[paymentMethod] || paymentMethod}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Comprador</span>
            <span className={styles.summaryValue}>{maskedDni}</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface PhaseCompletionSectionOrderItem {
  status: string;
  finalizationDeadline: string | null;
  completedAt: string | null;
  createdAt: string;
  orderNumber: string | null;
  productTitle: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  shippingType: string | null;
  maskedDni: string;
}

interface PhaseCompletionSectionProps {
  order: PhaseCompletionSectionOrderItem;
}

export default function PhaseCompletionSection({ order }: PhaseCompletionSectionProps) {
  const status = String(order.status);

  return (
    <>
      <section className={styles.infoSection}>
        {(status === 'esperando_confirmacion' || status === 'DELIVERED') &&
        order.finalizationDeadline ? (
          <Phase3Countdown deadline={order.finalizationDeadline} />
        ) : status === 'completed' || status === 'finalizado' || status === 'COMPLETED' ? (
          <CompletedOrderSummary
            completedAt={order.completedAt}
            createdAt={order.createdAt}
            orderNumber={order.orderNumber}
            productTitle={order.productTitle}
            amount={order.amount}
            currency={order.currency}
            paymentMethod={order.paymentMethod}
            shippingType={order.shippingType}
            maskedDni={order.maskedDni}
          />
        ) : (
          <div className={styles.fallbackContainer}>
            <Icon size={24}>lock</Icon>
            <p>Esta sección estará disponible cuando el pedido esté finalizado.</p>
          </div>
        )}
      </section>
    </>
  );
}
