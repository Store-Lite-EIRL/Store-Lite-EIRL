'use client';

// =====================================================
// ComplaintsPanel — Admin complaint list + reply form
// =====================================================
// T10: Admin complaints list (RSC-like via server action fetch)
// T11: ReplyForm inline for each pending complaint
// =====================================================

import { AlertSnackbar, Button, Card, Divider, Icon, TextField } from '@/shared/components/ui';
import { useCallback, useEffect, useState, useTransition } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

import type { ComplaintRecord } from '@/features/legal/types';

interface ComplaintsPanelProps {
  businessId: string;
  isOwner: boolean;
  permissions: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOverdue(deadline: string): boolean {
  return new Date() > new Date(deadline);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'acknowledged':
      return 'Acusado';
    case 'responded':
      return 'Respondido';
    default:
      return status;
  }
}

// ── Sub-component: ReplyForm (T11) ───────────────────────────────────────────

function ReplyForm({
  businessId,
  complaint,
  onResponded,
}: {
  businessId: string;
  complaint: ComplaintRecord;
  onResponded: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
  }>({ open: false, description: '', color: 'success' });

  const handleSubmit = useCallback(() => {
    if (!response.trim()) return;

    startTransition(async () => {
      const { respondToComplaint } = await import('@/features/legal/actions').catch(
        (err: unknown) => {
          console.error('[ComplaintsPanel] Failed to load actions:', err);
          setFeedback({
            open: true,
            description: 'Error al cargar el módulo de reclamos.',
            color: 'error',
          });
          return { respondToComplaint: null };
        },
      );
      if (!respondToComplaint) return;
      const res = await respondToComplaint(businessId, complaint.id, response.trim());

      if (res.success) {
        setFeedback({ open: true, description: 'Respuesta registrada.', color: 'success' });
        onResponded();
      } else {
        setFeedback({
          open: true,
          description: res.error ?? 'Error al responder.',
          color: 'error',
        });
      }
    });
  }, [response, complaint.id, onResponded]);

  if (complaint.status === 'responded') return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <Divider />
      <div style={{ padding: '16px 0 0' }}>
        <TextField
          label="Respuesta al consumidor"
          type="textarea"
          rows={3}
          value={response}
          placeholder="Escribí la respuesta oficial al reclamo..."
          onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
          supportingText="Máximo 5,000 caracteres"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="filled" onClick={handleSubmit} disabled={isPending || !response.trim()}>
            <Icon slot="icon" size={21}>
              {isPending ? 'sync' : 'reply'}
            </Icon>
            {isPending ? 'Enviando...' : 'Responder reclamo'}
          </Button>
        </div>
      </div>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ComplaintsPanel({ businessId, isOwner, permissions }: ComplaintsPanelProps) {
  const canView = isOwner || permissions.includes('legal.edit');
  const [data, setData] = useState<{
    complaints: ComplaintRecord[];
    error?: string;
    loaded: boolean;
  }>({ complaints: [], loaded: false });

  const loadComplaints = useCallback(() => {
    import('@/features/legal/actions')
      .then(({ getComplaints }) => {
        getComplaints(businessId)
          .then((result) => {
            if (result.success) {
              setData({ complaints: result.complaints, loaded: true });
            } else {
              setData({ complaints: [], error: result.error, loaded: true });
            }
          })
          .catch((err: unknown) => {
            console.error('[ComplaintsPanel] getComplaints failed:', err);
            setData({ complaints: [], error: 'Error al cargar los reclamos.', loaded: true });
          });
      })
      .catch((err: unknown) => {
        console.error('[ComplaintsPanel] Failed to load actions module:', err);
        setData({ complaints: [], error: 'Error al cargar el módulo de reclamos.', loaded: true });
      });
  }, [businessId]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleRefresh = loadComplaints;

  if (!canView) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        <Icon size={48}>lock</Icon>
        <p>No tenés permisos para ver los reclamos.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Libro de Reclamaciones
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: '0.875rem',
            }}
          >
            Administrá los reclamos recibidos según el DS 011-2011-PCM.
          </p>
        </div>
        <Button variant="outlined" onClick={handleRefresh}>
          <Icon slot="icon" size={20}>
            refresh
          </Icon>
          Actualizar
        </Button>
      </div>

      {data.error && (
        <Card
          variant="outlined"
          style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fef2f2' }}
        >
          <p style={{ color: '#991b1b', margin: 0 }}>{data.error}</p>
        </Card>
      )}

      {!data.loaded ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Icon size={48}>sync</Icon>
          <p>Cargando reclamos...</p>
        </div>
      ) : data.complaints.length === 0 ? (
        <Card variant="outlined" style={{ padding: '2rem', textAlign: 'center' }}>
          <Icon size={48} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            check_circle
          </Icon>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            No hay reclamos registrados.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.complaints.map((complaint) => (
            <Card key={complaint.id} variant="outlined" style={{ padding: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <strong style={{ fontSize: '1rem' }}>{complaint.ticketNumber}</strong>
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        complaint.status === 'responded'
                          ? '#dcfce7'
                          : complaint.status === 'acknowledged'
                            ? '#fef9c3'
                            : '#fee2e2',
                      color:
                        complaint.status === 'responded'
                          ? '#166534'
                          : complaint.status === 'acknowledged'
                            ? '#854d0e'
                            : '#991b1b',
                    }}
                  >
                    {getStatusLabel(complaint.status)}
                  </span>
                </div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {formatDate(complaint.createdAt)}
                </span>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {complaint.consumerFirstName} {complaint.consumerLastName}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    marginLeft: '8px',
                  }}
                >
                  {complaint.consumerEmail}
                </span>
              </div>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--md-sys-color-on-surface)',
                  margin: '0 0 0.5rem',
                  lineHeight: 1.5,
                }}
              >
                {complaint.claimDescription.length > 200
                  ? `${complaint.claimDescription.slice(0, 200)}...`
                  : complaint.claimDescription}
              </p>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                <Icon size={16}>calendar_today</Icon>
                <span
                  style={{
                    color: isOverdue(complaint.slaDeadline)
                      ? '#dc2626'
                      : 'var(--md-sys-color-on-surface-variant)',
                    fontWeight: isOverdue(complaint.slaDeadline) ? 700 : 400,
                  }}
                >
                  {isOverdue(complaint.slaDeadline) ? 'VENCIDO' : 'En plazo'} —{' '}
                  {formatDate(complaint.slaDeadline)}
                </span>
              </div>

              {/* Reply Form (T11) — only for non-responded */}
              <ReplyForm
                businessId={businessId}
                complaint={complaint}
                onResponded={handleRefresh}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
