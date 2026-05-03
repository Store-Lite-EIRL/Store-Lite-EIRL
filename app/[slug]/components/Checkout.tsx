'use client';

import { PERU_LOCATIONS } from '@/core/logistics/peruLocations';
import { URBANO_AGENCIES } from '@/core/logistics/urbanoAgencies';
import { createClient } from '@/lib/supabase/client';
import { AlertSnackbar, Confetti, Icon, Receipt } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Select } from '@/shared/components/ui/inputs/Select';
import { toBlob } from 'html-to-image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CartItem } from '../storage/context/CartContext';
import styles from './Checkout.module.css';

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
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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
      if (window.Culqi?.token) {
        const token = window.Culqi.token.id;
        const tokenType = window.Culqi.token.type || 'card';

        const paymentMethod = tokenType === 'yape' || token.startsWith('ype_') ? 'Yape' : 'Tarjeta';
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

        // Mostrar indicador de procesamiento mientras se verifica el pago
        setIsPaymentProcessing(true);

        try {
          const response = await fetch('/api/payment/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              amount: Math.round(finalTotal * 100),
              currency: 'PEN',
              email,
              phone: shippingInfo.phone,
              businessId,
              productId: primaryProduct.id,
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
          setLoading(false);
          setIsPaymentProcessing(false);
          return;
        }
        setCompletedOrder({ orderNumber, paymentMethod });
        setShowReceipt(true);
        setShowConfetti(true);

        if (window.Culqi && window.Culqi.close) window.Culqi.close();

        setAlert({
          open: true,
          description: '¡Pago procesado exitosamente!',
          color: 'success',
          icon: 'check_circle',
        });
      } else {
        setAlert({
          open: true,
          description: 'Hubo un problema con el pago. Intenta nuevamente.',
          color: 'error',
          icon: 'error',
        });
      }
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
      if (shippingInfo.courier !== 'recojo') {
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
      } else {
        if (shippingInfo.phone.length !== 9) {
          setAlert({
            open: true,
            description: 'Por favor, ingresá un teléfono de contacto de 9 dígitos.',
            color: 'warning',
            icon: 'phone',
          });
          return;
        }
      }
      setStep(2);
    }
  };

  const handlePayment = async () => {
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

    setIsCulqiProcessing(true);

    try {
      const Culqi = window.Culqi;
      if (!Culqi) {
        throw new Error('Culqi no está disponible');
      }

      Culqi.settings({
        title: businessName,
        currency: 'PEN',
        description: `Compra en linea - ${cartItems.length} productos`,
        amount: Math.round(finalTotal * 100),
      });

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

    if (shippingInfo.cost > 0) {
      receiptItems.push({
        label: 'Costo de envio',
        value: shippingInfo.cost,
      });
    }

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

                <Button
                  variant="outlined"
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

  // STANDARD CHECKOUT FLOW
  const isLoading = isCulqiProcessing || isPaymentProcessing;
  const loadingMessage = isPaymentProcessing
    ? { title: 'Procesando pago', subtitle: 'Verificando con el banco...' }
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
              <button className={styles.backBtn} onClick={() => setStep(1)}>
                <Icon>arrow_back</Icon>
              </button>
            )}
            <h2 className={styles.title}>
              {step === 1 ? 'Paso 1: ¿Cómo lo recibes?' : 'Paso 2: Confirmar Compra'}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>
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

              <div className={styles.formGroup}>
                <input
                  type="email"
                  placeholder="Correo para comprobante"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'rgba(103, 80, 164, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-primary)',
                }}
              >
                <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' }}>
                  security
                </Icon>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4' }}>
                  Al pagar, se abrirá la pasarela segura de <strong>Culqi</strong>.
                </p>
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
                `Ir a Pagar S/ ${finalTotal.toFixed(2)}`
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
