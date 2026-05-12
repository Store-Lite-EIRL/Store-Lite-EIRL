'use client';

import { Icon } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { rejectFinalization } from '../../dashboard/actions/finalizationActions';
import './FlowModals.css';

interface ReportFlowProps {
  paymentId: string;
  trackingToken: string;
}

type FlowState = 'idle' | 'loading' | 'success';

export default function ReportFlow({ paymentId, trackingToken }: ReportFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('idle');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Por favor, describí el problema.');
      return;
    }

    setState('loading');
    try {
      const result = await rejectFinalization(paymentId, trackingToken, reason.trim());
      if (result.success) {
        setState('success');
        router.refresh();
      } else {
        setError(result.error || 'Error al enviar el reporte');
        setState('idle');
      }
    } catch {
      setError('Error inesperado al enviar el reporte');
      setState('idle');
    }
  };

  if (state === 'success') {
    return (
      <div id="report-finalize" className="rf-overlay rf-overlay--visible">
        <div className="rf-dialog rf-dialog--success">
          {/* Close button */}
          <button
            className="rf-close"
            onClick={() => (window.location.hash = '')}
            aria-label="Cerrar"
          >
            <Icon>close</Icon>
          </button>

          {/* Shield icon */}
          <div className="rf-icon-circle rf-icon-circle--shield">
            <Icon size={48}>shield</Icon>
          </div>

          <h2 className="rf-title">Reporte Enviado</h2>

          <p className="rf-body">
            Tu reporte ha sido notificado al vendedor. <strong>Revisaremos tu caso</strong> y te
            contactaremos pronto.
          </p>

          <div className="rf-card">
            <p className="rf-card-text">
              Tu compra está protegida por <strong className="rf-brand">Store Lite</strong>.
              <br />
              El pago no se liberará hasta que el problema sea resuelto.
            </p>
          </div>

          <div className="rf-badge">
            <Icon size={16}>support_agent</Icon>
            Soporte activo 24/7
          </div>

          <button className="rf-btn rf-btn--secondary" onClick={() => (window.location.hash = '')}>
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="report-finalize" className="rf-overlay">
      <div className="rf-dialog">
        {/* Close button */}
        <button
          className="rf-close"
          onClick={() => (window.location.hash = '')}
          disabled={state === 'loading'}
          aria-label="Cerrar"
        >
          <Icon>close</Icon>
        </button>

        {state === 'loading' ? (
          /* ─── LOADING STATE ─── */
          <div className="rf-loading">
            <div className="rf-spinner">
              <div className="rf-spinner__track" />
              <div className="rf-spinner__fill" />
            </div>
            <h2 className="rf-title rf-title--small">Enviando reporte...</h2>
            <p className="rf-subtitle">Notificando al vendedor sobre tu problema</p>
          </div>
        ) : (
          /* ─── IDLE STATE ─── */
          <>
            <div className="rf-icon-circle rf-icon-circle--warning">
              <Icon size={40}>report_problem</Icon>
            </div>

            <h2 className="rf-title">Reportar Problema</h2>

            <p className="rf-question">Describí el problema con tu pedido</p>

            <form onSubmit={handleSubmit} className="rf-form">
              <div className="rf-field">
                <label htmlFor="report-reason" className="rf-label">
                  Motivo del reporte
                </label>
                <textarea
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describí el problema con detalle..."
                  required
                  className="rf-textarea"
                  rows={5}
                />
              </div>

              {error && (
                <div className="rf-error">
                  <Icon size={18}>error</Icon>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="rf-btn rf-btn--secondary" disabled={!reason.trim()}>
                <Icon size={20}>send</Icon>
                ENVIAR REPORTE
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
