'use client';

// =====================================================
// FeedbackTicketDetail — Ticket detail + responses
// =====================================================

import type {
  FeedbackStatus,
  FeedbackTicketWithResponses as TicketDetailType,
} from '@/features/feedback/types';
import { AlertSnackbar, Button, Icon, TextField } from '@/shared/components/ui';
import { useEffect, useState, useTransition } from 'react';
import styles from '../ayuda.module.css';

interface FeedbackTicketDetailProps {
  ticketId: string;
  _businessId: string;
  userRole: 'owner' | 'admin' | 'member';
  onBack: () => void;
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

export function FeedbackTicketDetail({
  ticketId,
  _businessId,
  userRole,
  onBack,
}: FeedbackTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sending, startTransition] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
  }>({ open: false, description: '', color: 'success' });

  const canRespond = userRole === 'owner' || userRole === 'admin';

  const handleCloseTicket = () => {
    startTransition(async () => {
      try {
        const { closeTicket } = await import('@/features/feedback/actions');
        const res = await closeTicket(ticketId);

        if (res.success) {
          setFeedback({
            open: true,
            description: 'Ticket cerrado.',
            color: 'success',
          });
          setReloadKey((k) => k + 1); // Reload to show new status
        } else {
          setFeedback({
            open: true,
            description: res.error ?? 'Error al cerrar.',
            color: 'error',
          });
        }
      } catch {
        setFeedback({
          open: true,
          description: 'Error de conexión.',
          color: 'error',
        });
      }
    });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { getFeedbackTicket } = await import('@/features/feedback/actions');
        const res = await getFeedbackTicket(ticketId);
        if (!active) return;
        if (res.success && res.ticket) {
          setTicket(res.ticket);
        } else {
          setError(res.error ?? 'Error al cargar el ticket.');
        }
      } catch {
        if (active) setError('Error de conexión.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ticketId, reloadKey]);

  const handleRespond = () => {
    if (!responseMessage.trim()) return;

    startTransition(async () => {
      try {
        const { respondToTicket } = await import('@/features/feedback/actions');
        const res = await respondToTicket(ticketId, responseMessage.trim());

        if (res.success) {
          setFeedback({
            open: true,
            description: 'Respuesta enviada.',
            color: 'success',
          });
          setResponseMessage('');
          setReloadKey((k) => k + 1); // Reload to show new response
        } else {
          setFeedback({
            open: true,
            description: res.error ?? 'Error al enviar.',
            color: 'error',
          });
        }
      } catch {
        setFeedback({
          open: true,
          description: 'Error de conexión.',
          color: 'error',
        });
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Icon size={32} className={styles.emptyStateIcon}>
          sync
        </Icon>
        <p>Cargando ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className={styles.emptyState}>
        <Icon size={48} className={styles.emptyStateIcon}>
          error
        </Icon>
        <h3 className={styles.emptyStateTitle}>Error al cargar</h3>
        <p className={styles.emptyStateDescription}>{error ?? 'Ticket no encontrado.'}</p>
        <Button variant="outlined" onClick={onBack}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.ticketDetail}>
      {/* Back button */}
      <div className={styles.ticketDetailHeader}>
        <button className={styles.backButton} onClick={onBack} type="button">
          <Icon size={18}>arrow_back</Icon>
          Volver
        </button>
        {canRespond && ticket.status === 'open' && (
          <Button variant="outlined" onClick={handleCloseTicket} disabled={sending}>
            <Icon slot="icon" size={18}>
              {sending ? 'sync' : 'check_circle'}
            </Icon>
            Cerrar ticket
          </Button>
        )}
      </div>

      {/* Ticket info */}
      <div className={styles.ticketDetailInfo}>
        <h2 className={styles.ticketDetailSubject}>{ticket.subject}</h2>
        <div className={styles.ticketDetailMeta}>
          <span className={styles.ticketNumber}>{ticket.ticketNumber}</span>
          <span className={`${styles.statusBadge} ${STATUS_CLASSES[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          <span className={`${styles.priorityBadge} ${PRIORITY_CLASSES[ticket.priority]}`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
          <span className={styles.ticketDate}>
            {new Date(ticket.createdAt).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className={styles.ticketDetailMessage}>{ticket.message}</p>
      </div>

      {/* Responses */}
      {ticket.responses.length > 0 && (
        <div className={styles.responsesSection}>
          <h3 className={styles.responsesTitle}>Respuestas ({ticket.responses.length})</h3>
          {ticket.responses.map((response) => {
            const isAdmin = response.senderType === 'admin';
            return (
              <div
                key={response.id}
                className={`${styles.responseCard} ${isAdmin ? styles.responseAdmin : styles.responseUser}`}
              >
                <div className={styles.responseHeader}>
                  <span
                    className={`${styles.responseSender} ${isAdmin ? styles.responseSenderAdmin : styles.responseSenderUser}`}
                  >
                    {isAdmin ? 'Admin — Store Lite' : 'Tu respuesta'}
                  </span>
                  <span className={styles.responseDate}>
                    {new Date(response.createdAt).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className={styles.responseMessage}>{response.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Respond Form (Admins only) */}
      {canRespond && (
        <div className={styles.feedbackForm}>
          <h3 className={styles.responsesTitle}>Responder</h3>
          <TextField
            label="Mensaje"
            type="textarea"
            rows={4}
            value={responseMessage}
            placeholder="Escribí tu respuesta..."
            onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setResponseMessage(e.target.value)
            }
          />
          <div className={styles.formActions}>
            <Button
              variant="filled"
              onClick={handleRespond}
              disabled={sending || !responseMessage.trim()}
            >
              <Icon slot="icon" size={21}>
                {sending ? 'sync' : 'reply'}
              </Icon>
              {sending ? 'Enviando...' : 'Responder'}
            </Button>
          </div>
        </div>
      )}

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        onClose={() => setFeedback((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
