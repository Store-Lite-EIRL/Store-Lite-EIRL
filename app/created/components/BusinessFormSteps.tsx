'use client';

import { Button, Icon, IconButton, Select, SelectOption, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { requestOtpAction, verifyIdentityAction, verifyOtpAction } from '@app/actions/kyb';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BUSINESS_SECTORS, CARGO_OPTIONS } from '../constants';
import type { BusinessData, FormErrors } from '../types';

/**
 * Normalizes a name for comparison: removes accents, punctuation (commas, dots),
 * converts to uppercase, removes extra spaces
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD') // Separate accents from letters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^A-Z0-9\s]/gi, '') // Remove punctuation (commas, dots, etc.)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .toUpperCase();
}

/**
 * Validates if the user input matches the SUNAT registered name
 * Uses word-by-word matching with STRICT validation:
 * 1. All words from user input must be in SUNAT name
 * 2. User input must cover at least 60% of SUNAT name words (prevents "TACORA" only)
 */
function validateNameMatch(input: string, sunatName: string | undefined): boolean {
  if (!input || !sunatName) return false;

  const normalizedInput = normalizeName(input);
  const normalizedSunat = normalizeName(sunatName);

  // EXACT MATCH after normalization (simplest and most secure)
  // This ensures user types the COMPLETE name exactly as it appears in SUNAT
  return normalizedInput === normalizedSunat;
}

interface StepProps {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  errors: FormErrors;
  onVerificationChange?: (isVerified: boolean) => void;
  isRucVerified?: boolean; // ← Para hacer campos read-only después de verificar
  verifiedPhone?: string | null; // Número de teléfono verificado (null si ninguno)
  onPhoneVerificationChange?: (phone: string | null) => void;
}

const getFieldValue = (event: React.FormEvent<HTMLElement>) =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;

