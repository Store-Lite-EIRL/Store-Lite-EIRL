'use client';

import { Button, Icon, Select, SelectOption, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { getFieldValue } from '@/shared/utils/domElements';
import { createPortal } from 'react-dom';
import { CARGO_OPTIONS } from '../constants';
import { usePhoneOtpVerification } from '../hooks/usePhoneOtpVerification';
import type { StepProps } from '../types';

export default function Step4Legal({
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
      {/* Nombre del Representante: ALWAYS READ-ONLY (comes from SUNAT in Phase 1) */}
      <TextField
        label={
          formData.personType === 'natural' ? 'Nombre Completo' : 'Nombre del Representante Legal'
        }
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.legalRepName}
        disabled={true}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('legalRepName', getFieldValue(e));
        }}
        error={!!errors.legalRepName}
        errorText={errors.legalRepName}
        supportingText="Verificado por SUNAT (no editable)"
      />

      <div className="flex-column gap-sm">
        <Select
          label="Cargo"
          outlined
          style={{ width: '100%' }}
          value={CARGO_OPTIONS.includes(formData.legalRepRole) ? formData.legalRepRole : 'Otro'}
          onChange={(e: MaterialSelectEvent) => {
            const value = getMaterialSelectValue(e);
            if (value !== 'Otro') {
              onChange('legalRepRole', value);
            }
          }}
        >
          {CARGO_OPTIONS.map((o) => (
            <SelectOption
              key={o}
              value={o}
              selected={
                formData.legalRepRole === o ||
                (o === 'Otro' && !CARGO_OPTIONS.includes(formData.legalRepRole))
              }
            >
              {o}
            </SelectOption>
          ))}
        </Select>

        {(!CARGO_OPTIONS.includes(formData.legalRepRole) || formData.legalRepRole === 'Otro') && (
          <TextField
            label="Especifique Cargo"
            placeholder="Ej. Apoderado, Socio"
            variant="outlined"
            style={{ width: '100%' }}
            value={formData.legalRepRole === 'Otro' ? '' : formData.legalRepRole}
            onInput={(e: React.FormEvent<HTMLElement>) => {
              onChange('legalRepRole', getFieldValue(e));
            }}
            error={!!errors.legalRepRole}
            errorText={errors.legalRepRole}
          />
        )}
      </div>

      <div className="flex-responsive-row gap-md">
        <div style={{ position: 'relative', flex: 1 }}>
          <TextField
            label="Celular de contacto"
            placeholder="999 999 999"
            variant="outlined"
            style={{ width: '100%' }}
            value={formData.phone}
            prefixText={formData.countryPrefix}
            disabled={false}
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
                  : formData.phone.length === 9
                    ? 'Presione Verificar para validar'
                    : 'Ingrese 9 dígitos'
            }
          >
            {otp.isVerified ? (
              <Icon slot="trailing-icon">verified</Icon>
            ) : (
              <Icon slot="trailing-icon">smartphone</Icon>
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
          label="Email de contacto"
          placeholder="gerente@empresa.com"
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
          <Icon slot="trailing-icon">alternate_email</Icon>
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
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={otp.closeOtpModal}
          >
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                Verificar teléfono
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  marginBottom: '24px',
                }}
              >
                Ingresa el código de 6 dígitos enviado a{' '}
                <strong>
                  {formData.countryPrefix} {formData.phone}
                </strong>
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                {otp.otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otp.otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => otp.handleOtpInput(index, e.target.value)}
                    onPaste={index === 0 ? otp.handleOtpPaste : undefined}
                    onKeyDown={(e) => otp.handleOtpKeyDown(index, e)}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      border: `2px solid ${otp.otpDigits[index] ? 'var(--md-sys-color-primary)' : otp.otpError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline)'}`,
                      borderRadius: '12px',
                      outline: 'none',
                      backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)',
                      caretColor: 'transparent',
                    }}
                  />
                ))}
              </div>

              {otp.otpError && (
                <p
                  style={{
                    color: 'var(--md-sys-color-error)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                  }}
                >
                  {otp.otpError}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="text"
                  style={{ borderRadius: '100px' }}
                  onClick={() => {
                    otp.closeOtpModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outlined"
                  style={{ borderRadius: '100px' }}
                  onClick={() => {
                    otp.resendOtp();
                  }}
                  disabled={otp.isOtpSending}
                >
                  Reenviar código
                </Button>
                <Button
                  variant="filled"
                  style={{ borderRadius: '100px', padding: '0 24px' }}
                  onClick={otp.handleVerifyOtp}
                  disabled={otp.otpDigits.join('').length !== 6 || otp.isOtpVerifying}
                >
                  {otp.isOtpVerifying ? 'Validando...' : 'Validar'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
