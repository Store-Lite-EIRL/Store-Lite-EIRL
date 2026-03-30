'use client';

import { Dialog, Select, TextField } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import React from 'react';
import confetti from 'canvas-confetti';
import { upgradeBusinessPlan } from '../actions';
import { Icon } from '@/shared/components/ui/data-display';

export interface PricingFeature {
  text: string;
}

export interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: PricingFeature[];
  buttonText: string;
  isHighlighted?: boolean;
  badgeText?: string;
  badgeType?: 'primary' | 'secondary';
  buttonVariant?: 'filled' | 'outlined' | 'tonal' | 'elevated' | 'text';
  businesses?: { id: string; name: string; planType?: string | null }[];
}

export function PricingCard({
  title,
  description,
  price,
  originalPrice,
  period,
  features,
  buttonText,
  isHighlighted = false,
  badgeText,
  badgeType = 'primary',
  buttonVariant = 'outlined',
  businesses = [],
}: PricingCardProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [step, setStep] = React.useState<'select' | 'payment' | 'success'>('select');
  const [selectedBusiness, setSelectedBusiness] = React.useState('');
  const [orderDetails, setOrderDetails] = React.useState({ id: '', date: '', time: '' });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [form, setForm] = React.useState({
    cardNumber: '4111 1111 1111 111',
    cardHolder: 'Diego Roca',
    email: 'diego@storelite.pe',
  });

  const cardClassName = `pricing-card ${isHighlighted ? 'pricing-card--highlighted' : ''}`;

  const handleInputChange = (field: keyof typeof form) => (event: React.FormEvent<HTMLElement>) => {
    const target = event.target as HTMLElement & { value?: string };
    setForm((current) => ({ ...current, [field]: target.value ?? '' }));
  };

  const handleOpenDialog = () => {
    setIsPaymentDialogOpen(true);
    setStep('select');
    setSelectedBusiness(businesses.length === 1 ? businesses[0].id : '');
    setOrderDetails({
      id: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleCloseDialog = () => {
    setIsPaymentDialogOpen(false);
  };

  const selectedBusinessData = businesses.find(b => b.id === selectedBusiness);
  const selectedBusinessName = selectedBusinessData?.name;
  const hasActivePlan = selectedBusinessData?.planType && selectedBusinessData.planType !== 'basico';

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate payment network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let planEnum = 'basico';
    if (title.toLowerCase().includes('emprendedor')) planEnum = 'emprendedor';
    if (title.toLowerCase().includes('business pro')) planEnum = 'business_pro';
    if (title.toLowerCase().includes('enterprise')) planEnum = 'enterprise_ai';

    const result = await upgradeBusinessPlan(selectedBusiness, planEnum);

    setIsProcessing(false);
    if (!result.success) {
      alert(result.error || 'No se pudo actualizar el plan');
      return;
    }

    setStep('success');

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const planLabels: Record<string, string> = {
    emprendedor: 'Emprendedor',
    business_pro: 'Business Pro',
    enterprise_ai: 'Enterprise AI'
  };

  return (
    <>
      <div className={cardClassName}>
        {badgeText && (
          <div className={`pricing-card-badge ${badgeType === 'secondary' ? 'pricing-card-badge--secondary' : ''}`}>
            {badgeText}
          </div>
        )}

        <div className="pricing-card-header">
          <h3 className="pricing-card-title">{title}</h3>
          <p className="pricing-card-description">{description}</p>
          <div className="pricing-card-price-container">
            <span className="pricing-card-currency">S/</span>
            <span className="pricing-card-price">{price}</span>
            <span className="pricing-card-period">/{period}</span>
            {originalPrice && (
              <span className="pricing-card-original-price">S/ {originalPrice}</span>
            )}
          </div>
        </div>

        <ul className="pricing-features-list">
          {features.map((feature, index) => (
            <li key={index} className="pricing-feature-item">
              <svg
                className="pricing-feature-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>

        <div className="pricing-card-action">
          <Button variant={buttonVariant} style={{ width: '100%' }} onClick={handleOpenDialog}>
            {buttonText}
          </Button>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onClose={handleCloseDialog}>
        <div slot="headline">Suscripción a {title}</div>
        <div slot="content">
          <div className="pricing-payment-dialog" style={{ padding: '10px 0' }}>
            {step === 'select' && (
              <div className="pricing-business-select-step" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>¿A qué negocio deseas aplicarle este plan?</p>
                {businesses.length > 0 ? (
                  <Select
                    label="Seleccionar negocio"
                    value={selectedBusiness}
                    onChange={(e: any) => setSelectedBusiness(e.target.value)}
                    options={[
                      { value: '', label: 'Selecciona una opcion...' },
                      ...businesses.map(biz => {
                        const hasPlan = biz.planType && biz.planType !== 'basico';
                        const planText = hasPlan ? ` (Plan Actual: ${planLabels[biz.planType as string] || biz.planType})` : '';
                        return {
                          value: biz.id,
                          label: `${biz.name}${planText}`
                        };
                      })
                    ]}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <div style={{ padding: '16px', background: 'var(--md-sys-color-surface-variant)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      No tienes negocios registrados aún.
                    </p>
                  </div>
                )}
                {hasActivePlan && (
                  <div style={{ padding: '12px', background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Icon size={16}>warning</Icon>
                      <strong>Atención</strong>
                    </div>
                    Este negocio ya cuenta con un plan de pago. Si cambias de plan, el nuevo reemplazará al actual inmediatamente. No se emitirán reembolsos ni se acumulará el tiempo restante.
                  </div>
                )}
              </div>
            )}

            {step === 'payment' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>ID de Orden:</span>
                      <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{orderDetails.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Fecha y Hora:</span>
                      <span style={{ fontSize: '0.875rem' }}>{orderDetails.date} {orderDetails.time}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed var(--md-sys-color-outline-variant)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Negocio:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{selectedBusinessName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', color: 'var(--md-sys-color-on-surface)' }}>Total a Pagar ({period})</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}>S/ {price}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--md-sys-color-on-surface)' }}>Ingresa tu tarjeta</div>
                    <TextField
                      label="Número de tarjeta"
                      placeholder="0000 0000 0000 0000"
                      value={form.cardNumber}
                      onInput={handleInputChange('cardNumber')}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <TextField
                        label="Vencimiento"
                        placeholder="MM/AA"
                        style={{ width: '100%' }}
                        value="12/26"
                      />
                      <TextField
                        label="CVC"
                        type="password"
                        placeholder="123"
                        style={{ width: '100%' }}
                        value="123"
                      />
                    </div>
                    <TextField
                      label="Nombre del titular"
                      placeholder="Como figura en la tarjeta"
                      value={form.cardHolder}
                      onInput={handleInputChange('cardHolder')}
                      style={{ width: '100%' }}
                    />
                    <TextField
                      type="email"
                      label="Correo para boleta/factura"
                      placeholder="tucorreo@empresa.com"
                      value={form.email}
                      onInput={handleInputChange('email')}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '24px', 
                  background: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <Icon size={24}>check_circle</Icon>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--md-sys-color-on-surface)' }}>¡Pago Exitoso!</h3>
                  <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                    Tu plan <strong>{title}</strong> ya ha sido activado para <strong>{selectedBusinessName}</strong>.
                  </p>
                </div>
                <div style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  background: 'var(--md-sys-color-surface-container)', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden'
                 }}>
                  <div style={{ 
                    position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '10px', background: 'var(--md-sys-color-surface)' 
                  }}/>
                  <div style={{ 
                    position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderRadius: '10px', background: 'var(--md-sys-color-surface)' 
                  }}/>
                  
                  <div style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                    Recibo de pago
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Plan:</span>
                    <span style={{ fontWeight: '500' }}>{title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pagado:</span>
                    <span style={{ fontWeight: '500' }}>S/ {price} ({period})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Referencia:</span>
                    <span style={{ fontFamily: 'monospace' }}>{orderDetails.id}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--md-sys-color-outline-variant)', margin: '0.5rem 0' }}/>
                  <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    El comprobante fue enviado a {form.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div slot="actions">
          {step === 'select' && (
            <>
              <Button variant="text" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              {businesses.length > 0 ? (
                <Button
                  variant="filled"
                  onClick={() => setStep('payment')}
                  disabled={!selectedBusiness}
                >
                  Continuar
                </Button>
              ) : (
                <Button variant="filled" onClick={() => window.location.href = '/list-business'} >
                  Ir a Crear Negocio
                </Button>
              )}
            </>
          )}

          {step === 'payment' && (
            <>
              <Button variant="text" onClick={() => setStep('select')} disabled={isProcessing}>
                Atrás
              </Button>
              <Button variant="filled" onClick={handlePay} disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : `Pagar S/ ${price}`}
              </Button>
            </>
          )}

          {step === 'success' && (
            <Button variant="filled" onClick={() => window.location.href = '/list-business'}>
              Ir a mis Negocios
            </Button>
          )}
        </div>
      </Dialog>
    </>
  );
}
