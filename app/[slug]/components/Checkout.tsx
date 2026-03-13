'use client';

import React, { useState } from 'react';
import styles from './Checkout.module.css';

interface CheckoutProps {
  totalAmount: number;
  productName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function Checkout({ totalAmount, productName, onSuccess, onCancel }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'yape'>('card');
  const [email, setEmail] = useState('');

  const handlePayment = async () => {
    if (!email) {
      alert('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);

    try {
      // 1. Aquí iría la carga del SDK de la pasarela y la tokenización
      // Ejemplo: const token = await Culqi.createToken();
      
      // Simulación de delay de tokenización y carga en backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Aquí llamarías a tu Edge Function o Route Handler pasándole el token
      /*
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'mock_token', amount: totalAmount * 100, email })
      });
      */
      
      onSuccess();
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Hubo un problema al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.checkoutOverlay}>
      <div className={styles.checkoutModal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Completar Pago</h2>
          <button className={styles.closeBtn} onClick={onCancel}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.orderSummary}>
            <h3>Resumen de la Orden</h3>
            <div className={styles.summaryItem}>
              <span>{productName}</span>
              <span>S/ {totalAmount.toFixed(2)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total a Pagar</span>
              <span>S/ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.methods}>
            <label className={`${styles.methodOption} ${paymentMethod === 'card' ? styles.methodSelected : ''}`}>
              <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
              <div className={styles.methodInfo}>
                <span className="material-symbols-outlined">credit_card</span>
                <span>Tarjeta (Débito/Crédito)</span>
              </div>
            </label>
            <label className={`${styles.methodOption} ${paymentMethod === 'yape' ? styles.methodSelected : ''}`}>
              <input type="radio" value="yape" checked={paymentMethod === 'yape'} onChange={() => setPaymentMethod('yape')} />
              <div className={styles.methodInfo}>
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>Yape / Plin</span>
              </div>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>
          
          {paymentMethod === 'card' && (
            <div className={styles.mockCardForm}>
              <p className={styles.mockNotice}>* Integración visual simulada. En prod, esto se reemplazará por Culqi Elements o Stripe Elements para cumplimiento PCI.</p>
              <input type="text" placeholder="Número de tarjeta" className={styles.input} disabled />
              <div className={styles.row}>
                <input type="text" placeholder="MM/AA" className={styles.input} disabled />
                <input type="text" placeholder="CVC" className={styles.input} disabled />
              </div>
            </div>
          )}

        </div>

        <div className={styles.footer}>
          <button className={styles.payBtn} onClick={handlePayment} disabled={loading}>
            {loading ? <span className={styles.spinner}></span> : `Pagar S/ ${totalAmount.toFixed(2)}`}
          </button>
          <div className={styles.secureBadge}>
            <span className="material-symbols-outlined">lock</span>
            Pagos 100% seguros y encriptados
          </div>
        </div>
      </div>
    </div>
  );
}
