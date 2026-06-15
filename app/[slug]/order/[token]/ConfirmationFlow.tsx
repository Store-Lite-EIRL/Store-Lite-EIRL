'use client';

import { confirmFinalization } from '@/features/dashboard/actions/finalizationActions';
import { Icon } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './FlowModals.css';

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
      <div id="confirm-finalize" className="cf-overlay cf-overlay--visible">
        <div className="cf-dialog cf-dialog--success">
          {/* Close button */}
          <button
            className="cf-close"
            onClick={() => (window.location.hash = '')}
            aria-label="Cerrar"
          >
            <Icon>close</Icon>
          </button>

          {/* Celebration icon */}
          <div className="cf-icon-circle cf-icon-circle--success">
            <Icon size={48}>celebration</Icon>
          </div>

          <h2 className="cf-title">¡Felicidades!</h2>

          <p className="cf-body">
            Tu pedido ha sido confirmado como <strong>recibido correctamente</strong>.
          </p>

          <div className="cf-card">
            <p className="cf-card-text">
              Gracias por confiar en <strong>{businessName}</strong> y en{' '}
              <strong className="cf-brand">Store Lite</strong>.
              <br />
              ¡Tu pago ha sido liberado al vendedor!
            </p>
          </div>

          <div className="cf-badge">
            <Icon size={16}>verified</Icon>
            Transacción segura y completada
          </div>

          <button className="cf-btn cf-btn--primary" onClick={() => (window.location.hash = '')}>
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="confirm-finalize" className="cf-overlay">
        <div className="cf-dialog">
          {/* Close button */}
          <button
            className="cf-close"
            onClick={() => (window.location.hash = '')}
            disabled={state === 'loading'}
            aria-label="Cerrar"
          >
            <Icon>close</Icon>
          </button>

          {state === 'loading' ? (
            /* ─── LOADING STATE ─── */
            <div className="cf-loading">
              <div className="cf-spinner">
                <div className="cf-spinner__track" />
                <div className="cf-spinner__fill" />
              </div>
              <h2 className="cf-title cf-title--small">Confirmando tu pedido...</h2>
              <p className="cf-subtitle">Procesando la confirmación de entrega</p>
            </div>
          ) : (
            /* ─── IDLE STATE ─── */
            <>
              <div className="cf-icon-circle cf-icon-circle--warning">
                <Icon size={40}>warning</Icon>
              </div>

              <h2 className="cf-title cf-title--danger">¡ATENCIÓN!</h2>

              <p className="cf-question">
                ¿Confirmás que ya tenés el producto y todo está correcto?
              </p>

              <div className="cf-card cf-card--warning">
                <p className="cf-card-text">
                  Al confirmar, el pedido se marcará como <strong>Finalizado</strong> y el vendedor
                  recibirá su pago. Esta acción no se puede revertir.
                </p>
              </div>

              <div className="cf-actions">
                <button className="cf-btn cf-btn--primary" onClick={handleConfirm}>
                  <Icon size={20}>check_circle</Icon>
                  SÍ, TODO CORRECTO
                </button>
                <a href="#report-finalize" className="cf-btn cf-btn--secondary">
                  <Icon size={20}>flag</Icon>
                  NO, TENGO UN PROBLEMA
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── ERROR SNACKBAR ─── */}
      {error && (
        <div className="cf-snackbar">
          <Icon size={20}>error</Icon>
          <span>{error}</span>
          <button className="cf-snackbar-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
