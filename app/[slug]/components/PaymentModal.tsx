'use client';

import { Dialog } from '@/shared/components/ui';
import React from 'react';
import { AmountSection } from '../payment/components/AmountSection';
import { CardPaymentForm } from '../payment/components/CardPaymentForm';
import { OrderSummary } from '../payment/components/OrderSummary';
import type { PaymentMethodId } from '../payment/components/PaymentMethodSelector';
import { PaymentMethodSelector } from '../payment/components/PaymentMethodSelector';
import { YapePaymentForm } from '../payment/components/YapePaymentForm';
import { usePaymentForm } from '../payment/hooks/usePaymentForm';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  price: number;
  currency: string;
  productId: string;
  businessSlug: string;
}

export function PaymentModal({
  open,
  onClose,
  productName,
  price,
  currency,
  productId,
  businessSlug,
}: PaymentModalProps) {
  const {
    activeTab,
    setActiveTab,
    step,
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
    handleSubmit,
    resetForm,
  } = usePaymentForm({
    productId,
    businessSlug,
    price,
    currency,
    onSuccess: () => {
      console.log('Payment successful');
    },
  });

  const paymentMethods: { id: PaymentMethodId; label: string; icon: string }[] = [
    { id: 'card', label: 'Tarjeta', icon: 'credit_card' },
    { id: 'yape', label: 'Yape', icon: 'qr_code_2' },
    { id: 'plin', label: 'Plin', icon: 'payments' },
    { id: 'mp', label: 'Mercado Pago', icon: 'account_balance_wallet' },
  ];

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  const currentMethodLabel = paymentMethods.find((m) => m.id === activeTab)?.label || activeTab;

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 overflow-y-auto antialiased">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#00040a] rounded-[2.5rem] border border-white/5 shadow-[0_0_100px_rgba(19,91,236,0.15)] overflow-hidden">
            <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-[#135bec]/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-slate-500/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#135bec] p-2.5 rounded-2xl shadow-lg shadow-[#135bec]/20">
                    <span className="material-symbols-outlined text-white text-2xl leading-none">
                      lock
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Checkout Seguro
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        Encriptacion SSL 256 bits
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-3 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-8 pt-4 flex flex-col gap-10">
                <div className="flex flex-col gap-6">
                  <AmountSection
                    currency={currency}
                    price={price}
                    currentMethodLabel={currentMethodLabel}
                  />
                  <OrderSummary
                    productName={productName}
                    price={price}
                    currency={currency}
                    onClose={handleClose}
                  />
                </div>

                <div className="flex flex-col gap-8">
                  <PaymentMethodSelector
                    paymentMethods={paymentMethods}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                  />

                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-8">
                    {step === 'error' && (
                      <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-red-200">Pago rechazado</p>
                          <p className="text-xs text-red-400 mt-0.5">{errorMessage}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'card' && (
                      <CardPaymentForm
                        cardNumber={cardNumber}
                        cardName={cardName}
                        expiry={expiry}
                        cvv={cvv}
                        email={email}
                        onCardNumberChange={handleCardNumberChange}
                        onCardNameChange={(e) => setCardName(e.target.value.toUpperCase())}
                        onExpiryChange={handleExpiryChange}
                        onCvvChange={handleCvvChange}
                        onEmailChange={(e) => setEmail(e.target.value)}
                      />
                    )}

                    {activeTab === 'yape' && (
                      <YapePaymentForm
                        phone={phone}
                        otp={otp}
                        email={yapeEmail}
                        onPhoneChange={handlePhoneChange}
                        onOtpChange={handleOtpChange}
                        onEmailChange={(e) => setYapeEmail(e.target.value)}
                      />
                    )}

                    {!['card', 'yape'].includes(activeTab) && (
                      <div className="py-12 text-center text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">
                          hourglass_empty
                        </span>
                        <p className="text-sm font-medium">
                          Este metodo de pago estara disponible pronto
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={step === 'processing'}
                      className="w-full relative group overflow-hidden rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-[#135bec] group-hover:bg-[#1565f5] transition-colors" />
                      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                      <div className="relative py-5 px-6 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-70 shadow-[0_20px_40px_rgba(19,91,236,0.25)]">
                        {step === 'processing' ? (
                          <span className="flex items-center gap-3">
                            <span className="material-symbols-outlined animate-spin text-lg text-white">
                              progress_activity
                            </span>
                            <span className="text-white font-black uppercase tracking-widest text-sm">
                              Procesando...
                            </span>
                          </span>
                        ) : (
                          <>
                            <span className="text-white font-black uppercase tracking-widest text-sm">
                              Pagar {currency} {price.toFixed(2)}
                            </span>
                            <span className="material-symbols-outlined text-white text-xl">
                              arrow_forward
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
