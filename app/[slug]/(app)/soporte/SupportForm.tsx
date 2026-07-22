'use client';

import { AlertSnackbar, Button, Icon, TextField } from '@/shared/components/ui';
import { useState, useTransition } from 'react';

export function SupportForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
  }>({ open: false, description: '', color: 'success' });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) return;
    startTransition(async () => {
      try {
        const { submitSupportRequest } = await import('@/features/legal/actions');
        const res = await submitSupportRequest(subject.trim(), message.trim());
        if (res.success) {
          setFeedback({
            open: true,
            description: 'Mensaje enviado. Te responderemos pronto.',
            color: 'success',
          });
          setSubject('');
          setMessage('');
        } else {
          setFeedback({ open: true, description: res.error ?? 'Error al enviar.', color: 'error' });
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

  return (
    <div>
      <TextField
        label="Asunto"
        value={subject}
        placeholder="Ej: Problema con el plan, error en la facturación, consulta..."
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
        supportingText="Contanos brevemente de qué se trata."
      />
      <div style={{ height: '16px' }} />
      <TextField
        label="Mensaje"
        type="textarea"
        rows={6}
        value={message}
        placeholder="Describí tu problema o consulta con detalle..."
        onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
        supportingText="Máximo 5,000 caracteres"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button
          variant="filled"
          onClick={handleSubmit}
          disabled={isPending || !subject.trim() || !message.trim()}
        >
          <Icon slot="icon" size={21}>
            {isPending ? 'sync' : 'send'}
          </Icon>
          {isPending ? 'Enviando...' : 'Enviar mensaje'}
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
