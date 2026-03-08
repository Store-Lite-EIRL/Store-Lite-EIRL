'use client';

import { Icon, TextField } from '@/shared/components/ui';
import Image from 'next/image';
import React from 'react';

interface YapePaymentFormProps {
  phone: string;
  otp: string;
  email: string;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOtpChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function YapePaymentForm({
  phone,
  otp,
  email,
  onPhoneChange,
  onOtpChange,
  onEmailChange,
}: YapePaymentFormProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#742284] p-2 rounded-lg">
            <Image
              src="https://www.yape.com.pe/assets/images/logo-yape.png"
              alt="Yape"
              width={24}
              height={24}
              className="h-6 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm">Yape</span>
            <span className="text-slate-400 text-xs">Pago instantáneo</span>
          </div>
        </div>
        <div className="bg-[#135bec]/10 text-[#135bec] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#135bec]/20">
          Recomendado
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
            Correo Electrónico
          </label>
          <TextField
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="tu@correo.com"
            className="w-full custom-dark-input"
          >
            <Icon slot="leading-icon">mail</Icon>
          </TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
              Celular
            </label>
            <TextField
              value={phone}
              onChange={onPhoneChange}
              placeholder="999 999 999"
              className="w-full custom-dark-input"
            >
              <Icon slot="leading-icon">smartphone</Icon>
            </TextField>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
              Código OTP
            </label>
            <TextField
              type="password"
              value={otp}
              onChange={onOtpChange}
              placeholder="6 dígitos"
              className="w-full custom-dark-input"
            >
              <Icon slot="leading-icon">verified_user</Icon>
            </TextField>
          </div>
        </div>
      </div>

      <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-400 text-lg">info</span>
        <p className="text-[11px] text-amber-100/70 leading-relaxed font-medium">
          Obtén tu <strong>Código de aprobación</strong> desde el menú de la app Yape e ingrésalo para confirmar.
        </p>
      </div>

      <style>{`
        .custom-dark-input {
          --md-outlined-text-field-container-shape: 12px;
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
