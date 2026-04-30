'use client';

import { Icon } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { confirmFinalization } from '../../dashboard/actions/finalizationActions';

interface ConfirmationFlowProps {
  paymentId: string;
  trackingToken: string;
  businessName: string;
}

type FlowState = 'idle' | 'loading' | 'success';

export default function ConfirmationFlow({
  paymentId,
  trackingToken,
  businessName,
}: ConfirmationFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setState('loading');
    try {
      const result = await confirmFinalization(paymentId, trackingToken);
      if (result.success) {
        setState('success');
        router.refresh();
      } else {
        setError(result.error || 'Error al confirmar');
        setState('idle');
      }
    } catch {
      setError('Error inesperado al confirmar');
      setState('idle');
    }
  };

  if (state === 'success') {
    return (
      <div
        id="confirm-finalize"
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
          {/* Celebration icon */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, var(--md-sys-color-tertiary) 0%, var(--md-sys-color-primary) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              boxShadow:
                '0 20px 60px rgba(var(--md-sys-color-tertiary-rgb, 100, 181, 246), 0.4)',
              animation: 'celebrate-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <Icon size={48}>celebration</Icon>
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
            ¡Felicidades! 🎉
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            Tu pedido ha sido confirmado como <b>recibido correctamente</b>.
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
              Gracias por confiar en <b>{businessName}</b> y en{' '}
              <b style={{ color: 'var(--md-sys-color-primary)' }}>Store Lite</b>.
              <br />
              ¡Tu pago ha sido liberado al vendedor!
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
            <Icon size={16}>verified</Icon>
            Transacción segura y completada
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
    <>
      {/* MODAL: Confirm Finalization - CRITICAL WARNING */}
      <div id="confirm-finalize" className="modal-overlay">
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
                    border: '4px solid var(--md-sys-color-primary-container)',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '4px solid transparent',
                    borderTopColor: 'var(--md-sys-color-primary)',
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
                Confirmando tu pedido...
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  opacity: 0.7,
                }}
              >
                Procesando la confirmación de entrega
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
                    background: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    border: '3px solid var(--md-sys-color-error)',
                  }}
                >
                  <Icon size={40}>warning</Icon>
                </div>
                <h2
                  style={{
                    margin: '0',
                    fontSize: '1.5rem',
                    fontWeight: 950,
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  ¡ATENCIÓN!
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
                ¿Confirmás que ya tenés el producto y todo está correcto?
              </p>

              <div
                style={{
                  background: 'var(--md-sys-color-surface-container-highest)',
                  padding: '1.5rem',
                  borderRadius: '24px',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                <p style={{ margin: 0 }}>
                  Al confirmar, el pedido se marcará como <b>Finalizado</b> y el vendedor recibirá su
                  pago. Esta acción no se puede revertir.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={handleConfirm}
                  className="btn-hub btn-hub-p"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  SÍ, TODO CORRECTO
                </button>
                <a
                  href="#report-finalize"
                  className="btn-hub btn-hub-s"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  NO, TENGO UN PROBLEMA
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            padding: '1rem 2rem',
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '0.9rem',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <Icon size={20}>error</Icon>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
