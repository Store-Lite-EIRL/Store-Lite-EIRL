'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Checkout.module.css';
import type { CartItem } from '../storage/context/CartContext';
import { Icon } from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/inputs/Select';
import { PERU_LOCATIONS } from '@/core/logistics/peruLocations';
import { SHALOM_AGENCIES } from '@/core/logistics/shalomAgencies';

interface CheckoutProps {
  totalAmount: number;
  cartItems: CartItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

export type Courier = 'shalom' | 'olva';

export interface ShippingInfo {
  courier: Courier;
  department: string;
  province: string;
  district: string;
  agency?: string;
  address?: string;
  reference?: string;
  phone: string;
  cost: number;
}

export default function Checkout({ totalAmount, cartItems, onSuccess, onCancel }: CheckoutProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Shipping State
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    courier: 'shalom',
    department: '',
    province: '',
    district: '',
    phone: '',
    cost: 0,
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'yape' | 'deposit'>('card');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setMounted(true);
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Calculate simulated shipping cost
  useEffect(() => {
    if (!shippingInfo.department) {
      setShippingInfo(prev => ({ ...prev, cost: 0 }));
      return;
    }

    // Logic: LIMA is cheaper, Province is more expensive
    const isLima = shippingInfo.department.toUpperCase() === 'LIMA';
    const baseCost = isLima ? 10 : 18;
    
    // Simulate extra cost by weight (each item adds S/ 2)
    const weightFactor = cartItems?.reduce((acc, item) => acc + item.quantity * 2, 0) || 0;
    
    setShippingInfo(prev => ({ ...prev, cost: baseCost + weightFactor }));
  }, [shippingInfo.department, shippingInfo.courier, cartItems]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptName = e.target.value;
    setShippingInfo(prev => ({
      ...prev,
      department: deptName,
      province: '',
      district: '',
      agency: ''
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provName = e.target.value;
    setShippingInfo(prev => ({
      ...prev,
      province: provName,
      district: '',
      agency: ''
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    // Find the district to validate if needed
    
    setShippingInfo(prev => ({
      ...prev,
      district: distName,
      agency: ''
    }));
  };

  // Derived data for selects
  const departments = PERU_LOCATIONS.map(d => ({ value: d.name, label: d.name }));
  const provinces = PERU_LOCATIONS.find(d => d.name === shippingInfo.department)
    ?.provinces.map(p => ({ value: p.name, label: p.name })) || [];
  const districts = PERU_LOCATIONS.find(d => d.name === shippingInfo.department)
    ?.provinces.find(p => p.name === shippingInfo.province)
    ?.districts.map(d => ({ value: d.name, label: d.name })) || [];

  // Filter Shalom agencies based on selected district
  const availableAgencies = SHALOM_AGENCIES.filter(agency => {
      // Find district ID for the current district name
      const dept = PERU_LOCATIONS.find(d => d.name === shippingInfo.department);
      const prov = dept?.provinces.find(p => p.name === shippingInfo.province);
      const dist = prov?.districts.find(d => d.name === shippingInfo.district);
      return agency.districtId === dist?.id;
  }).map(a => ({ value: a.name, label: a.name }));

  const finalTotal = totalAmount + shippingInfo.cost;

  const handleNextStep = () => {
    if (step === 1) {
      // Validate shipping info
      if (!shippingInfo.department || !shippingInfo.province || !shippingInfo.district || !shippingInfo.phone) {
        alert('Por favor, completa todos los campos de ubicación y contacto.');
        return;
      }
      if (shippingInfo.courier === 'shalom' && !shippingInfo.agency) {
        alert('Por favor, selecciona una agencia Shalom.');
        return;
      }
      if (shippingInfo.courier === 'olva' && !shippingInfo.address) {
        alert('Por favor, ingresa tu dirección para Olva Courier.');
        return;
      }
      setStep(2);
    }
  };

  const handlePayment = async () => {
    if (!email) {
      alert('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      // Simulation of payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSuccess();
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Hubo un problema al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={styles.checkoutOverlay} onClick={onCancel}>
      <div className={styles.checkoutModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            {step === 2 && (
              <button className={styles.backBtn} onClick={() => setStep(1)}>
                <Icon>arrow_back</Icon>
              </button>
            )}
            <h2 className={styles.title}>
              {step === 1 ? 'Paso 1: Datos de Envío' : 'Paso 2: Pago'}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>
            <Icon>close</Icon>
          </button>
        </div>

        <div className={styles.stepperContainer}>
           <div className={`${styles.stepIndicator} ${step >= 1 ? styles.active : ''}`}>1</div>
           <div className={styles.stepLine} />
           <div className={`${styles.stepIndicator} ${step >= 2 ? styles.active : ''}`}>2</div>
        </div>

        <div className={styles.body}>
          {step === 1 ? (
            <div className={styles.stepContent}>
              <div className={styles.orderMiniSummary}>
                <p>Estás comprando <strong>{cartItems?.length || 0} tipos de productos</strong></p>
                <p>Subtotal: <strong>S/ {totalAmount.toFixed(2)}</strong></p>
              </div>

              <div className={styles.courierToggle}>
                <button 
                  className={`${styles.courierBtn} ${shippingInfo.courier === 'shalom' ? styles.courierActive : ''}`}
                  onClick={() => setShippingInfo(prev => ({ ...prev, courier: 'shalom' }))}
                >
                   <Icon>package_2</Icon>
                   <span>Shalom (Agencia)</span>
                </button>
                <button 
                  className={`${styles.courierBtn} ${shippingInfo.courier === 'olva' ? styles.courierActive : ''}`}
                  onClick={() => setShippingInfo(prev => ({ ...prev, courier: 'olva' }))}
                >
                   <Icon>local_shipping</Icon>
                   <span>Olva Courier</span>
                </button>
              </div>

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
                  <label>Celular de Contacto</label>
                  <input 
                    type="tel" 
                    placeholder="999 999 999"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className={styles.input}
                  />
                </div>
              </div>

              {shippingInfo.courier === 'shalom' ? (
                <div className={styles.formGroup}>
                  <Select 
                    label="Agencia Shalom"
                    outlined
                    value={shippingInfo.agency}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setShippingInfo(prev => ({ ...prev, agency: e.target.value }))}
                    options={availableAgencies}
                    disabled={!shippingInfo.district}
                  />
                  {availableAgencies.length === 0 && shippingInfo.district && (
                    <p className={styles.errorText}>No se encontraron agencias en este distrito.</p>
                  )}
                  <p className={styles.helpText}>El recojo se realiza en la agencia seleccionada.</p>
                </div>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Dirección de Entrega</label>
                    <input 
                      type="text" 
                      placeholder="Calle, Número, Dpto..."
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Referencia</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Cerca al parque central"
                      value={shippingInfo.reference}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, reference: e.target.value }))}
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              <div className={styles.shippingSummary}>
                <div className={styles.summaryRow}>
                   <span>Costo de Envío Estimado:</span>
                   <span className={styles.shippingCost}>S/ {shippingInfo.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.stepContent}>
              <div className={styles.orderSummaryCard}>
                <h3>Resumen Final</h3>
                <div className={styles.summaryItem}>
                  <span>Productos</span>
                  <span>S/ {totalAmount.toFixed(2)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Envío ({shippingInfo.courier})</span>
                  <span>S/ {shippingInfo.cost.toFixed(2)}</span>
                </div>
                <div className={styles.summaryTotalFinal}>
                  <span>Total a Pagar</span>
                  <span>S/ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Correo Electrónico para el Comprobante</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.methodTitle}>Selecciona método de pago:</div>
              <div className={styles.methods}>
                <label className={`${styles.methodOption} ${paymentMethod === 'card' ? styles.methodSelected : ''}`}>
                  <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <div className={styles.methodInfo}>
                    <Icon>credit_card</Icon>
                    <span>Tarjeta</span>
                  </div>
                </label>
                <label className={`${styles.methodOption} ${paymentMethod === 'yape' ? styles.methodSelected : ''}`}>
                  <input type="radio" value="yape" checked={paymentMethod === 'yape'} onChange={() => setPaymentMethod('yape')} />
                  <div className={styles.methodInfo}>
                    <Icon>qr_code_scanner</Icon>
                    <span>Yape / Plin</span>
                  </div>
                </label>
                <label className={`${styles.methodOption} ${paymentMethod === 'deposit' ? styles.methodSelected : ''}`}>
                  <input type="radio" value="deposit" checked={paymentMethod === 'deposit'} onChange={() => setPaymentMethod('deposit')} />
                  <div className={styles.methodInfo}>
                    <Icon>account_balance</Icon>
                    <span>Depósito</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'deposit' && (
                <div className={styles.depositInfo}>
                   <p><strong>BCP Soles:</strong> 193-XXXXXXXX-X-XX</p>
                   <p><strong>CCI:</strong> 002-193XXXXXXXXXXXXXXX</p>
                   <p className={styles.helpText}>Deberás subir tu comprobante de pago después de finalizar.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step === 1 ? (
            <button className={styles.nextBtn} onClick={handleNextStep}>
              Continuar al Pago
              <Icon>arrow_forward</Icon>
            </button>
          ) : (
            <button className={styles.payBtn} onClick={handlePayment} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : `Pagar S/ ${finalTotal.toFixed(2)}`}
            </button>
          )}
          <div className={styles.secureBadge}>
            <Icon size={16}>lock</Icon>
            Checkout Seguro
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
