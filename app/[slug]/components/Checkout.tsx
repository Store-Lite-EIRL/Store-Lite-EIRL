'use client';

import { PERU_LOCATIONS } from '@/core/logistics/peruLocations';
import { URBANO_AGENCIES } from '@/core/logistics/urbanoAgencies';
import type { CartItem } from '@/features/storage/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { AlertSnackbar, Confetti, Icon, Receipt } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Select } from '@/shared/components/ui/inputs/Select';
import { getBusinessPath } from '@/shared/utils/url';
import type { AuthTokenResponse } from '@supabase/supabase-js';
import { toBlob } from 'html-to-image';
import { useParams, useRouter } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Checkout.module.css';

// ─── Límites de métodos de pago ─────────────────────────────────────────
// Yape tiene un tope propio para compras por internet (S/ 1,000) que es
// menor al tope de Culqi Cargos Únicos (S/ 2,000). Usamos el menor.
// Fuente: centro de ayuda Yape + docs Culqi Checkout v4
const YAPE_LIMITS = {
  min: 6.0,
  max: 1000.0,
} as const;

interface CheckoutProps {
  totalAmount: number;
  cartItems: [CartItem, ...CartItem[]];
  culqiPublicKey?: string;
  onSuccess: () => void;
  onCancel: () => void;
  // Props para el ticket y recojo
  businessName?: string;
  businessRuc?: string;
  businessAddress?: string;
  businessCity?: string;
  businessLogoUrl?: string;
  // Props para el backend
  businessId: string;
}

export type Courier = 'urbano_agencia' | 'urbano_domicilio' | 'recojo';

export interface ShippingInfo {
  courier: Courier;
  department: string;
  province: string;
  district: string;
  agency?: string;
  address?: string;
  reference?: string;
  phone: string;
  dni: string;
  cost: number;
}

