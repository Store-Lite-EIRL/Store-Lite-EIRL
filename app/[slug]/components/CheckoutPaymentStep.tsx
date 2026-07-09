'use client';

import type { CartItem } from '@/features/storage/context/CartContext';
import { Icon } from '@/shared/components/ui';
import type { ShippingInfo } from './Checkout';
import styles from './Checkout.module.css';
import { YAPE_LIMITS } from './hooks/useCheckoutPayment';

interface CustomerAuth {
  provider: string;
  authId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface CheckoutPaymentStepProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  onShippingInfoChange: (updater: (prev: ShippingInfo) => ShippingInfo) => void;
  finalTotal: number;
  email: string;
  onEmailChange: (email: string) => void;
  customerAuth: CustomerAuth | null;
  isCheckingSession: boolean;
  isAwaitingAuth: boolean;
  onGoogleSignIn: () => void;
  loading: boolean;
}

export function CheckoutPaymentStep({
  cartItems,
  shippingInfo,
  onShippingInfoChange,
  finalTotal,
  email,
  onEmailChange,
  customerAuth,
  isCheckingSession,
  isAwaitingAuth,
  onGoogleSignIn,
  loading,
}: CheckoutPaymentStepProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.orderSummaryCard}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800' }}>Resumen Final</h3>
        <div className={styles.itemListSummary}>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.summaryProductItem}>
              <span className={styles.productName}>{item.name}</span>
              <span className={styles.productQty}>x{item.quantity}</span>
              <span className={styles.productPrice}>
                S/ {(Number(item.secondPrice || item.price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.summaryShippingLine}>
          {shippingInfo.courier === 'recojo' ? (
            <span>Envío: Recojo en tienda</span>
          ) : (
            <span>
              Envío:{' '}
              {shippingInfo.courier === 'urbano_agencia'
                ? `Agencia Urbano (${shippingInfo.agency || '—'})`
                : 'Domicilio'}
              {' — pagás con ticket CIP'}
            </span>
          )}
        </div>
        <div
          className={styles.summaryTotalFinal}
          style={{
            marginTop: '8px',
            borderTop: '1px dashed var(--md-sys-color-outline-variant)',
            paddingTop: '12px',
          }}
        >
          <span>Total a Pagar</span>
          <span>S/ {finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <p className={styles.helpText} style={{ marginBottom: '8px' }}>
          Verificación de Entrega:
        </p>
        <input
          type="text"
          placeholder="DNI (8 digitos)"
          value={shippingInfo.dni}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) onShippingInfoChange((prev) => ({ ...prev, dni: value }));
          }}
          className={`${styles.input} ${shippingInfo.dni.length > 0 && shippingInfo.dni.length !== 8 ? styles.inputError : ''}`}
          disabled={loading}
          required
        />
      </div>

      {/* ─── Email ─── */}
      <div className={styles.formGroup}>
        <div style={{ position: 'relative' }}>
          <input
            type="email"
            placeholder="Correo para comprobante"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={styles.input}
            disabled={loading}
            required
          />
          {/* Badge: solo se muestra si el email coincide con el de Google */}
          {customerAuth && email === customerAuth.email && (
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: '#e8f5e9',
                color: '#2e7d32',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '14px' }}>✓</span> Google Verified
            </span>
          )}
          {/* Badge cambiado: cuando el email no coincide con el de Google */}
          {customerAuth && email !== customerAuth.email && (
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: '#fff3e0',
                color: '#e65100',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Identidad verificada
            </span>
          )}
        </div>
        {customerAuth && email === customerAuth.email && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.7,
            }}
          >
            Podés cambiar el correo si querés usar otro para el comprobante.
          </p>
        )}
      </div>

      {/* ─── Google Auth (opcional) ─── */}
      {!isCheckingSession && !customerAuth && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: 'var(--md-sys-color-outline-variant)',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              o
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: 'var(--md-sys-color-outline-variant)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isAwaitingAuth || loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              background: 'var(--md-sys-color-surface)',
              cursor: isAwaitingAuth ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--md-sys-color-on-surface)',
              transition: 'all 0.2s',
              opacity: isAwaitingAuth ? 0.7 : 1,
              marginBottom: '12px',
            }}
            onMouseEnter={(e) => {
              if (!isAwaitingAuth)
                e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--md-sys-color-surface)';
            }}
          >
            {isAwaitingAuth ? (
              <>
                <span className={styles.spinner} style={{ width: 18, height: 18 }} />
                Conectando con Google…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Identificarme con Google (opcional)
              </>
            )}
          </button>

          {/* ─── Privacy Message ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '10px',
              background: 'rgba(103, 80, 164, 0.04)',
              border: '1px solid rgba(103, 80, 164, 0.12)',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: '1.4', flexShrink: 0 }}>🔒</span>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                lineHeight: '1.5',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              Tus datos de Google se usan <strong>solo para verificar tu identidad</strong> ante
              Store Lite al acceder a tu orden. <strong>No serán compartidos con el negocio</strong>
              . Garantizamos tu privacidad.
            </p>
          </div>
        </>
      )}

      {/* ─── Privacy message (when authenticated, email matchea) ─── */}
      {customerAuth && email === customerAuth.email && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            marginBottom: '12px',
            borderRadius: '10px',
            background: 'rgba(46, 125, 50, 0.05)',
            border: '1px solid rgba(46, 125, 50, 0.15)',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: '1.4', flexShrink: 0 }}>🛡️</span>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: '1.5',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Comprás con <strong>{customerAuth.name}</strong> ({customerAuth.email}). Store Lite usa
            tu identidad de Google solo para verificar tus compras.
            <strong> El negocio no recibe tus datos de Google</strong>.
          </p>
        </div>
      )}

      {/* ─── Privacy message (when authenticated, pero cambió el email) ─── */}
      {customerAuth && email !== customerAuth.email && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            marginBottom: '12px',
            borderRadius: '10px',
            background: 'rgba(230, 81, 0, 0.04)',
            border: '1px solid rgba(230, 81, 0, 0.12)',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: '1.4', flexShrink: 0 }}>🔐</span>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: '1.5',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Tu identidad de Google (<strong>{customerAuth.email}</strong>) queda vinculada a esta
            compra para que puedas acceder a tu orden. El comprobante se enviará a{' '}
            <strong>{email}</strong>. El negocio no recibe tus datos de Google.
          </p>
        </div>
      )}

      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(103, 80, 164, 0.05)',
          borderRadius: '12px',
          border: '1px solid var(--md-sys-color-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Icon size={18} style={{ color: 'var(--md-sys-color-primary)' }}>
            psd_note
          </Icon>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--md-sys-color-primary)',
            }}
          >
            Medios de pago
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingLeft: '26px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Yape</span>
            <span style={{ fontWeight: 600 }}>
              S/ {YAPE_LIMITS.min.toFixed(2)} – S/ {YAPE_LIMITS.max.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tarjeta</span>
            <span style={{ fontWeight: 600 }}>sin límite</span>
          </div>
        </div>
        <div
          style={{
            marginTop: '8px',
            paddingLeft: '26px',
            fontSize: '11px',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          Montos mayores a S/ {YAPE_LIMITS.max.toFixed(2)} solo con tarjeta · Pagos por{' '}
          <strong>Culqi</strong>
        </div>
      </div>
    </div>
  );
}
