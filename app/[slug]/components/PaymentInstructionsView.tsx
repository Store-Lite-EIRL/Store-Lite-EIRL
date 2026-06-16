'use client';

import { AlertSnackbar } from '@/shared/components/ui';
import { createPortal } from 'react-dom';
import styles from './Checkout.module.css';

interface PaymentInstructions {
  culqiOrderId: string;
  paymentMethod: string;
  paymentCode: string | null;
  qrUrl: string | null;
  expirationDate: string | null;
}

interface AlertState {
  open: boolean;
  description: string;
  color: 'primary' | 'success' | 'error' | 'warning';
  icon: string;
}

interface PaymentInstructionsViewProps {
  paymentInstructions: PaymentInstructions;
  alert: AlertState;
  onDismiss: () => void;
  onAlertClose: () => void;
}

function formatPaymentMethodName(method: string): string {
  switch (method) {
    case 'pago_efectivo':
      return 'Pago Efectivo';
    case 'billetera_movil':
      return 'Billetera Móvil';
    case 'cuotealo':
      return 'Cuotéalo';
    default:
      return method;
  }
}

export function PaymentInstructionsView({
  paymentInstructions,
  alert,
  onDismiss,
  onAlertClose,
}: PaymentInstructionsViewProps) {
  const isPagoEfectivo = paymentInstructions.paymentMethod === 'pago_efectivo';
  const isBilleteraMovil = paymentInstructions.paymentMethod === 'billetera_movil';
  const isCuotealo = paymentInstructions.paymentMethod === 'cuotealo';

  return createPortal(
    <div className={styles.checkoutOverlay}>
      <div
        className={styles.checkoutModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '450px',
          padding: '0',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FFF3E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="#E65100">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h2 style={{ margin: 0, textAlign: 'center', fontSize: '22px', fontWeight: '800' }}>
            Instrucciones de Pago
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--md-sys-color-on-surface-variant)',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            Método: <strong>{formatPaymentMethodName(paymentInstructions.paymentMethod)}</strong>
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {isPagoEfectivo && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 16px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Realiza el depósito en cualquier agente o banco autorizado usando este código CIP:
              </p>
              <div
                style={{
                  background: '#F5F5F5',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '16px',
                  border: '2px dashed #E65100',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    margin: '0 0 8px',
                    color: '#666',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Código CIP
                </p>
                <p
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    margin: 0,
                    color: '#E65100',
                    fontFamily: 'monospace',
                    letterSpacing: '4px',
                  }}
                  data-testid="cip-code"
                >
                  {paymentInstructions.paymentCode}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    padding: '4px 12px',
                    background: '#E8F5E9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#2E7D32',
                  }}
                >
                  BCP
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    background: '#E3F2FD',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1565C0',
                  }}
                >
                  BBVA
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    background: '#FFF3E0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#E65100',
                  }}
                >
                  Interbank
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  margin: 0,
                }}
              >
                También disponible en agentes KasNet, Western Union y bodegas autorizadas.
              </p>
            </div>
          )}

          {isBilleteraMovil && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 16px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Escanea el código QR con tu aplicación de Billetera Móvil:
              </p>
              {paymentInstructions.qrUrl && (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'inline-block',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentInstructions.qrUrl}
                    alt="QR de pago"
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>
              )}
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  margin: '12px 0 0',
                }}
              >
                Abre tu app de billetera móvil, selecciona pagar con QR y escanea este código.
              </p>
            </div>
          )}

          {isCuotealo && (
            <div style={{ width: '100%', textAlign: 'center', padding: '20px 0' }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Serás redirigido para completar el pago en cuotas.
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  margin: 0,
                }}
              >
                Una vez aprobado, recibirás la confirmación por correo electrónico.
              </p>
            </div>
          )}

          {/* Expiration countdown */}
          {paymentInstructions.expirationDate && (
            <div
              style={{
                width: '100%',
                padding: '12px',
                background: '#FFF8E1',
                borderRadius: '10px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="#F57F17">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F57F17' }}>
                Vence:{' '}
                {new Date(paymentInstructions.expirationDate).toLocaleString('es-PE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Info message */}
          <div
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(103, 80, 164, 0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(103, 80, 164, 0.12)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              El pago se confirmará automáticamente cuando el banco procese la transacción.
              Recibirás un correo con la confirmación.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            background: 'var(--md-sys-color-surface)',
            borderBottomLeftRadius: '28px',
            borderBottomRightRadius: '28px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                onAlertClose();
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                background: 'var(--md-sys-color-surface)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--md-sys-color-primary)',
              }}
              aria-label="Verificar pago"
            >
              Verificar Pago
            </button>
            <button
              onClick={onDismiss}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--md-sys-color-primary)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
              aria-label="Cerrar instrucciones"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={onAlertClose}
      />
    </div>,
    document.body,
  );
}
