'use client';

import { Icon, TextField } from '@/shared/components/ui';
import React from 'react';

interface CardPaymentFormProps {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  email: string;
  onCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCardNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExpiryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCvvChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CardPaymentForm({
  cardNumber,
  cardName,
  expiry,
  cvv,
  email,
  onCardNumberChange,
  onCardNameChange,
  onExpiryChange,
  onCvvChange,
  onEmailChange,
}: CardPaymentFormProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Premium Virtual Card */}
      <div className="relative h-56 w-full rounded-[2rem] bg-slate-950 border border-white/10 shadow-2xl p-8 text-white overflow-hidden group">
        {/* Animated gradients for premium feel */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#135bec]/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#135bec]/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

        {/* Card Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#135bec]">
                Premium Card
              </span>
              <div className="w-12 h-9 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/20">
                <div className="w-8 h-6 bg-linear-to-r from-amber-400 to-amber-200 rounded-sm opacity-80" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xl font-black italic tracking-tighter">VISA</div>
              <span className="material-symbols-outlined text-white/40 text-2xl font-light">
                contactless
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-2xl tracking-[0.2em] font-mono text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  Card Holder
                </div>
                <div className="text-sm font-bold tracking-wide uppercase truncate max-w-[200px]">
                  {cardName || 'Nombre Apellido'}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  Expires
                </div>
                <div className="text-sm font-bold tracking-widest">{expiry || 'MM/YY'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
            Información de contacto
          </label>
          <TextField
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="tu@correo.com"
            className="w-full custom-dark-input"
          >
            <Icon slot="leading-icon">alternate_email</Icon>
          </TextField>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
            Número de tarjeta
          </label>
          <TextField
            value={cardNumber}
            onChange={onCardNumberChange}
            placeholder="0000 0000 0000 0000"
            className="w-full custom-dark-input"
          >
            <Icon slot="leading-icon">credit_card</Icon>
          </TextField>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
            Nombre en la tarjeta
          </label>
          <TextField
            value={cardName}
            onChange={onCardNameChange}
            placeholder="Como figura en el plástico"
            className="w-full custom-dark-input"
          >
            <Icon slot="leading-icon">badge</Icon>
          </TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
              Expiración
            </label>
            <TextField
              value={expiry}
              onChange={onExpiryChange}
              placeholder="MM/YY"
              className="w-full custom-dark-input"
            >
              <Icon slot="leading-icon">calendar_month</Icon>
            </TextField>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
              CVC / CVV
            </label>
            <TextField
              type="password"
              value={cvv}
              onChange={onCvvChange}
              placeholder="•••"
              className="w-full custom-dark-input"
            >
              <Icon slot="leading-icon">lock_person</Icon>
            </TextField>
          </div>
        </div>
      </div>

      <style>{`
        .custom-dark-input {
          --md-outlined-text-field-container-shape: 16px;
          --md-outlined-text-field-outline-color: rgba(255, 255, 255, 0.1);
          --md-outlined-text-field-focus-outline-color: #135bec;
          --md-outlined-text-field-input-text-color: #fff;
          --md-outlined-text-field-input-text-placeholder-color: rgba(255, 255, 255, 0.3);
          --md-outlined-text-field-leading-icon-color: rgba(255, 255, 255, 0.5);
          --md-outlined-text-field-focus-leading-icon-color: #135bec;
          --md-outlined-text-field-container-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