export default function Checkout({
  totalAmount,
  cartItems,
  culqiPublicKey,
  onSuccess,
  onCancel,
  businessName = 'Mi Tienda',
  businessRuc,
  businessAddress,
  businessCity,
  businessLogoUrl,
  businessId,
}: CheckoutProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [culqiReady, setCulqiReady] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCulqiProcessing, setIsCulqiProcessing] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    paymentMethod: string;
    trackingToken?: string;
  } | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<{
    culqiOrderId: string;
    paymentMethod: string;
    paymentCode: string | null;
    qrUrl: string | null;
    expirationDate: string | null;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const paymentGuardRef = useRef(false);
  const culqiCallbackGuardRef = useRef(false);

  const handleDownloadTicket = async () => {
    if (!receiptRef.current) return;

    try {
      setLoading(true);

      // Esperar a que finalice la carga de recursos (fuentes, imágenes, SVGs)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Alta resolución para ticket nítido usando toBlob
      // skipFonts evita que html-to-image intente leer cssRules de stylesheets
      // cross-origin (Google Fonts, Material Symbols) que disparan SecurityError CORS.
      const blob = await toBlob(receiptRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 4,
        quality: 1,
        cacheBust: true,
        skipFonts: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        // Filtrar nodos de fuentes externas como fallback adicional
        filter: (node: Node) => {
          if (node instanceof HTMLLinkElement) {
            const href = node.getAttribute('href') || '';
            // Excluir hojas de estilo de dominios externos (Google Fonts, CDNs, etc.)
            if (href.startsWith('http') && !href.includes(window.location.hostname)) {
              return false;
            }
          }
          return true;
        },
      });

      if (!blob) {
        throw new Error('No se pudo generar la imagen');
      }

      const orderNumber = completedOrder?.orderNumber || 'compra';

      // Upload to Storage
      const supabase = createClient();

      const fileName = `${orderNumber}.png`;
      const { error: uploadError } = await supabase.storage.from('tickets').upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('tickets').getPublicUrl(fileName);
        await fetch('/api/payment/update-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber, ticketUrl: publicUrl }),
        });
      }

      // Local download
      const link = document.createElement('a');
      link.download = `ticket-${orderNumber}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();

      setAlert({
        open: true,
        description: '¡Ticket descargado exitosamente!',
        color: 'success',
        icon: 'download_done',
      });
    } catch (err) {
      console.error('Error at handleDownloadTicket:', err);
      setAlert({
        open: true,
        description: 'No se pudo generar el ticket. Por favor, intenta nuevamente.',
        color: 'error',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to close Culqi modal when showing receipt
  useEffect(() => {
    if (showReceipt && window.Culqi && window.Culqi.close) {
      window.Culqi.close();
    }
  }, [showReceipt]);

  // Shipping State
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    courier: 'urbano_domicilio',
    department: '',
    province: '',
    district: '',
    agency: '', // Inicializar para evitar uncontrolled -> controlled
    address: '', // Inicializar para evitar uncontrolled -> controlled
    reference: '', // Inicializar para evitar uncontrolled -> controlled
    phone: '',
    dni: '',
    cost: 10.0, // Costo base para domicilio
  });

  // Payment State
  const [email, setEmail] = useState('');

  // ─── Google Customer Auth ───
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  interface CustomerAuth {
    provider: string;
    authId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }
  const [customerAuth, setCustomerAuth] = useState<CustomerAuth | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAwaitingAuth, setIsAwaitingAuth] = useState(false);

  // Domain for the customer auth popup
  const AUTH_ORIGIN =
    process.env.NEXT_PUBLIC_AUTH_ORIGIN ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  // ─── Detect existing Supabase session (from chat Google auth) ───
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.app_metadata?.provider === 'google') {
          const user = session.user;
          setCustomerAuth({
            provider: 'google',
            authId: user.id,
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url || null,
          });
          // Pre-fill email but user can still edit it
          setEmail(user.email || '');
        }
      } catch (err) {
        console.error('[Checkout] Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [supabase]);

  // ─── Listen for auth tokens from popup ───
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== AUTH_ORIGIN) return;

      if (event.data?.type === 'AUTH_SUCCESS' && event.data?.slug === slug) {
        setIsAwaitingAuth(false);
        supabase.auth
          .setSession({
            access_token: event.data.access_token,
            refresh_token: event.data.refresh_token,
          })
          .then((result: AuthTokenResponse) => {
            const { data } = result;
            if (data.session?.user?.app_metadata?.provider === 'google') {
              const user = data.session.user;
              setCustomerAuth({
                provider: 'google',
                authId: user.id,
                name: user.user_metadata?.full_name || '',
                email: user.email || '',
                avatarUrl: user.user_metadata?.avatar_url || null,
              });
              setEmail(user.email || '');
            }
          })
          .catch((err: unknown) => {
            console.error('[Checkout] Error setting session:', err);
          });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [slug, supabase, AUTH_ORIGIN]);

  // ─── Open Google sign-in popup ───
  const handleGoogleSignIn = useCallback(() => {
    const popupUrl = new URL(`${AUTH_ORIGIN}/auth/customer`);
    popupUrl.searchParams.set('slug', slug);
    popupUrl.searchParams.set('name', businessName);
    if (businessLogoUrl) popupUrl.searchParams.set('logo', businessLogoUrl);
    popupUrl.searchParams.set('origin', window.location.origin);

    const popup = window.open(popupUrl.toString(), 'customer-auth', 'width=600,height=700,popup=1');

    if (!popup || popup.closed) {
      console.warn('[Checkout] Popup was blocked');
      return;
    }

    setIsAwaitingAuth(true);

    // Poll for popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsAwaitingAuth(false);
      }
    }, 500);
  }, [slug, businessName, businessLogoUrl, AUTH_ORIGIN]);

  // Alert State
  const [alert, setAlert] = useState<{
    open: boolean;
    description: string;
    color: 'primary' | 'success' | 'error' | 'warning';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  // Derived total
  const finalTotal = totalAmount + shippingInfo.cost;
  const primaryProduct = cartItems[0];

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load Culqi Script (v4)
  useEffect(() => {
    if (!culqiPublicKey || typeof window === 'undefined') return;

    if (window.Culqi) {
      window.Culqi.publicKey = culqiPublicKey;
      setCulqiReady(true);
      return;
    }

    const scriptId = 'culqi-checkout-v4-js';
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.culqi.com/js/v4';
    script.async = true;
    script.onload = () => {
      if (window.Culqi) {
        window.Culqi.publicKey = culqiPublicKey;
      }
      setCulqiReady(true);
    };
    document.head.appendChild(script);
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
            const idempotencyKey = `charge-${order.id}`;
            const response = await fetch('/api/payment/charge', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey,
              },
              body: JSON.stringify({
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
              }),
            });

            const paymentResult = await response.json();

            if (!response.ok || !paymentResult?.success) {
              throw new Error(
                paymentResult?.details ||
                  paymentResult?.error ||
                  'No se pudo procesar el pago con tarjeta.',
              );
            }

            setCompletedOrder({
              orderNumber,
              paymentMethod,
              trackingToken: paymentResult?.payment?.trackingToken,
            });
            setShowReceipt(true);
            setShowConfetti(true);

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

            setAlert({
              open: true,
              description: message,
              color: 'error',
              icon: 'error',
            });
            paymentGuardRef.current = false;
            culqiCallbackGuardRef.current = false;
            setLoading(false);
            setIsPaymentProcessing(false);
            if (window.Culqi?.close) window.Culqi.close();
            return;
          }

          setIsPaymentProcessing(false);
          if (window.Culqi?.close) window.Culqi.close();

          setAlert({
            open: true,
            description: '¡Pago procesado exitosamente!',
            color: 'success',
            icon: 'check_circle',
          });
        } else {
          // Async payment method (PagoEfectivo, Billetera Móvil, Cuotéalo)
          setPaymentInstructions({
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
          const idempotencyKey = `charge-${token}`;
          const response = await fetch('/api/payment/charge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify({
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
            }),
          });

          const paymentResult = await response.json();

          // SEGURIDAD: Verificar que el pago fue exitoso en el servidor
          if (!response.ok || !paymentResult?.success) {
            throw new Error(
              paymentResult?.details ||
                paymentResult?.error ||
                'No se pudo procesar el pago con Culqi.',
            );
          }

          // SEGURIDAD EXTRA: Verificar que el cargo en Culqi también fue exitoso
          const chargeStatus = paymentResult?.charge?.status;
          if (chargeStatus !== 'paid') {
            throw new Error('El pago no fue completado. Estado: ' + chargeStatus);
          }

          // Verificar que tenemos un charge ID válido
          if (!paymentResult?.charge?.id) {
            throw new Error('No se recibió confirmación del pago');
          }

          setCompletedOrder({
            orderNumber,
            paymentMethod,
            trackingToken: paymentResult?.payment?.trackingToken,
          });
          setShowReceipt(true);
          setShowConfetti(true);

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

          setAlert({
            open: true,
            description: message,
            color: 'error',
            icon: 'error',
          });
          paymentGuardRef.current = false;
          culqiCallbackGuardRef.current = false;
          setLoading(false);
          setIsPaymentProcessing(false);
          return;
        }

        setAlert({
          open: true,
          description: '¡Pago procesado exitosamente!',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        const culqiError = window.Culqi?.error;
        const errorMsg =
          culqiError?.user_message ||
          culqiError?.merchant_message ||
          'Hubo un problema con el pago. Intenta nuevamente.';
        console.error('[Culqi] Error:', culqiError);
        setAlert({
          open: true,
          description: errorMsg,
          color: 'error',
          icon: 'error',
        });
        culqiCallbackGuardRef.current = false;
      }
      paymentGuardRef.current = false;
      setLoading(false);
      setIsCulqiProcessing(false);
      setIsPaymentProcessing(false);
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

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShippingInfo((prev) => ({
      ...prev,
      department: e.target.value,
      province: '',
      district: '',
      agency: '',
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShippingInfo((prev) => ({
      ...prev,
      province: e.target.value,
      district: '',
      agency: '',
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShippingInfo((prev) => ({
      ...prev,
      district: e.target.value,
      agency: '',
    }));
  };

  const handleCourierChange = (type: Courier) => {
    setShippingInfo((prev) => ({
      ...prev,
      courier: type,
      cost: type === 'recojo' ? 0 : type === 'urbano_agencia' ? 7.5 : 10.0,
      // Limpiar campos si es recojo
      department: type === 'recojo' ? '' : prev.department,
      province: type === 'recojo' ? '' : prev.province,
      district: type === 'recojo' ? '' : prev.district,
      address: type === 'recojo' ? '' : prev.address,
      agency: type === 'recojo' ? '' : prev.agency,
    }));
  };

  // Select Options
  const departments = PERU_LOCATIONS.map((d) => ({ value: d.name, label: d.name }));
  const provinces =
    PERU_LOCATIONS.find((d) => d.name === shippingInfo.department)?.provinces.map((p) => ({
      value: p.name,
      label: p.name,
    })) || [];
  const districts =
    PERU_LOCATIONS.find((d) => d.name === shippingInfo.department)
      ?.provinces.find((p) => p.name === shippingInfo.province)
      ?.districts.map((d) => ({ value: d.name, label: d.name })) || [];

  const availableAgencies = URBANO_AGENCIES.filter((agency) => {
    const dept = PERU_LOCATIONS.find((d) => d.name === shippingInfo.department);
    const prov = dept?.provinces.find((p) => p.name === shippingInfo.province);
    const dist = prov?.districts.find((d) => d.name === shippingInfo.district);
    return agency.districtId === dist?.id;
  }).map((a) => ({ value: a.name, label: a.name }));

  const handleNextStep = () => {
    if (step === 1) {
      if (shippingInfo.courier === 'recojo') {
        if (shippingInfo.phone.length !== 9) {
          setAlert({
            open: true,
            description: 'Por favor, ingresá un teléfono de contacto de 9 dígitos.',
            color: 'warning',
            icon: 'phone',
          });
          return;
        }
      } else {
        if (
          !shippingInfo.department ||
          !shippingInfo.province ||
          !shippingInfo.district ||
          shippingInfo.phone.length !== 9
        ) {
          setAlert({
            open: true,
            description:
              'Por favor, completá todos los campos de ubicación y un teléfono de 9 dígitos.',
            color: 'warning',
            icon: 'contact_support',
          });
          return;
        }
        if (shippingInfo.courier === 'urbano_agencia' && !shippingInfo.agency) {
          setAlert({
            open: true,
            description: 'Seleccioná una agencia Urbano para el envío.',
            color: 'warning',
            icon: 'location_on',
          });
          return;
        }
        if (shippingInfo.courier === 'urbano_domicilio' && !shippingInfo.address?.trim()) {
          setAlert({
            open: true,
            description: 'Ingresá la dirección exacta de entrega a domicilio.',
            color: 'warning',
            icon: 'home',
          });
          return;
        }
      }
      setStep(2);
    }
  };

  const handlePayment = async () => {
    // ── GUARD: evita doble click incluso antes de React render ──
    if (paymentGuardRef.current) return;

    if (shippingInfo.dni.length !== 8) {
      setAlert({
        open: true,
        description: 'Por favor, ingresá un DNI válido de 8 dígitos para tu comprobante.',
        color: 'warning',
        icon: 'badge',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      setAlert({
        open: true,
        description: 'Por favor, ingresa un correo electrónico válido.',
        color: 'warning',
        icon: 'alternate_email',
      });
      return;
    }

    if (!window.Culqi || !culqiReady) {
      setAlert({
        open: true,
        description: 'Cargando pasarela de pagos...',
        color: 'primary',
        icon: 'hourglass_top',
      });
      return;
    }

    paymentGuardRef.current = true;
    culqiCallbackGuardRef.current = false;
    setIsCulqiProcessing(true);
    const checkoutAttemptId = crypto.randomUUID();

    try {
      const Culqi = window.Culqi;
      if (!Culqi) {
        throw new Error('Culqi no está disponible');
      }

      // If amount exceeds Yape limit, create order for async payment methods first
      let orderId: string | null = null;
      if (finalTotal > YAPE_LIMITS.max) {
        try {
          const orderResponse = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': `order-${checkoutAttemptId}`,
            },
            body: JSON.stringify({
              amount: Math.round(finalTotal * 100),
              email: email || 'cliente@store-lite.com',
              businessId,
              description: `Compra - ${cartItems.length} productos`,
            }),
          });

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            orderId = orderData.culqiOrderId;
          }
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

      Culqi.open();

      // El loading se mantiene hasta que Culqi responda (success o error)
      // El callback de Culqi se encarga de setear loading(false)
    } catch (error) {
      console.error('Culqi open error:', error);
      setAlert({
        open: true,
        description: 'No se pudo abrir la pasarela de pagos.',
        color: 'error',
        icon: 'sync_problem',
      });
      paymentGuardRef.current = false;
      setIsCulqiProcessing(false);
    }
  };

  if (!mounted) return null;

  // SUCCESS VIEW
  if (showReceipt && completedOrder) {
    const receiptItems = cartItems.map((item) => ({
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
        <div
          className={styles.checkoutOverlay}
          onClick={() => {
            setShowReceipt(false);
            onSuccess();
          }}
        >
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
              <div ref={receiptRef} style={{ width: '100%', padding: '4px' }}>
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
                  onClick={handleDownloadTicket}
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
                      setShowReceipt(false);
                      onSuccess();
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
                  onClick={() => {
                    setShowReceipt(false);
                    onSuccess();
                  }}
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

  // PAYMENT INSTRUCTIONS OVERLAY (for async methods)
  if (paymentInstructions) {
    const isPagoEfectivo = paymentInstructions.paymentMethod === 'pago_efectivo';
    const isBilleteraMovil = paymentInstructions.paymentMethod === 'billetera_movil';
    const isCuotealo = paymentInstructions.paymentMethod === 'cuotealo';

    const formatPaymentMethodName = (method: string) => {
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
    };

    const dismissInstructions = () => {
      setPaymentInstructions(null);
    };

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
                  setAlert({
                    open: true,
                    description:
                      'El pago se confirmará automáticamente. Revisá tu correo para más detalles.',
                    color: 'primary',
                    icon: 'info',
                  });
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
                onClick={dismissInstructions}
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
          onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        />
      </div>,
      document.body,
    );
  }

  // STANDARD CHECKOUT FLOW
  const isLoading = isCulqiProcessing || isPaymentProcessing;
  const loadingMessage = isPaymentProcessing
    ? {
        title: 'Procesando pago',
        subtitle: 'No cierres esta ventana ni vuelvas a pagar. Estamos confirmando la transaccion.',
      }
    : { title: 'Abriendo pasarela de pagos', subtitle: 'Serás redirigido a Culqi de forma segura' };

  return createPortal(
    <div className={styles.checkoutOverlay}>
      {/* Loading Overlay cuando se procesa el pago o se abre Culqi */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            borderRadius: '28px',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#0061A4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              {loadingMessage.title}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6B7280' }}>
              {loadingMessage.subtitle}
            </p>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `,
            }}
          />
        </div>
      )}
      <div className={styles.checkoutModal} onClick={(e) => e.stopPropagation()}>
        {/* Header with Back/Close Buttons */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            {step === 2 && (
              <button className={styles.backBtn} onClick={() => setStep(1)} disabled={isLoading}>
                <Icon>arrow_back</Icon>
              </button>
            )}
            <h2 className={styles.title}>
              {step === 1 ? 'Paso 1: ¿Cómo lo recibes?' : 'Paso 2: Confirmar Compra'}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel} disabled={isLoading}>
            <Icon>close</Icon>
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className={styles.stepperContainer}>
          <div className={`${styles.stepIndicator} ${step >= 1 ? styles.active : ''}`}>1</div>
          <div className={styles.stepLine} />
          <div className={`${styles.stepIndicator} ${step >= 2 ? styles.active : ''}`}>2</div>
        </div>

        {/* Main Form Body */}
        <div className={styles.body}>
          {step === 1 ? (
            <div className={styles.stepContent}>
              <div className={styles.orderMiniSummary}>
                <p>
                  Estas comprando <strong>{cartItems?.length || 0} productos</strong>
                </p>
                <p>
                  Subtotal: <strong>S/ {totalAmount.toFixed(2)}</strong>
                </p>
              </div>

              <div className={styles.courierToggle}>
                <button
                  className={`${styles.courierBtn} ${shippingInfo.courier === 'recojo' ? styles.courierActive : ''}`}
                  onClick={() => handleCourierChange('recojo')}
                >
                  <Icon>store</Icon>
                  <span>Tienda</span>
                </button>
                <button
                  className={`${styles.courierBtn} ${shippingInfo.courier === 'urbano_agencia' ? styles.courierActive : ''}`}
                  onClick={() => handleCourierChange('urbano_agencia')}
                >
                  <Icon>package_2</Icon>
                  <span>Agencia</span>
                </button>
                <button
                  className={`${styles.courierBtn} ${shippingInfo.courier === 'urbano_domicilio' ? styles.courierActive : ''}`}
                  onClick={() => handleCourierChange('urbano_domicilio')}
                >
                  <Icon>local_shipping</Icon>
                  <span>Domicilio</span>
                </button>
              </div>

              {shippingInfo.courier === 'recojo' ? (
                <div className={styles.pickupInfoCard}>
                  <div className={styles.pickupHeader}>
                    <Icon>location_on</Icon>
                    <span>Direccion del Local</span>
                  </div>
                  <p className={styles.pickupAddress}>
                    {businessAddress || 'Dirección no especificada'}
                  </p>
                  <p className={styles.pickupCity}>{businessCity || ''}</p>
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="tel"
                      placeholder="Tu Telefono de contacto (9 dígitos)"
                      value={shippingInfo.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 9)
                          setShippingInfo((prev) => ({ ...prev, phone: value }));
                      }}
                      className={`${styles.input} ${shippingInfo.phone.length > 0 && shippingInfo.phone.length !== 9 ? styles.inputError : ''}`}
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <Select
                        label="Departamento"
                        outlined
                        value={shippingInfo.department}
                        onChange={handleDepartmentChange}
                        options={departments}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <Select
                        label="Provincia"
                        outlined
                        value={shippingInfo.province}
                        onChange={handleProvinceChange}
                        options={provinces}
                        disabled={!shippingInfo.department}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <Select
                        label="Distrito"
                        outlined
                        value={shippingInfo.district}
                        onChange={handleDistrictChange}
                        options={districts}
                        disabled={!shippingInfo.province}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <input
                        type="tel"
                        placeholder="Telefono (9 dígitos)"
                        value={shippingInfo.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 9)
                            setShippingInfo((prev) => ({ ...prev, phone: value }));
                        }}
                        className={`${styles.input} ${shippingInfo.phone.length > 0 && shippingInfo.phone.length !== 9 ? styles.inputError : ''}`}
                        required
                      />
                    </div>
                  </div>

                  {shippingInfo.courier === 'urbano_agencia' ? (
                    <div className={styles.formGroup}>
                      <Select
                        label="Agencia Urbano"
                        outlined
                        value={shippingInfo.agency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setShippingInfo((prev) => ({ ...prev, agency: e.target.value }))
                        }
                        options={availableAgencies}
                        disabled={!shippingInfo.district}
                      />
                      {availableAgencies.length === 0 && shippingInfo.district && (
                        <p className={styles.errorText}>
                          No se encontraron agencias en este distrito.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <input
                        type="text"
                        placeholder="Direccion exacta de entrega"
                        value={shippingInfo.address}
                        onChange={(e) =>
                          setShippingInfo((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className={styles.input}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className={styles.shippingSummary}>
                <div className={styles.summaryRow}>
                  <span>Costo de Envio:</span>
                  <span className={styles.shippingCost}>
                    {shippingInfo.cost === 0 ? '¡GRATIS!' : `S/ ${shippingInfo.cost.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.stepContent}>
              <div className={styles.orderSummaryCard}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800' }}>
                  Resumen Final
                </h3>
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
                  <span>
                    Envío:{' '}
                    {shippingInfo.courier === 'recojo'
                      ? 'Recojo en tienda'
                      : shippingInfo.courier === 'urbano_agencia'
                        ? `Agencia Urbano (${shippingInfo.agency || '—'})`
                        : 'Domicilio'}
                  </span>
                  <span>
                    {shippingInfo.cost === 0 ? '¡Gratis!' : `S/ ${shippingInfo.cost.toFixed(2)}`}
                  </span>
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
                    if (value.length <= 8) setShippingInfo((prev) => ({ ...prev, dni: value }));
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
                    onChange={(e) => setEmail(e.target.value)}
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
                      <span style={{ fontSize: '14px' }}>✓</span> Verificado con Google
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
                    onClick={handleGoogleSignIn}
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
                        e.currentTarget.style.background =
                          'var(--md-sys-color-surface-container-high)';
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
                      Tus datos de Google se usan <strong>solo para verificar tu identidad</strong>{' '}
                      ante Store Lite al acceder a tu orden.{' '}
                      <strong>No serán compartidos con el negocio</strong>. Garantizamos tu
                      privacidad.
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
                    Comprás con <strong>{customerAuth.name}</strong> ({customerAuth.email}). Store
                    Lite usa tu identidad de Google solo para verificar tus compras.
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
                    Tu identidad de Google (<strong>{customerAuth.email}</strong>) queda vinculada a
                    esta compra para que puedas acceder a tu orden. El comprobante se enviará a{' '}
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
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                >
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
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                  >
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Yape</span>
                    <span style={{ fontWeight: 600 }}>
                      S/ {YAPE_LIMITS.min.toFixed(2)} – S/ {YAPE_LIMITS.max.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                  >
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
          )}
        </div>

        {/* Footer with Main Action Button */}
        <div className={styles.footer}>
          {step === 1 ? (
            <button className={styles.nextBtn} onClick={handleNextStep}>
              Continuar <Icon>arrow_forward</Icon>
            </button>
          ) : (
            <button
              className={styles.payBtn}
              onClick={handlePayment}
              disabled={loading || isCulqiProcessing || isPaymentProcessing}
            >
              {loading || isCulqiProcessing || isPaymentProcessing ? (
                <>
                  <span className={styles.spinner} />
                  {isPaymentProcessing ? 'Procesando pago...' : 'Abriendo pasarela...'}
                </>
              ) : (
                <>Ir a Pagar S/ {finalTotal.toFixed(2)}</>
              )}
            </button>
          )}
          <div className={styles.secureBadge}>
            <Icon size={14}>verified_user</Icon> Pagos por Culqi
          </div>
        </div>
      </div>
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />
    </div>,
    document.body,
  );
}
