'use client';

import type { CartItem } from '@/features/storage/context/CartContext';
import { posthog } from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShippingInfo } from '../Checkout';
import { loadCulqiScript } from '@/shared/payments/culqiScript';
import { chargePayment, createOrder } from '@/shared/payments/paymentApi';

// ─── Límites de métodos de pago ─────────────────────────────────────────
// Yape tiene un tope de S/ 950 para pagos en comercios (según validación
// del propio Culqi Checkout v4). Montos mayores a 950 son rechazados por
// Culqi con error "invalid_number" en el parámetro amount.
// Fuente: error real de Culqi Checkout v4 + docs Culqi.
const YAPE_LIMITS = {
  min: 6.0,
  max: 950.0,
} as const;

export { YAPE_LIMITS };

interface PaymentInstructionsData {
  culqiOrderId: string;
  paymentMethod: string;
  paymentCode: string | null;
  qrUrl: string | null;
  expirationDate: string | null;
}

interface CustomerAuth {
  provider: string;
  authId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface UsePaymentGatewayOptions {
  culqiPublicKey?: string;
  businessId: string;
  businessName: string;
  cartItems: [CartItem, ...CartItem[]];
  shippingInfo: ShippingInfo;
  email: string;
  customerAuth: CustomerAuth | null;
  finalTotal: number;
  slug: string;
  businessAddress?: string;
  businessCity?: string;
  onOrderPaid: (order: {
    orderNumber: string;
    paymentMethod: string;
    trackingToken?: string;
  }) => void;
  onPaymentInstructions: (instructions: PaymentInstructionsData) => void;
  onError: (message: string) => void;
}

export interface UsePaymentGatewayReturn {
  culqiReady: boolean;
  isCulqiProcessing: boolean;
  isPaymentProcessing: boolean;
  handlePayment: () => Promise<void>;
}

export function usePaymentGateway({
  culqiPublicKey,
  businessId,
  businessName,
  cartItems,
  shippingInfo,
  email,
  customerAuth,
  finalTotal,
  slug,
  businessAddress,
  businessCity,
  onOrderPaid,
  onPaymentInstructions,
  onError,
}: UsePaymentGatewayOptions): UsePaymentGatewayReturn {
  const [culqiReady, setCulqiReady] = useState(false);
  const [isCulqiProcessing, setIsCulqiProcessing] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const paymentGuardRef = useRef(false);
  const culqiCallbackGuardRef = useRef(false);

  const primaryProduct = cartItems[0];

  // Load Culqi Script (v4) — using shared promise-cached loader
  useEffect(() => {
    if (!culqiPublicKey || typeof window === 'undefined') return;

    // Synchronous path: when Culqi is already loaded (tests, other callers)
    if (window.Culqi) {
      window.Culqi.publicKey = culqiPublicKey;
      setCulqiReady(true);
      return;
    }

    loadCulqiScript(culqiPublicKey).then(() => setCulqiReady(true));
  }, [culqiPublicKey]);

  // Culqi Callback
  useEffect(() => {
    if (!culqiReady) return;

    window.culqi = async function () {
      if (culqiCallbackGuardRef.current) return;

      if (window.Culqi?.order) {
        culqiCallbackGuardRef.current = true;
        const order = window.Culqi.order;
        setIsCulqiProcessing(false);

        if (order.status === 'paid') {
          // 💳 Card payment completed through the order — record the payment
          const paymentMethod = 'Tarjeta';
          const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
          setIsPaymentProcessing(true);
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
                  price: item.secondPrice || item.price,
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
            setIsPaymentProcessing(false);
            if (window.Culqi?.close) window.Culqi.close();
            return;
          }

          setIsPaymentProcessing(false);
          if (window.Culqi?.close) window.Culqi.close();

          // Success alert is handled by the orchestrator via onOrderPaid
        } else {
          // Async payment method (PagoEfectivo, Billetera Móvil, Cuotéalo)
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

        // Mostrar indicador de procesamiento mientras se verifica el pago
        setIsPaymentProcessing(true);
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
                price: item.secondPrice || item.price,
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

          // SEGURIDAD EXTRA: Verificar que el cargo en Culqi también fue exitoso
          const chargeStatus = paymentResult?.charge?.status;
          if (chargeStatus !== 'paid') {
            throw new Error('El pago no fue completado. Estado: ' + chargeStatus);
          }

          // Verificar que tenemos un charge ID válido
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
          setIsPaymentProcessing(false);
          return;
        }

        // Success alert is handled by the orchestrator via onOrderPaid
      } else {
        const culqiError = window.Culqi?.error;
        console.error('[Culqi] Error:', culqiError);

        // Friendly error when Yape rejects amount > S/ 950
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
      setIsCulqiProcessing(false);
      setIsPaymentProcessing(false);
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
  ]);

  const handlePayment = useCallback(async () => {
    // ── GUARD: evita doble click incluso antes de React render ──
    if (paymentGuardRef.current) return;

    if (shippingInfo.dni.length !== 8) {
      onError('Por favor, ingresá un DNI válido de 8 dígitos para tu comprobante.');
      return;
    }

    if (!email || !email.includes('@')) {
      onError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (!window.Culqi || !culqiReady) {
      onError('Cargando pasarela de pagos...');
      return;
    }

    paymentGuardRef.current = true;
    culqiCallbackGuardRef.current = false;
    setIsCulqiProcessing(true);

    try {
      const Culqi = window.Culqi;
      if (!Culqi) {
        throw new Error('Culqi no está disponible');
      }

      // If amount exceeds Yape limit, create order for async payment methods first
      let orderId: string | null = null;
      if (finalTotal > YAPE_LIMITS.max) {
        try {
          const orderData = await createOrder({
            amount: Math.round(finalTotal * 100),
            email: email || 'cliente@store-lite.com',
            businessId,
            description: `Compra - ${cartItems.length} productos`,
          });
          orderId = orderData.culqiOrderId;
        } catch (e) {
          console.warn('[Checkout] Order creation failed, falling back to charge-only flow:', e);
        }
      }

      // amount y order son MUTUAMENTE EXCLUYENTES en Culqi Checkout v4
      // Si pasamos order (órdenes de pago async), NO podemos pasar amount
      const settings: Record<string, unknown> = {
        title: businessName,
        currency: 'PEN',
        description: `Compra en linea - ${cartItems.length} productos`,
      };
      if (orderId) {
        settings.order = orderId;
      } else {
        settings.amount = Math.round(finalTotal * 100);
      }
      Culqi.settings(settings);

      Culqi.options({
        lang: 'auto',
        installments: true,
        modal: true,
        paymentMethods: {
          tarjeta: true,
          yape: true,
          billetera: true,
          bancaMovil: true,
          agente: true,
        },
      });

      // La advertencia de Yape se muestra inline en el footer del checkout
      // (antes del botón de pago) para que el usuario la vea antes de hacer clic

      Culqi.open();

      // El loading se mantiene hasta que Culqi responda (success o error)
      // El callback de Culqi se encarga de setear loading(false)
    } catch (error) {
      console.error('Culqi open error:', error);
      onError('No se pudo abrir la pasarela de pagos.');
      paymentGuardRef.current = false;
      setIsCulqiProcessing(false);
    }
  }, [culqiReady, finalTotal, businessId, businessName, cartItems, email, shippingInfo, onError]);

  return {
    culqiReady,
    isCulqiProcessing,
    isPaymentProcessing,
    handlePayment,
  };
}
