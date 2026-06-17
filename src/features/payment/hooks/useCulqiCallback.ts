'use client';

import type { ShippingInfo } from '@/app/[slug]/components/Checkout';
import type { CartItem } from '@/features/storage/context/CartContext';
import { chargePayment } from '@/shared/payments/paymentApi';
import { posthog } from 'posthog-js';
import { useEffect } from 'react';

// ─── Límites de métodos de pago ─────────────────────────────────────────────
// Yape tiene un tope de S/ 950 para pagos en comercios (según validación
// del propio Culqi Checkout v4). Montos mayores a 950 son rechazados por
// Culqi con error "invalid_number" en el parámetro amount.
// Fuente: error real de Culqi Checkout v4 + docs Culqi.
const YAPE_LIMITS = {
  min: 6.0,
  max: 950.0,
} as const;

export { YAPE_LIMITS };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentInstructionsData {
  culqiOrderId: string;
  paymentMethod: string;
  paymentCode: string | null;
  qrUrl: string | null;
  expirationDate: string | null;
}

export interface CustomerAuth {
  provider: string;
  authId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface UseCulqiCallbackOptions {
  culqiReady: boolean;
  finalTotal: number;
  businessId: string;
  cartItems: [CartItem, ...CartItem[]];
  email: string;
  shippingInfo: ShippingInfo;
  businessAddress?: string;
  businessCity?: string;
  slug: string;
  customerAuth: CustomerAuth | null;
  onCulqiProcessingChange: (processing: boolean) => void;
  onPaymentProcessingChange: (processing: boolean) => void;
  paymentGuardRef: React.MutableRefObject<boolean>;
  culqiCallbackGuardRef: React.MutableRefObject<boolean>;
  onOrderPaid: (order: {
    orderNumber: string;
    paymentMethod: string;
    trackingToken?: string;
  }) => void;
  onPaymentInstructions: (instructions: PaymentInstructionsData) => void;
  onError: (message: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Registers the window.culqi callback in a useEffect.
 *
 * Handles both Culqi.order (async payments like PagoEfectivo, Billetera, Cuotéalo)
 * and Culqi.token (card / Yape) flows, including charge API calls, analytics,
 * guard ref management, and cleanup on unmount.
 */
export function useCulqiCallback({
  culqiReady,
  finalTotal,
  businessId,
  cartItems,
  email,
  shippingInfo,
  businessAddress,
  businessCity,
  slug,
  customerAuth,
  onCulqiProcessingChange,
  onPaymentProcessingChange,
  paymentGuardRef,
  culqiCallbackGuardRef,
  onOrderPaid,
  onPaymentInstructions,
  onError,
}: UseCulqiCallbackOptions): void {
  const primaryProduct = cartItems[0];

  useEffect(() => {
    if (!culqiReady) return;

    window.culqi = async function () {
      if (culqiCallbackGuardRef.current) return;

      if (window.Culqi?.order) {
        culqiCallbackGuardRef.current = true;
        const order = window.Culqi.order;
        onCulqiProcessingChange(false);

        if (order.status === 'paid') {
          // ── Card payment completed through the order ──
          const paymentMethod = 'Tarjeta';
          const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
          onPaymentProcessingChange(true);
          if (window.Culqi?.close) window.Culqi.close();

          try {
            const paymentResult = await chargePayment({
              culqiOrderId: order.id,
              amount: order.amount || Math.round(finalTotal * 100),
              currency: 'PEN',
              email,
              phone: shippingInfo.phone,
              businessId,
              productId: primaryProduct.id,
              ...(customerAuth
                ? {
                    customerAuth: {
                      provider: customerAuth.provider,
                      authId: customerAuth.authId,
                      name: customerAuth.name,
                      email: customerAuth.email,
                      avatarUrl: customerAuth.avatarUrl,
                    },
                  }
                : {}),
              metadata: {
                orderNumber,
                dni: shippingInfo.dni,
                cartItems: cartItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  quantity: item.quantity,
                  price: (item as Record<string, unknown>).secondPrice || item.price,
                })),
                shippingInfo: {
                  ...shippingInfo,
                  address:
                    shippingInfo.courier === 'recojo' ? businessAddress : shippingInfo.address,
                  district:
                    shippingInfo.courier === 'recojo' ? businessCity : shippingInfo.district,
                  dni: shippingInfo.dni,
                },
              },
            });

            onOrderPaid({
              orderNumber,
              paymentMethod,
              trackingToken: paymentResult?.payment?.trackingToken as string | undefined,
            });

            try {
              if (typeof posthog?.capture === 'function') {
                posthog.capture('order_created', {
                  orderId: orderNumber,
                  amount: finalTotal,
                  businessSlug: slug,
                });
                posthog.capture('payment_completed', {
                  paymentId: order.id,
                  amount: finalTotal,
                  method: paymentMethod,
                });
              }
            } catch {
              // Analytics should never block user flow
            }
          } catch (error) {
            console.error('Order card payment failed:', error);
            const message =
              error instanceof Error ? error.message : 'Hubo un problema al procesar tu pago.';
            onError(message);
            paymentGuardRef.current = false;
            culqiCallbackGuardRef.current = false;
            onPaymentProcessingChange(false);
            if (window.Culqi?.close) window.Culqi.close();
            return;
          }

          onPaymentProcessingChange(false);
          if (window.Culqi?.close) window.Culqi.close();
        } else {
          // ── Async payment method (PagoEfectivo, Billetera Móvil, Cuotéalo) ──
          onPaymentInstructions({
            culqiOrderId: order.id,
            paymentMethod: order.payment_method || 'pago_efectivo',
            paymentCode: order.cip_code || null,
            qrUrl: order.action?.qr?.image_url || null,
            expirationDate: order.expiration_date
              ? new Date(order.expiration_date * 1000).toISOString()
              : null,
          });
          if (window.Culqi?.close) window.Culqi.close();
        }
        return;
      }

      if (window.Culqi?.token) {
        culqiCallbackGuardRef.current = true;
        const token = window.Culqi.token.id;
        const tokenType = window.Culqi.token.type || 'card';

        const paymentMethod = tokenType === 'yape' || token.startsWith('ype_') ? 'Yape' : 'Tarjeta';
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

        onPaymentProcessingChange(true);
        if (window.Culqi?.close) window.Culqi.close();

        try {
          const paymentResult = await chargePayment({
            token,
            amount: Math.round(finalTotal * 100),
            currency: 'PEN',
            email,
            phone: shippingInfo.phone,
            businessId,
            productId: primaryProduct.id,
            ...(customerAuth
              ? {
                  customerAuth: {
                    provider: customerAuth.provider,
                    authId: customerAuth.authId,
                    name: customerAuth.name,
                    email: customerAuth.email,
                    avatarUrl: customerAuth.avatarUrl,
                  },
                }
              : {}),
            metadata: {
              orderNumber,
              dni: shippingInfo.dni,
              cartItems: cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: (item as Record<string, unknown>).secondPrice || item.price,
              })),
              shippingInfo: {
                ...shippingInfo,
                address: shippingInfo.courier === 'recojo' ? businessAddress : shippingInfo.address,
                district: shippingInfo.courier === 'recojo' ? businessCity : shippingInfo.district,
                dni: shippingInfo.dni,
              },
            },
          });

          // SEGURIDAD EXTRA: Verificar que el cargo en Culqi también fue exitoso
          const chargeStatus = paymentResult?.charge?.status;
          if (chargeStatus !== 'paid') {
            throw new Error('El pago no fue completado. Estado: ' + chargeStatus);
          }

          if (!paymentResult?.charge?.id) {
            throw new Error('No se recibió confirmación del pago');
          }

          onOrderPaid({
            orderNumber,
            paymentMethod,
            trackingToken: paymentResult?.payment?.trackingToken as string | undefined,
          });

          try {
            if (typeof posthog?.capture === 'function') {
              posthog.capture('order_created', {
                orderId: orderNumber,
                amount: finalTotal,
                businessSlug: slug,
              });
              posthog.capture('payment_completed', {
                paymentId: paymentResult?.charge?.id ?? token,
                amount: finalTotal,
                method: paymentMethod,
              });
            }
          } catch {
            // Analytics should never block user flow
          }

          if (window.Culqi && window.Culqi.close) window.Culqi.close();
        } catch (error) {
          console.error('API call failed:', error);
          const message =
            error instanceof Error ? error.message : 'Hubo un problema al procesar tu pago.';
          onError(message);
          paymentGuardRef.current = false;
          culqiCallbackGuardRef.current = false;
          onPaymentProcessingChange(false);
          return;
        }
      } else {
        const culqiError = window.Culqi?.error;
        console.error('[Culqi] Error:', culqiError);

        if (culqiError?.code === 'invalid_number' && culqiError?.param === 'amount') {
          const exceedAmount = finalTotal > YAPE_LIMITS.max;
          if (exceedAmount) {
            onError(
              `Yape solo permite pagos hasta S/ ${YAPE_LIMITS.max.toFixed(2)}. ` +
                `Para esta compra de S/ ${finalTotal.toFixed(2)}, usá tarjeta de débito o crédito.`,
            );
          } else {
            onError(culqiError?.user_message || 'El monto del pago no es válido para este método.');
          }
        } else {
          const errorMsg =
            culqiError?.user_message ||
            culqiError?.merchant_message ||
            'Hubo un problema con el pago. Intenta nuevamente.';
          onError(errorMsg);
        }

        culqiCallbackGuardRef.current = false;
      }

      paymentGuardRef.current = false;
      onCulqiProcessingChange(false);
      onPaymentProcessingChange(false);
    };

    return () => {
      window.culqi = undefined as unknown as () => void;
    };
  }, [
    culqiReady,
    finalTotal,
    businessId,
    cartItems,
    email,
    shippingInfo,
    businessAddress,
    businessCity,
    // NOTE: slug, customerAuth, refs, and callbacks are intentionally omitted
    // to match the original dependency behavior — they are stable or don't change
    // during a single checkout flow.
  ]);
}
