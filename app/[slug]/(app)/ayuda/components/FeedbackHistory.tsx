'use client';

// =====================================================
// FeedbackHistory — List of feedback tickets
// =====================================================

import type { FeedbackHistoryItem, FeedbackStatus } from '@/features/feedback/types';
import { Button, Icon } from '@/shared/components/ui';
import { useCallback, useEffect, useState } from 'react';
import styles from '../ayuda.module.css';

interface FeedbackHistoryProps {
  businessId: string;
  onSelectTicket: (ticketId: string) => void;
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const STATUS_CLASSES: Record<FeedbackStatus, string> = {
  open: styles.statusOpen,
  in_progress: styles.statusInProgress,
  resolved: styles.statusResolved,
  closed: styles.statusClosed,
};

const PRIORITY_CLASSES: Record<string, string> = {
  low: styles.priorityLow,
  normal: styles.priorityNormal,
  high: styles.priorityHigh,
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
};

export function FeedbackHistory({ businessId, onSelectTicket }: FeedbackHistoryProps) {
  const [tickets, setTickets] = useState<FeedbackHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getFeedbackHistory } = await import('@/features/feedback/actions');
      const res = await getFeedbackHistory(businessId);
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      } else {
        setError(res.error ?? 'Error al cargar el historial.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Icon size={32} className={styles.emptyStateIcon}>
          sync
        </Icon>
        <p>Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <Icon size={48} className={styles.emptyStateIcon}>
          error
        </Icon>
        <h3 className={styles.emptyStateTitle}>Error al cargar</h3>
        <p className={styles.emptyStateDescription}>{error}</p>
        <Button variant="outlined" onClick={loadTickets}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon size={48} className={styles.emptyStateIcon}>
          feedback
        </Icon>
        <h3 className={styles.emptyStateTitle}>Sin feedback aún</h3>
        <p className={styles.emptyStateDescription}>
          Enviá tu primer feedback o sugerencia usando el formulario.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackHistory}>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className={styles.ticketCard}
          onClick={() => onSelectTicket(ticket.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTicket(ticket.id)}
        >
          <div className={styles.ticketHeader}>
            <div>
              <span className={styles.ticketNumber}>{ticket.ticketNumber}</span>
              <h4 className={styles.ticketSubject}>{ticket.subject}</h4>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <span className={`${styles.priorityBadge} ${PRIORITY_CLASSES[ticket.priority]}`}>
                {PRIORITY_LABELS[ticket.priority]}
              </span>
              <span className={`${styles.statusBadge} ${STATUS_CLASSES[ticket.status]}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
            </div>
          </div>
          <div className={styles.ticketMeta}>
            <span className={styles.ticketDate}>
              <Icon size={14}>schedule</Icon>
              {new Date(ticket.createdAt).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className={styles.ticketResponseCount}>
              <Icon size={14}>chat_bubble_outline</Icon>
              {ticket.responseCount} {ticket.responseCount === 1 ? 'respuesta' : 'respuestas'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
