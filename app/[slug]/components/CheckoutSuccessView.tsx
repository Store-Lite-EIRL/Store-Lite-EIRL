'use client';

import type { CartItem } from '@/features/storage/context/CartContext';
import { Button, Confetti, Icon, Receipt } from '@/shared/components/ui';
import { getBusinessPath } from '@/shared/utils/url';
import { useRouter } from 'next/navigation';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { ShippingInfo } from './Checkout';
import styles from './Checkout.module.css';

interface ReceiptItem {
  label: string;
  value: number;
}

interface CompletedOrder {
  orderNumber: string;
  paymentMethod: string;
  trackingToken?: string;
}

interface CheckoutSuccessViewProps {
  completedOrder: CompletedOrder;
  cartItems: CartItem[];
  totalAmount: number;
  finalTotal: number;
  shippingInfo: ShippingInfo;
  businessName: string;
  businessRuc?: string;
  businessAddress?: string;
  businessCity?: string;
  businessLogoUrl?: string;
  email: string;
  receiptRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  showConfetti: boolean;
  onDownloadTicket: () => void;
  onClose: () => void;
  slug: string;
}

export function CheckoutSuccessView({
  completedOrder,
  cartItems,
  totalAmount,
  finalTotal,
  shippingInfo,
  businessName,
  businessRuc,
  businessAddress,
  businessCity,
  businessLogoUrl,
  email,
  receiptRef,
  loading,
  showConfetti,
  onDownloadTicket,
  onClose,
  slug,
}: CheckoutSuccessViewProps) {
  const router = useRouter();

  const receiptItems: ReceiptItem[] = cartItems.map((item) => ({
    label: item.name + (item.quantity > 1 ? ` x${item.quantity}` : ''),
    value: Number(item.secondPrice || item.price) * (item.quantity || 1),
  }));

  receiptItems.push({
    label: 'Costo de envio',
    value: shippingInfo.cost,
  });

  return createPortal(
    <>
      <Confetti show={showConfetti} particleCount={80} duration={4000} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `,
        }}
      />
      <div className={styles.checkoutOverlay} onClick={onClose}>
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
          {/* Success Header */}
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
                background: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* SVG inline — Material Symbols no funciona en html-to-image */}
              <svg width={32} height={32} viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" />
              </svg>
            </div>
            <h2 style={{ margin: 0, textAlign: 'center', fontSize: '22px', fontWeight: '800' }}>
              ¡Pago Exitoso!
            </h2>
            <p
              style={{
                margin: 0,
                color: 'var(--md-sys-color-on-surface-variant)',
                textAlign: 'center',
                fontSize: '14px',
              }}
            >
              Tu pedido ha sido procesado correctamente
            </p>
          </div>

          {/* Scrollable Receipt Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              ref={receiptRef as React.Ref<HTMLDivElement>}
              style={{ width: '100%', padding: '4px' }}
            >
              <Receipt
                businessName={businessName}
                businessRuc={businessRuc}
                businessAddress={businessAddress}
                logoUrl={businessLogoUrl}
                items={receiptItems}
                totalLabel="TOTAL"
                totalAmount={finalTotal}
                currency="S/"
                orderNumber={completedOrder.orderNumber}
                paymentMethod={completedOrder.paymentMethod}
                customerEmail={email}
                customerDni={shippingInfo.dni}
                customerPhone={shippingInfo.phone}
                shippingType={
                  shippingInfo.courier === 'recojo'
                    ? 'pickup'
                    : shippingInfo.courier === 'urbano_agencia'
                      ? 'agency'
                      : 'delivery'
                }
                shippingAddress={
                  shippingInfo.courier === 'recojo'
                    ? [businessAddress, businessCity].filter(Boolean).join(', ')
                    : shippingInfo.courier === 'urbano_agencia'
                      ? [
                          shippingInfo.agency,
                          shippingInfo.district,
                          shippingInfo.province,
                          shippingInfo.department,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : [
                          shippingInfo.address,
                          shippingInfo.district,
                          shippingInfo.province,
                          shippingInfo.department,
                        ]
                          .filter(Boolean)
                          .join(', ')
                }
              />
            </div>
          </div>

          {/* Fixed Action Footer */}
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
              <Button
                variant="filled"
                onClick={onDownloadTicket}
                disabled={loading}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  background: loading ? '#6B7280' : '#0061A4',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Descargando imagen...
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon size={20}>download</Icon>
                    Descargar Ticket (PNG)
                  </span>
                )}
              </Button>

              {completedOrder?.trackingToken && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    onClose();
                    router.push(getBusinessPath(slug, `/order/${completedOrder.trackingToken}`));
                  }}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  <Icon size={20}>search</Icon>
                  Ver mi Pedido
                </Button>
              )}
              <Button
                variant="text"
                onClick={onClose}
                style={{ width: '100%', borderRadius: '12px' }}
              >
                Continuar en la tienda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
