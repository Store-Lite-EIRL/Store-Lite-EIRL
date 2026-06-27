'use client';

import type { PenaltyRecord } from '@/core/penalties/penaltyTypes';
import { loadCulqiScript } from '@/shared/payments/culqiScript';
import { AlertTriangle, CheckCircle, CreditCard, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../penalties.module.css';
import modalStyles from './PayModal.module.css';

interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: PenaltyRecord[];
  businessId: string;
  culqiPublicKey?: string;
  onSuccess: () => void;
}

type PayModalStep = 'confirm' | 'processing' | 'success' | 'error';

const PENALTY_TYPE_LABELS: Record<string, string> = {
  INCUMPLIMIENTO_PLAZO_PREPARACION: 'Incumplimiento de Plazo',
  ABANDONO_PEDIDO: 'Abandono de Pedido',
};

function getTypeLabel(type: string): string {
  return PENALTY_TYPE_LABELS[type] || type;
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `S/ ${num.toFixed(2)}`;
}

export default function PayModal({
  isOpen,
  onClose,
  penalties,
  businessId,
  culqiPublicKey,
  onSuccess,
}: PayModalProps) {
  const [step, setStep] = useState<PayModalStep>('confirm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [culqiLoading, setCulqiLoading] = useState(false);
  const culqiCallbackRef = useRef(false);
  const processingRef = useRef(false);

  const totalAmount = penalties.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setErrorMessage(null);
      culqiCallbackRef.current = false;
      processingRef.current = false;
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ── Submit payment to backend ──
  const submitPayment = useCallback(
    async (culqiToken: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const response = await fetch('/api/business/penalties/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            penaltyIds: penalties.map((p) => p.id),
            culqiToken,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || data.details || 'Error al procesar el pago');
        }

        setStep('success');
        setTimeout(() => onSuccess(), 2000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al procesar el pago';
        setErrorMessage(msg);
        setStep('error');
      } finally {
        processingRef.current = false;
        culqiCallbackRef.current = false;
      }
    },
    [businessId, penalties, onSuccess],
  );

  // ── Culqi callback registration ──
  useEffect(() => {
    if (!isOpen || step !== 'processing') return;

    window.culqi = async function () {
      if (culqiCallbackRef.current) return;
      culqiCallbackRef.current = true;

      if (window.Culqi?.token) {
        const token = window.Culqi.token.id;
        window.Culqi.close();
        await submitPayment(token);
        return;
      }

      if (window.Culqi?.error) {
        const msg =
          window.Culqi.error.user_message ||
          window.Culqi.error.merchant_message ||
          'Error al procesar el pago';
        setErrorMessage(msg);
        setStep('error');
        processingRef.current = false;
        culqiCallbackRef.current = false;
        return;
      }

      setErrorMessage('No se pudo completar el pago');
      setStep('error');
      processingRef.current = false;
      culqiCallbackRef.current = false;
    };

    return () => {
      window.culqi = undefined as unknown as () => void;
    };
  }, [isOpen, step, submitPayment]);

  // ── Open Culqi checkout ──
  const openCulqi = useCallback(async () => {
    setCulqiLoading(true);
    try {
      const pk = culqiPublicKey || process.env.NEXT_PUBLIC_CULQI_PK || '';
      if (!pk) {
        throw new Error('No hay clave pública de Culqi configurada');
      }

      await loadCulqiScript(pk);

      const Culqi = window.Culqi;
      if (!Culqi) {
        throw new Error('Culqi no está disponible');
      }

      Culqi.settings({
        title: 'Pago de Multas',
        currency: 'PEN',
        description: `Pago de ${penalties.length} multa(s) — Store Lite`,
        amount: Math.round(totalAmount * 100),
      });

      Culqi.options({
        lang: 'auto',
        modal: true,
        installments: false,
        paymentMethods: {
          tarjeta: true,
          yape: true,
          billetera: false,
          bancaMovil: false,
          agente: false,
        },
        style: {
          maincolor: '#b3261e',
        },
      });

      setStep('processing');
      setCulqiLoading(false);
      Culqi.open();
    } catch (err) {
      setCulqiLoading(false);
      const msg = err instanceof Error ? err.message : 'Error al abrir la pasarela de pagos';
      setErrorMessage(msg);
      setStep('error');
    }
  }, [culqiPublicKey, penalties.length, totalAmount]);

  const handlePay = () => {
    if (processingRef.current || culqiLoading) return;
    openCulqi();
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyles.overlay} onClick={handleClose}>
      <div className={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>
            {step === 'success' ? '¡Pago Exitoso!' : 'Pagar Multas'}
          </h2>
          <button className={modalStyles.closeButton} onClick={handleClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={modalStyles.body}>
          {/* Confirm Step */}
          {step === 'confirm' && (
            <>
              <p className={modalStyles.description}>
                Estás por pagar <strong>{penalties.length} multa(s)</strong>. Revisá los detalles
                antes de continuar.
              </p>

              <div className={modalStyles.penaltyList}>
                {penalties.map((p) => (
                  <div key={p.id} className={modalStyles.penaltyItem}>
                    <div className={modalStyles.penaltyItemLeft}>
                      <AlertTriangle size={16} />
                      <div>
                        <span className={modalStyles.penaltyItemType}>
                          {getTypeLabel(p.penaltyType)}
                        </span>
                        <span className={modalStyles.penaltyItemOrder}>
                          {p.orderNumber ? `Pedido #${p.orderNumber}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className={modalStyles.penaltyItemAmount}>{formatAmount(p.amount)}</span>
                  </div>
                ))}
              </div>

              <div className={modalStyles.totalRow}>
                <span>Total a pagar</span>
                <strong>{formatAmount(totalAmount)}</strong>
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className={modalStyles.statusContainer}>
              <Loader2 size={48} className={styles.spinningIcon} />
              <p className={modalStyles.statusText}>Procesando pago...</p>
              <p className={modalStyles.statusSubtext}>
                Esperá mientras procesamos tu pago. No cierres esta ventana.
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className={modalStyles.statusContainer}>
              <div className={modalStyles.successIcon}>
                <CheckCircle size={48} />
              </div>
              <p className={modalStyles.statusText}>¡Pago registrado exitosamente!</p>
              <p className={modalStyles.statusSubtext}>
                Se pagaron {penalties.length} multa(s) por {formatAmount(totalAmount)}.
              </p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className={modalStyles.statusContainer}>
              <div className={modalStyles.errorIcon}>
                <X size={48} />
              </div>
              <p className={modalStyles.statusText}>Error al procesar el pago</p>
              <p className={modalStyles.errorMessageText}>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={modalStyles.footer}>
          {step === 'confirm' && (
            <>
              <button className={modalStyles.cancelButton} onClick={handleClose}>
                Cancelar
              </button>
              <button className={modalStyles.payButton} onClick={handlePay} disabled={culqiLoading}>
                <CreditCard size={16} />
                {culqiLoading ? 'Cargando...' : `Pagar ${formatAmount(totalAmount)}`}
              </button>
            </>
          )}

          {step === 'processing' && (
            <button className={modalStyles.cancelButton} disabled>
              Procesando...
            </button>
          )}

          {(step === 'success' || step === 'error') && (
            <button className={modalStyles.primaryButton} onClick={handleClose}>
              {step === 'success' ? 'Cerrar' : 'Intentar de nuevo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
