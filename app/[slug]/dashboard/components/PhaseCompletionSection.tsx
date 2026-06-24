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

const PHASE_GUIDANCE: Record<number, string> = {
  3: 'El pedido está en su fase final. Revisá los detalles de finalización y el resumen del timeline.',
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

function Phase3Completed({
  completedAt,
  createdAt,
}: {
  completedAt: string | null;
  createdAt: string;
}) {
  const timelineItems: TimelineItem[] = [
    { label: 'Creado', date: createdAt, done: true },
    { label: 'Pagado', date: null, done: true },
    { label: 'Validado', date: null, done: true },
    { label: 'En Reparto', date: null, done: true },
    { label: 'Entregado', date: null, done: true },
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
          {completedAt && <span className={styles.sealDate}>{formatDate(completedAt)}</span>}
        </div>
      </div>
      <div className={styles.timelineContainer}>
        {timelineItems.map((item, i) => (
          <div key={i} className={styles.timelineItem}>
            <div
              className={`${styles.timelineDot} ${
                item.done ? styles.timelineDotCompleted : styles.timelineDotMuted
              }`}
            />
            <div className={styles.timelineContent}>
              <span className={styles.timelineLabel}>{item.label}</span>
              {item.date && <span className={styles.timelineDate}>{formatDate(item.date)}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

interface PhaseCompletionSectionOrderItem {
  status: string;
  finalizationDeadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface PhaseCompletionSectionProps {
  order: PhaseCompletionSectionOrderItem;
}

export default function PhaseCompletionSection({ order }: PhaseCompletionSectionProps) {
  const status = String(order.status);

  return (
    <>
      <GuidanceBanner phase={3} />
      <section className={styles.infoSection}>
        {(status === 'esperando_confirmacion' || status === 'DELIVERED') &&
        order.finalizationDeadline ? (
          <Phase3Countdown deadline={order.finalizationDeadline} />
        ) : status === 'completed' || status === 'finalizado' || status === 'COMPLETED' ? (
          <Phase3Completed completedAt={order.completedAt} createdAt={order.createdAt} />
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