export const Step1General = ({
  formData,
  onChange,
  errors,
  onFileChange,
  onVerificationChange,
}: StepProps & { onFileChange?: (file: File | null) => void }) => {
  const logoUploadRef = useRef<HTMLInputElement>(null);

  // Verification states
  const [isRucVerified, setIsRucVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Modal states for validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [dniData, setDniData] = useState({ dni: '', fullName: '' });
  const [businessData, setBusinessData] = useState({
    name: '',
    departamento: '',
    provincia: '',
    distrito: '',
  });
  // NEW: State for PJ Representative validation
  const [pjRepData, setPjRepData] = useState({ dni: '', fullName: '' });
  const [isValidatingRep, setIsValidatingRep] = useState(false);

  // State to hold Factiliza verification result
  // For Natural: FactilizaRucInfo (no representatives)
  // For PJ: FactilizaRucWithRepresentatives (includes representatives)
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Handle RUC verification with Factiliza
  const handleVerifyRuc = async () => {
    if (!formData.taxId || formData.taxId.length !== 11) return;

    // NOTE: Prefix validation ("10" vs "20") removed because:
    // 1. Some PN RUCs start with "20" (foreigners, special cases)
    // 2. We now use `tipo_contribuyente` from API to detect PN vs PJ
    // 3. The backend validates this strictly in kybActions.ts

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('documentNumber', formData.taxId);
      // IMPORTANT: We NO LONGER send personType - backend DETECTS it from tipo_contribuyente

      const result = await verifyIdentityAction(formDataObj);

      if (result.error) {
        setVerifyError(result.error);
        return;
      }

      const verificationData = result.data as
        | (typeof result.data & {
            representatives?: any[];
            representativesJson?: string;
          })
        | undefined;

      // Parse representatives JSON string if it exists (PJ only)
      if (verificationData?.representativesJson) {
        try {
          verificationData.representatives = JSON.parse(verificationData.representativesJson);
        } catch (_parseError) {
          verificationData.representatives = [];
        }
      }

      setIsRucVerified(true);
      setVerificationResult(verificationData);

      // AUTO-SET personType from backend detection (NOT user selection)
      const detectedPersonType = verificationData?.personType || 'natural';
      onChange('personType', detectedPersonType); // â† UPDATE the form data

      // ALWAYS set location fields (for BOTH PN and PJ) IMMEDIATELY after verification
      // This ensures data shows in Step 3 when modal opens
      if (verificationData) {
        onChange('departamento', verificationData.departamento || '');
        onChange('provincia', verificationData.provincia || '');
        onChange('distrito', verificationData.distrito || '');
        const fullAddress = `${verificationData.departamento || ''}, ${verificationData.provincia || ''}, ${verificationData.distrito || ''}`;
        onChange('address', fullAddress);
      }

      // Reset validation fields - user MUST type them manually
      // NOTE: personType comes from API in ENGLISH ("natural", "juridica")
      if (detectedPersonType === 'natural') {
        // For PN: Suggest the name from SUNAT, but let user type DNI manually
        setDniData({
          dni: '', // â† USER MUST TYPE THEIR 8-DIGIT DNI (not the 11-digit RUC!)
          fullName: '', // â† USER MUST TYPE THEIR NAME to confirm identity
        });

        // âœ… PN: Mark as verified
        onVerificationChange?.(true);
      } else {
        // For PJ: User must type representative's DNI and name
        setPjRepData({
          dni: '',
          fullName: '',
        });
      }

      // For BOTH person types: Open validation modal
      setShowValidationModal(true);
    } catch (err: any) {
      setVerifyError(err.message || 'Error al verificar');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      {/* Row 1: Person Type (Auto-detected) & Country */}
      <div className="flex-responsive-row gap-md">
        <TextField
          label="Tipo de Persona (Detectado)"
          variant="outlined"
          style={{ flex: 1 }}
          value={
            isRucVerified && verificationResult?.personType
              ? verificationResult.personType === 'natural'
                ? 'Persona Natural (con Negocio)'
                : 'Persona Jurídica'
              : 'Se detectará al verificar RUC'
          }
          disabled={true} // â† SOLO LECTURA (auto-detectado)
        />

        <Select label="Paí­s" outlined style={{ flex: 1 }} value="Perú" disabled={true}>
          <SelectOption value="Perú" selected={true}>
            Perú
          </SelectOption>
        </Select>
      </div>

      {/* Row 2: RUC Input with Verify Button Inside */}
      <div style={{ position: 'relative', flex: 1 }}>
        <TextField
          label="RUC"
          placeholder="12345678901"
          variant="outlined"
          style={{ width: '100%' }}
          value={formData.taxId}
          maxLength={11}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            const value = getFieldValue(e).replace(/\D/g, ''); // Ensure only numbers
            onChange('taxId', value);
            setIsRucVerified(false); // Reset verification on change
            setVerifyError(null);
          }}
          error={!!errors.taxId}
          errorText={errors.taxId}
          supportingText={isRucVerified ? 'Verificado con Factiliza' : 'Ingrese 11 dígitos (RUC)'}
        />
        <Button
          variant={isRucVerified ? 'tonal' : 'filled'}
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
          onClick={handleVerifyRuc}
          disabled={isVerifying || !formData.taxId || formData.taxId.length !== 11 || isRucVerified}
        >
          {isVerifying ? '...' : isRucVerified ? '✓' : 'Verificar'}
        </Button>
      </div>

      {/* Verification Error Display */}
      {verifyError && (
        <div style={{ color: 'var(--md-sys-color-error)', fontSize: '0.875rem', marginTop: '8px' }}>
          {verifyError}
        </div>
      )}

      {/* MODAL 2: User Validation (Where user types their info) */}
      {showValidationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {formData.personType === 'natural'
                ? 'Validar Datos Personales'
                : 'Validar Datos del Negocio'}
            </h2>

            {formData.personType === 'natural' ? (
              <>
                <TextField
                  label="RUC"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={formData.taxId}
                  disabled={true}
                />
                <TextField
                  label="Apellidos y Nombres (como aparece en DNI)"
                  variant="outlined"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={dniData.fullName}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const value = getFieldValue(e).toUpperCase();
                    setDniData((prev) => ({ ...prev, fullName: value }));
                  }}
                />
              </>
            ) : (
              <>
                {/* NEW: PJ Representative Validation */}
                <TextField
                  label="RUC"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={formData.taxId}
                  disabled={true}
                />
                <TextField
                  label="DNI/CE del Representante Legal"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={pjRepData.dni}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const rawValue = getFieldValue(e).replace(/\D/g, '');
                    const value = rawValue.slice(0, 12);
                    setPjRepData((prev) => ({ ...prev, dni: value }));
                  }}
                  placeholder="12345678 (DNI) o 123456789 (CE)"
                  supportingText="Ingrese DNI (8 dígitos) o CE (9 dígitos)"
                />
                <TextField
                  label="Apellidos y Nombres del Representante (como aparece en DNI)"
                  variant="outlined"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={pjRepData.fullName}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const value = getFieldValue(e).toUpperCase();
                    setPjRepData((prev) => ({ ...prev, fullName: value }));
                  }}
                  placeholder="PEPE GARCIA"
                />
              </>
            )}

            {/* Error display inside modal */}
            {verifyError && (
              <div
                style={{
                  color: 'var(--md-sys-color-error)',
                  fontSize: '0.875rem',
                  marginTop: '8px',
                }}
              >
                {verifyError}
              </div>
            )}

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}
            >
              <Button
                variant="filled"
                onClick={async () => {
                  if (formData.personType === 'natural') {
                    if (!validateNameMatch(dniData.fullName, verificationResult?.legalRepName)) {
                      setVerifyError('Verificar apellidos y nombres. No coincide con SUNAT.');
                      return;
                    }
                    onChange('legalRepName', dniData.fullName);
                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  } else {
                    // PJ: Validate representative against API data
                    if (!pjRepData.dni || !pjRepData.fullName) {
                      setVerifyError('Complete DNI y nombre del representante');
                      return;
                    }

                    const representatives = verificationResult?.representatives || [];

                    if (representatives.length === 0) {
                      setVerifyError(
                        'No se encontraron representantes para este RUC. Verifique el RUC nuevamente.',
                      );
                      return;
                    }

                    // Check if DNI + Name match any representative
                    const match = representatives.some((rep: any) => {
                      const repDni = (rep.numero_de_documento || '').trim();
                      const repFullName = normalizeName(rep.nombre || '');

                      const dniMatch = repDni === pjRepData.dni.trim();

                      const inputWords = normalizeName(pjRepData.fullName)
                        .split(' ')
                        .filter((w: string) => w.length > 0);
                      const repWords = repFullName.split(' ').filter((w: string) => w.length > 0);

                      const userWordsInRep = inputWords.every((word: string) =>
                        repFullName.includes(word),
                      );

                      const missingWords = repWords.filter(
                        (word: string) => !normalizeName(pjRepData.fullName).includes(word),
                      );
                      const repWordsInUser = missingWords.length <= 1;

                      return dniMatch && userWordsInRep && repWordsInUser;
                    });

                    if (!match) {
                      setVerifyError(
                        'El DNI y nombre ingresados no coinciden con los representantes legales registrados en SUNAT para este RUC.',
                      );
                      return;
                    }

                    // SUCCESS! Save validated data
                    onChange('departamento', verificationResult?.departamento || '');
                    onChange('provincia', verificationResult?.provincia || '');
                    onChange('distrito', verificationResult?.distrito || '');
                    const fullAddress = `${verificationResult?.departamento || ''}, ${verificationResult?.provincia || ''}, ${verificationResult?.distrito || ''}`;
                    onChange('address', fullAddress);
                    onChange('commercialName', verificationResult?.razonSocial || '');
                    onChange('legalRepName', pjRepData.fullName);

                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  }
                }}
                disabled={
                  formData.personType === 'natural'
                    ? !dniData.fullName
                    : !pjRepData.dni || !pjRepData.fullName
                }
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Commercial Name */}
      <TextField
        label={formData.personType === 'natural' ? 'Nombre Comercial (opcional)' : 'Razón Social'}
        placeholder={formData.personType === 'natural' ? 'Mi Negocio' : formData.commercialName}
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.commercialName}
        maxLength={100}
        disabled={isRucVerified && formData.personType === 'juridica'}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('commercialName', getFieldValue(e));
        }}
        error={!!errors.commercialName}
        errorText={errors.commercialName}
        supportingText={
          isRucVerified && formData.personType === 'juridica'
            ? 'Verificado por SUNAT (no editable)'
            : ''
        }
      />

      {/* Row 4: Logo Upload */}
      <div className="flex-column gap-sm">
        <label className="body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Logo de la Empresa (Opcional)
        </label>
        <div className="flex-row flex-align-center gap-md">
          <div style={{ position: 'relative' }}>
            <Button
              variant="tonal"
              style={{
                borderRadius: '12px',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => logoUploadRef.current?.click()}
            >
              Subir Logo
              <Icon slot="icon" size={23}>
                upload
              </Icon>
            </Button>
            <input
              id="logo-upload"
              ref={logoUploadRef}
              type="file"
              accept="image/*"
              title="Subir logo de la empresa"
              placeholder="Seleccionar archivo"
              style={{ display: 'none' }}
              onChange={(e) => {
                onFileChange?.(e.target.files?.[0] || null);
              }}
            />
          </div>

          {formData.logo && (
            <div
              className="flex-row flex-align-center gap-sm surface-container-low"
              style={{
                paddingLeft: 20,
                borderRadius: '20px',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <span
                className="label-medium"
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formData.logo.name}
              </span>
              <IconButton onClick={() => onFileChange?.(null)} style={{ padding: '4px' }}>
                <Icon size={18}>close</Icon>
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export const Step2Economic = ({ formData, onChange, errors, isRucVerified }: StepProps) => (
  <>
    <Select
      label="Sector"
      outlined
      style={{ width: '100%' }}
      value={formData.sector}
      onChange={(e: MaterialSelectEvent) => {
        onChange('sector', getMaterialSelectValue(e));
      }}
      error={!!errors.sector}
      errorText={errors.sector}
    >
      {BUSINESS_SECTORS.map((s) => (
        <SelectOption key={s} value={s} selected={formData.sector === s}>
          {s}
        </SelectOption>
      ))}
    </Select>

    <TextField
      label="Descripción de la Empresa"
      placeholder="Describe brevemente lo que hace tu empresa..."
      variant="outlined"
      type="textarea"
      rows={4}
      style={{ width: '100%' }}
      value={formData.description}
      onInput={(e: React.FormEvent<HTMLElement>) => {
        onChange('description', getFieldValue(e));
      }}
      maxLength={150}
      supportingText={`${formData.description.length}/150 caracteres`}
      error={!!errors.description}
      errorText={errors.description}
    />
  </>
);

const OTP_LENGTH = 6;
const EMPTY_OTP_DIGITS = Array(OTP_LENGTH).fill('') as string[];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface PhoneOtpVerificationOptions {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  verifiedPhone?: string | null;
  onPhoneVerificationChange?: (phone: string | null) => void;
}

function usePhoneOtpVerification({
  formData,
  onChange,
  verifiedPhone,
  onPhoneVerificationChange,
}: PhoneOtpVerificationOptions) {
  const isVerified = verifiedPhone !== null && formData.phone === verifiedPhone;
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    onChange('phone', digits);
    if (otpError) setOtpError(null);
  };

  const handleRequestOtp = async () => {
    const phone = formData.phone.trim();
    if (phone.length !== 9) return;

    setIsOtpSending(true);
    setOtpError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('identifier', phone);
      formDataObj.append('type', 'phone');
      formDataObj.append('countryPrefix', formData.countryPrefix || '+51');

      const result = await requestOtpAction(formDataObj);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setOtpDigits([...EMPTY_OTP_DIGITS]);
      setOtpError(null);
      setShowOtpModal(true);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
      setOtpError(getErrorMessage(error, 'Error al enviar código'));
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setOtpError(null);

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData.length === 0) return;

    event.preventDefault();

    const newDigits = pastedData.split('').concat(EMPTY_OTP_DIGITS).slice(0, OTP_LENGTH);
    setOtpDigits(newDigits);

    const nextEmpty = newDigits.findIndex((digit) => digit === '');
    const focusIndex = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpError(null);
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) return;

    setIsOtpVerifying(true);
    setOtpError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('identifier', formData.phone.trim());
      formDataObj.append('code', code);

      const result = await verifyOtpAction(formDataObj);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setShowOtpModal(false);
      setOtpError(null);
      onPhoneVerificationChange?.(formData.phone);
    } catch (error: unknown) {
      setOtpError(getErrorMessage(error, 'Error al verificar código'));
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const resendOtp = () => {
    setOtpDigits([...EMPTY_OTP_DIGITS]);
    setOtpError(null);
    void handleRequestOtp();
  };

  return {
    closeOtpModal,
    handleOtpInput,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePhoneChange,
    handleRequestOtp,
    handleVerifyOtp,
    isOtpSending,
    isOtpVerifying,
    isVerified,
    otpDigits,
    otpError,
    otpInputRefs,
    resendOtp,
    showOtpModal,
  };
}

export const Step3Contact = ({
  formData,
  onChange,
  errors,
  isRucVerified,
  verifiedPhone,
  onPhoneVerificationChange,
}: StepProps) => {
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
};

export const Step4Legal = ({
  formData,
  onChange,
  errors,
  isRucVerified,
  verifiedPhone,
  onPhoneVerificationChange,
}: StepProps) => {
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
            disabled={false} // Siempre editable — si cambia el nro, se pide re-verificar
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
};
