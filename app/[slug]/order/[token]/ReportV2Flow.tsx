'use client';

import { reportIssueV2 } from './actions';
import { Icon } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './FlowModals.css';

interface ReportV2FlowProps {
  paymentId: string;
  trackingToken: string;
}

type FlowState = 'warning' | 'form' | 'loading' | 'success';

const ISSUE_REASONS = [
  { value: 'INVALID_TRACKING', label: 'El número de tracking no funciona' },
  { value: 'INCORRECT_COST', label: 'El costo de envío es incorrecto' },
  { value: 'MISSING_INFORMATION', label: 'Falta información del envío' },
  { value: 'WRONG_DOCUMENT', label: 'El comprobante no corresponde a mi pedido' },
  { value: 'SHIPPING_COST_DISAGREEMENT', label: 'No acordé el costo de envío' },
  { value: 'OTHER', label: 'Otro motivo' },
];

export default function ReportV2Flow({
  paymentId,
  trackingToken,
}: ReportV2FlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('warning');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Seleccioná un motivo.');
      return;
    }

    setState('loading');
    try {
      const result = await reportIssueV2(paymentId, trackingToken, reason);
      if (result.success) {
        setState('success');
        router.refresh();
      } else {
        setError(result.error || 'Error al enviar el reporte');
        setState('form');
      }
    } catch {
      setError('Error inesperado al enviar el reporte');
      setState('form');
    }
  };

  if (state === 'success') {
    return (
      <div id="report-v2" className="cf-overlay cf-overlay--visible">
        <div className="cf-dialog cf-dialog--success">
          <button
            className="cf-close"
            onClick={() => (window.location.hash = '')}
            aria-label="Cerrar"
          >
            <Icon>close</Icon>
          </button>

          <div className="cf-icon-circle cf-icon-circle--success">
            <Icon size={48}>shield</Icon>
          </div>

          <h2 className="cf-title">Reporte Enviado</h2>

          <p className="cf-body">
            Tu reporte ha sido notificado al vendedor.{' '}
            <strong>Revisaremos tu caso</strong> y te contactaremos pronto.
          </p>

          <div className="cf-card">
            <p className="cf-card-text">
              Tu compra está protegida por <strong className="cf-brand">Store Lite</strong>.
              <br />
              El pago no se liberará hasta que el problema sea resuelto.
            </p>
          </div>

          <div className="cf-badge">
            <Icon size={16}>support_agent</Icon>
            Soporte activo 24/7
          </div>

          <button
            className="cf-btn cf-btn--primary"
            onClick={() => (window.location.hash = '')}
          >
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="report-v2" className="cf-overlay">
      <div className="cf-dialog">
        <button
          className="cf-close"
          onClick={() => {
            setState('warning');
            setError(null);
            window.location.hash = '';
          }}
          disabled={state === 'loading'}
          aria-label="Cerrar"
        >
          <Icon>close</Icon>
        </button>

        {state === 'loading' ? (
          /* ─── LOADING ─── */
          <div className="cf-loading">
            <div className="cf-spinner">
              <div className="cf-spinner__track" />
              <div className="cf-spinner__fill" />
            </div>
            <h2 className="cf-title cf-title--small">Enviando reporte...</h2>
            <p className="cf-subtitle">Notificando al vendedor sobre tu problema</p>
          </div>
        ) : state === 'warning' ? (
          /* ─── WARNING DIALOG ─── */
          <>
            <div className="cf-icon-circle cf-icon-circle--warning">
              <Icon size={40}>warning</Icon>
            </div>

            <h2 className="cf-title cf-title--danger">
              ¿Estás seguro de reportar un problema?
            </h2>

            <div className="cf-card cf-card--warning">
              <p className="cf-card-text">
                Abrir un reporte puede retrasar el envío de tu pedido. Te recomendamos intentar
                resolver el problema directamente con el negocio antes de continuar.
              </p>
              <p className="cf-card-text" style={{ marginTop: '0.75rem', fontWeight: 700 }}>
                Si continuás, el pedido entrará en revisión.
              </p>
            </div>

            <div className="cf-actions">
              <a
                href="#"
                className="cf-btn cf-btn--primary"
                onClick={(e) => {
                  e.preventDefault();
                  setState('form');
                }}
              >
                <Icon size={20}>flag</Icon>
                ABRIR REPORTE
              </a>
              <a href="#" className="cf-btn cf-btn--secondary" onClick={() => (window.location.hash = '')}>
                SEGUIR INTENTANDO RESOLVER
              </a>
            </div>
          </>
        ) : (
          /* ─── FORM ─── */
          <>
            <div className="cf-icon-circle cf-icon-circle--warning">
              <Icon size={40}>report_problem</Icon>
            </div>

            <h2 className="cf-title">Reportar Problema</h2>
            <p className="cf-question">Seleccioná el motivo del reporte</p>

            <form onSubmit={handleSubmit} className="rf-form">
              <div className="rf-field">
                <label htmlFor="issue-reason" className="rf-label">
                  Motivo
                </label>
                <select
                  id="issue-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '16px',
                    border: '1.5px solid var(--md-sys-color-outline-variant)',
                    background: 'var(--md-sys-color-surface)',
                    fontSize: '0.9rem',
                    color: 'var(--md-sys-color-on-surface)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Seleccioná un motivo...</option>
                  {ISSUE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rf-error">
                  <Icon size={18}>error</Icon>
                  <span>{error}</span>
                </div>
              )}

              <div className="cf-actions">
                <button
                  type="submit"
                  className="cf-btn cf-btn--secondary"
                  disabled={!reason}
                >
                  <Icon size={20}>send</Icon>
                  ENVIAR REPORTE
                </button>
                <a
                  href="#"
                  className="cf-btn cf-btn--primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setState('warning');
                    setError(null);
                  }}
                >
                  VOLVER
                </a>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
