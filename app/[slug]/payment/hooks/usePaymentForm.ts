'use client';

import { useState } from 'react';
import { processPayment } from '../actions/paymentActions';
import { tokenizeCard, tokenizeYape } from '../services/culqiService';

interface UsePaymentFormProps {
  productId: string;
  businessSlug: string;
  price: number;
  currency: string;
  onSuccess: (data: { deliveryCode: string; culqiChargeId?: string }) => void;
}

export function usePaymentForm({
  productId,
  businessSlug,
  price,
  currency,
  onSuccess,
}: UsePaymentFormProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'yape' | 'plin' | 'mp'>('yape');
  const [step, setStep] = useState<'form' | 'processing' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');

  // Yape fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [yapeEmail, setYapeEmail] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    setCardNumber(value.match(/.{1,4}/g)?.join(' ') || value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setExpiry(value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, '').substring(0, 3));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').substring(0, 9));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, '').substring(0, 6));
  };

  const resetForm = () => {
    setStep('form');
    setErrorMessage('');
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setEmail('');
    setPhone('');
    setOtp('');
    setYapeEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setErrorMessage('');

    try {
      let tokenId: string;
      const buyerEmail = activeTab === 'card' ? email : yapeEmail;

      if (activeTab === 'card') {
        const expiryParts = expiry.split('/');
        const expirationMonth = expiryParts[0] ?? '';
        const expirationYear = expiryParts[1] ? `20${expiryParts[1]}` : '';

        const token = await tokenizeCard({
          card_number: cardNumber.replace(/\s/g, ''),
          cvv,
          expiration_year: expirationYear,
          expiration_month: expirationMonth,
          email: buyerEmail,
        });
        tokenId = token.id;
      } else if (activeTab === 'yape') {
        const token = await tokenizeYape({
          number: phone,
          otp,
          amount: price,
          email: buyerEmail,
        } as any);
        tokenId = token.id;
      } else {
        setErrorMessage('Este método de pago no está disponible actualmente.');
        setStep('error');
        return;
      }

      const result = await processPayment({
        tokenId,
        productId,
        businessSlug,
        paymentMethod: activeTab as 'card' | 'yape', // Only card/yape are processed for now
        buyerEmail,
        buyerPhone: activeTab === 'yape' ? phone : undefined,
        amountSoles: price,
        currency,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? 'Error al procesar el pago.');
        setStep('error');
        return;
      }

      onSuccess({
        deliveryCode: result.deliveryCode || '',
        culqiChargeId: result.culqiChargeId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setErrorMessage(message);
      setStep('error');
    }
  };

  return {
    activeTab,
    setActiveTab,
    step,
    setStep,
    errorMessage,
    cardNumber,
    cardName,
    expiry,
    cvv,
    email,
    phone,
    otp,
    yapeEmail,
    handleCardNumberChange,
    handleExpiryChange,
    handleCvvChange,
    handlePhoneChange,
    handleOtpChange,
    setCardName,
    setEmail,
    setYapeEmail,
    resetForm,
    handleSubmit,
  };
}
