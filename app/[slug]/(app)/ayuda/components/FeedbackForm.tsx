'use client';

// =====================================================
// FeedbackForm — Unified support/feedback/complaint form
// =====================================================

import { AlertSnackbar, Button, Icon, TextField } from '@/shared/components/ui';
import { useState, useTransition } from 'react';
import styles from '../ayuda.module.css';

interface FeedbackFormProps {
  businessId: string;
  priority: 'low' | 'normal' | 'high';
  onSuccess?: () => void;
}

const REQUEST_TYPES = [
  {
    value: 'support' as const,
    label: 'Soporte',
    icon: 'support_agent',
    description: 'Necesito ayuda con algo',
  },
  {
    value: 'feedback' as const,
    label: 'Feedback',
    icon: 'feedback',
    description: 'Bug, sugerencia o mejora',
  },
  {
    value: 'complaint' as const,
    label: 'Queja',
    icon: 'report_problem',
    description: 'Queja formal',
  },
];

const CATEGORIES = [
  { value: 'bug' as const, label: 'Bug / Error', icon: 'bug_report' },
  { value: 'suggestion' as const, label: 'Sugerencia', icon: 'lightbulb' },
  { value: 'question' as const, label: 'Consulta', icon: 'help' },
  { value: 'other' as const, label: 'Otro', icon: 'more_horiz' },
];

function priorityLabel(priority: 'low' | 'normal' | 'high'): string {
  switch (priority) {
    case 'low':
      return 'Baja';
    case 'normal':
      return 'Normal';
    default:
      return 'Alta';
  }
}

export function FeedbackForm({ businessId, priority, onSuccess }: FeedbackFormProps) {
  const [requestType, setRequestType] = useState<'support' | 'feedback' | 'complaint' | ''>('');
  const [category, setCategory] = useState<'bug' | 'suggestion' | 'question' | 'other' | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [ticketNumber, setTicketNumber] = useState('');
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
  }>({ open: false, description: '', color: 'success' });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!requestType || !category || !subject.trim() || !message.trim()) return;

    startTransition(async () => {
      try {
        const { submitFeedback } = await import('@/features/feedback/actions');
        const res = await submitFeedback({
          businessId,
          requestType,
          category,
          subject: subject.trim(),
          message: message.trim(),
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        });

        if (res.success && res.ticketNumber) {
          setTicketNumber(res.ticketNumber);
          setStep('success');
          onSuccess?.();
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
          description: 'Error de conexión. Intentá de nuevo.',
          color: 'error',
        });
      }
    });
  };

  const handleReset = () => {
    setRequestType('');
    setCategory('');
    setSubject('');
    setMessage('');
    setContactEmail('');
    setContactPhone('');
    setStep('form');
    setTicketNumber('');
  };

  if (step === 'success') {
    return (
      <div className={styles.successState}>
        <Icon size={48} className={styles.successIcon}>
          check_circle
        </Icon>
        <h3 className={styles.successTitle}>¡Mensaje enviado!</h3>
        <p className={styles.successDescription}>
          Tu solicitud fue registrada correctamente. Te responderemos pronto.
        </p>
        <div className={styles.successTicketNumber}>{ticketNumber}</div>
        <Button variant="outlined" onClick={handleReset}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.feedbackForm}>
      {/* Priority Info */}
      <div className={styles.priorityInfo}>
        <Icon size={18} className={styles.priorityIcon}>
          info
        </Icon>
        <span>
          Tu plan te da prioridad <strong>{priorityLabel(priority)}</strong> en la respuesta.
        </span>
      </div>

      {/* Request Type Selection */}
      <div className={styles.categorySelect}>
        <span className={styles.categoryLabel}>¿Qué necesitás?</span>
        <div className={styles.requestTypeOptions}>
          {REQUEST_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`${styles.requestTypeCard} ${requestType === type.value ? styles.requestTypeCardActive : ''}`}
              onClick={() => setRequestType(type.value)}
            >
              <Icon size={24}>{type.icon}</Icon>
              <span className={styles.requestTypeLabel}>{type.label}</span>
              <span className={styles.requestTypeDescription}>{type.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div className={styles.categorySelect}>
        <span className={styles.categoryLabel}>Categoría</span>
        <div className={styles.categoryOptions}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`${styles.categoryChip} ${category === cat.value ? styles.categoryChipActive : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              <Icon size={16}>{cat.icon}</Icon>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <TextField
        label="Asunto"
        value={subject}
        placeholder="Ej: Error al subir imagen, solicitud de ayuda..."
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
        supportingText="Resumen breve de tu mensaje"
      />

      {/* Message */}
      <TextField
        label="Mensaje"
        type="textarea"
        rows={6}
        value={message}
        placeholder="Describí tu problema, sugerencia o consulta con detalle..."
        onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
        supportingText={`${message.length}/5,000 caracteres`}
      />

      {/* Contact Info */}
      <div className={styles.categorySelect}>
        <span className={styles.categoryLabel}>Datos de contacto (opcional)</span>
        <p className={styles.categoryDescription}>
          Para que podamos contactarte directamente por email o teléfono.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <TextField
            label="Email"
            value={contactEmail}
            placeholder="tu@email.com"
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
          />
          <TextField
            label="Teléfono"
            value={contactPhone}
            placeholder="+51 999 999 999"
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.formActions}>
        <Button
          variant="filled"
          onClick={handleSubmit}
          disabled={isPending || !requestType || !category || !subject.trim() || !message.trim()}
        >
          <Icon slot="icon" size={21}>
            {isPending ? 'sync' : 'send'}
          </Icon>
          {isPending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        onClose={() => setFeedback((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
