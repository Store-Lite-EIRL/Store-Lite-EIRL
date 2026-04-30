'use client';

import { Icon } from '@/shared/components/ui';
import { useState } from 'react';
import { rejectFinalization } from '../../dashboard/actions/finalizationActions';

interface ReportFlowProps {
  paymentId: string;
  trackingToken: string;
}

type FlowState = 'idle' | 'loading' | 'success';

export default function ReportFlow({ paymentId, trackingToken }: ReportFlowProps) {
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
      <div
        id="report-finalize"
        className="modal-overlay"
        style={{
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="m-box"
          style={{
            maxWidth: '480px',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          {/* Shield icon */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, var(--md-sys-color-secondary) 0%, var(--md-sys-color-primary) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              boxShadow:
                '0 20px 60px rgba(var(--md-sys-color-secondary-rgb, 98, 0, 238), 0.3)',
              animation: 'celebrate-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <Icon size={48}>shield</Icon>
          </div>

          <h2
            style={{
              margin: '0 0 0.5rem',
              fontSize: '1.75rem',
              fontWeight: 950,
              letterSpacing: '-0.03em',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Reporte Enviado 🛡️
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            Tu reporte ha sido notificado al vendedor. <b>Revisaremos tu caso</b> y te
            contactaremos pronto.
          </p>

          <div
            style={{
              background: 'var(--md-sys-color-surface-container-highest)',
              borderRadius: '24px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                lineHeight: 1.6,
              }}
            >
              Tu compra está protegida por <b style={{ color: 'var(--md-sys-color-primary)' }}>Store Lite</b>.
              <br />
              El pago no se liberará hasta que el problema sea resuelto.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.6,
            }}
          >
            <Icon size={16}>support_agent</Icon>
            Soporte activo 24/7
          </div>

          <style>{`
            @keyframes celebrate-pop {
              0% { transform: scale(0) rotate(-30deg); opacity: 0; }
              60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div id="report-finalize" className="modal-overlay">
      <div className="m-box" style={{ maxWidth: '500px', padding: '3rem' }}>
        <a
          href="#"
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            color: 'inherit',
            pointerEvents: state === 'loading' ? 'none' : undefined,
          }}
        >
          <Icon>close</Icon>
        </a>

        {state === 'loading' ? (
          // LOADING STATE
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 2rem',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '4px solid var(--md-sys-color-secondary-container)',
                  borderRadius: '50%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '4px solid transparent',
                  borderTopColor: 'var(--md-sys-color-secondary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
            <h2
              style={{
                margin: '0 0 0.5rem',
                fontSize: '1.25rem',
                fontWeight: 950,
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Enviando reporte...
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.7,
              }}
            >
              Notificando al vendedor sobre tu problema
            </p>
          </div>
        ) : (
          // IDLE STATE
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--md-sys-color-warning-container)',
                  color: 'var(--md-sys-color-on-warning-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  border: '3px solid var(--md-sys-color-warning)',
                }}
              >
                <Icon size={40}>report_problem</Icon>
              </div>
              <h2
                style={{
                  margin: '0',
                  fontSize: '1.5rem',
                  fontWeight: 950,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                Reportar Problema
              </h2>
            </div>

            <p
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              Describí el problema con tu pedido
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describí el problema con detalle..."
                required
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '1.25rem',
                  borderRadius: '20px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  background: 'var(--md-sys-color-surface)',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />

              {error && (
                <div
                  style={{
                    background: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                    padding: '1rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18}>error</Icon>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-hub btn-hub-s"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ENVIAR REPORTE
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
