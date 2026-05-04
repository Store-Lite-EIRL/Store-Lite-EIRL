// =====================================================
// KYB STEP 3: OTP Verification (WhatsApp)
// =====================================================
// Description: Request OTP via WhatsApp and verify code
// =====================================================

'use client';

import { useState } from 'react';
import { requestOtpAction, verifyOtpAction } from './kybActions';
import type { WizardData } from './kybWizard';

export function KybStep3Otp({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  initialData: WizardData;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleRequestOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get('identifier')) return;

    setOtpError(null);
    const res = await requestOtpAction(formData);
    if (res.error) {
      setOtpError(res.error);
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOTP = async (formData: FormData) => {
    setIsVerifying(true);
    setOtpError(null);
    const res = await verifyOtpAction(formData);
    setIsVerifying(false);
    if (res.error) {
      setOtpError(res.error);
      return;
    }
    // Mark as verified and move to next step
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <md-headline-small>Verificación de Teléfono</md-headline-small>
      <p className="text-on-surface-variant">Paso 3 de 4. Verifica tu número de WhatsApp.</p>

      {/* Phone Input Form */}
      <form onSubmit={handleRequestOTP} className="space-y-4">
        <md-outlined-text-field
          name="identifier"
          label="Número de WhatsApp (9XXXXXXXXX)"
          required
          className="w-full"
          defaultValue={initialData.legalRepPhone}
        />
        <md-filled-button type="submit" disabled={loading || otpSent}>
          {otpSent ? 'Código Reenviado' : 'Enviar Código OTP'}
        </md-filled-button>
      </form>

      {/* OTP Input Modal/Section */}
      {otpSent && (
        <div className="bg-secondary-container p-4 rounded-lg space-y-4">
          <p>Ingresa el código de 6 dígitos que enviamos a tu WhatsApp.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              formData.append('identifier', initialData.legalRepPhone || '');
              handleVerifyOTP(formData);
            }}
            className="flex gap-2"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <md-outlined-text-field
                key={i}
                name={`otp-${i}`}
                required
                maxlength={1}
                className="w-12 text-center"
              />
            ))}
            <md-filled-button type="submit" disabled={isVerifying}>
              {isVerifying ? 'Verificando...' : 'Validar'}
            </md-filled-button>
          </form>
        </div>
      )}

      {otpError && <div className="text-error">{otpError}</div>}
    </div>
  );
}
