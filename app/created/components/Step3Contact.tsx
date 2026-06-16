'use client';

import { Button, Icon, TextField } from '@/shared/components/ui';
import { getFieldValue } from '@/shared/utils/domElements';
import { createPortal } from 'react-dom';
import { usePhoneOtpVerification } from '../hooks/usePhoneOtpVerification';
import type { StepProps } from '../types';

export default function Step3Contact({
  formData,
  onChange,
  errors,
  isRucVerified,
  verifiedPhone,
  onPhoneVerificationChange,
}: StepProps) {
  const otp = usePhoneOtpVerification({
    formData,
    onChange,
    verifiedPhone,
    onPhoneVerificationChange,
  });

  return (
    <>
      {/* ALL location fields are ALWAYS READ-ONLY - data comes from SUNAT */}
      <div className="flex-responsive-row gap-md">
        <TextField
          label="DEPARTAMENTO"
          placeholder="Lima"
          variant="outlined"
          style={{ flex: 1 }}
          value={formData.departamento}
          disabled={true}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('departamento', getFieldValue(e));
          }}
          error={!!errors.departamento}
          errorText={errors.departamento}
          supportingText="Verificado por SUNAT (no editable)"
        >
          <Icon slot="trailing-icon">map</Icon>
        </TextField>

        <TextField
          label="PROVINCIA"
          placeholder="Lima"
          variant="outlined"
          style={{ flex: 1 }}
          value={formData.provincia}
          disabled={true}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('provincia', getFieldValue(e));
          }}
          error={!!errors.provincia}
          errorText={errors.provincia}
          supportingText="Verificado por SUNAT (no editable)"
        />
      </div>

      <div className="flex-responsive-row gap-md" style={{ marginTop: '16px' }}>
        <TextField
          label="DISTRITO"
          placeholder="Miraflores"
          variant="outlined"
          style={{ flex: 1 }}
          value={formData.distrito}
          disabled={true}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('distrito', getFieldValue(e));
          }}
          error={!!errors.distrito}
          errorText={errors.distrito}
          supportingText="Verificado por SUNAT (no editable)"
        >
          <Icon slot="trailing-icon">location_on</Icon>
        </TextField>

        <TextField
          label="Ciudad (Opcional)"
          placeholder="Lima"
          variant="outlined"
          style={{ flex: 1 }}
          value={formData.city}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('city', getFieldValue(e));
          }}
          error={!!errors.city}
          errorText={errors.city}
        />
      </div>

      <div className="flex-responsive-row gap-md" style={{ marginTop: '16px' }}>
        {/* Phone field with inline Verify button */}
        <div style={{ position: 'relative', flex: 1 }}>
          <TextField
            label="Teléfono"
            placeholder="999 999 999"
            variant="outlined"
            style={{ width: '100%' }}
            value={formData.phone}
            prefixText={formData.countryPrefix}
            disabled={otp.isVerified}
            maxLength={9}
            onInput={(e: React.FormEvent<HTMLElement>) => {
              otp.handlePhoneChange(getFieldValue(e));
            }}
            error={!!errors.phone || !!otp.otpError}
            errorText={errors.phone || otp.otpError || ''}
            supportingText={
              otp.isVerified
                ? '✓ Verificado con WhatsApp'
                : otp.otpError
                  ? otp.otpError
                  : 'Ingrese 9 dígitos'
            }
          >
            {otp.isVerified ? (
              <Icon slot="trailing-icon">verified</Icon>
            ) : (
              <Icon slot="trailing-icon">phone</Icon>
            )}
          </TextField>

          {/* Verify button — shows when 9 digits entered and not yet verified */}
          {formData.phone.length === 9 && !otp.isVerified && (
            <Button
              variant="filled"
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                transform: 'translateY(0)',
                borderRadius: '100px',
                padding: '8px 16px',
                minWidth: '100px',
                height: '36px',
              }}
              onClick={otp.handleRequestOtp}
              disabled={otp.isOtpSending}
            >
              {otp.isOtpSending ? '...' : 'Verificar'}
            </Button>
          )}
        </div>

        <TextField
          label="Email"
          placeholder="contacto@empresa.com"
          variant="outlined"
          style={{ flex: 1 }}
          value={formData.email}
          type="email"
          onInput={(e: React.FormEvent<HTMLElement>) => {
            onChange('email', getFieldValue(e));
          }}
          error={!!errors.email}
          errorText={errors.email}
        >
          <Icon slot="trailing-icon">mail</Icon>
        </TextField>
      </div>

      {/* ── OTP Verification Modal ──────────────────────────────── */}
      {otp.showOtpModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.32)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                padding: '24px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Verificar Teléfono</h2>
              <p
                style={{
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.875rem',
                  margin: 0,
                }}
              >
                Ingresa el código de 6 dígitos que enviamos a tu WhatsApp
                <br />
                <strong>
                  {formData.countryPrefix} {formData.phone}
                </strong>
              </p>

              {/* 6-digit OTP inputs */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  margin: '16px 0',
                }}
              >
                {otp.otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otp.otpInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => otp.handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => otp.handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? otp.handleOtpPaste : undefined}
                    autoComplete="one-time-code"
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      border: `2px solid ${
                        otp.otpError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline)'
                      }`,
                      borderRadius: '12px',
                      outline: 'none',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-on-surface)',
                      caretColor: 'var(--md-sys-color-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--md-sys-color-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = otp.otpError
                        ? 'var(--md-sys-color-error)'
                        : 'var(--md-sys-color-outline)';
                    }}
                  />
                ))}
              </div>

              {/* Error display */}
              {otp.otpError && (
                <div
                  style={{
                    color: 'var(--md-sys-color-error)',
                    fontSize: '0.875rem',
                    padding: '8px 12px',
                    backgroundColor: 'var(--md-sys-color-error-container)',
                    borderRadius: '8px',
                  }}
                >
                  {otp.otpError}
                </div>
              )}

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Button
                  variant="text"
                  onClick={() => {
                    otp.closeOtpModal();
                  }}
                >
                  Cancelar
                </Button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="text" onClick={otp.handleRequestOtp} disabled={otp.isOtpSending}>
                    Reenviar código
                  </Button>

                  <Button
                    variant="filled"
                    onClick={otp.handleVerifyOtp}
                    disabled={otp.otpDigits.join('').length !== 6 || otp.isOtpVerifying}
                  >
                    {otp.isOtpVerifying ? 'Validando...' : 'Validar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
