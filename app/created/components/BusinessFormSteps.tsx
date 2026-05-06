'use client';

import { verifyIdentityAction } from '@/features/kyb/kybActions';
import { Button, Icon, IconButton, Select, SelectOption, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { useRef, useState } from 'react';
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
 * Uses word-by-word matching: all words from user input must be in SUNAT name
 * (We DON'T require all SUNAT words to be in input, because the user might
 *  enter "JUAN PEREZ" while SUNAT returns "JUAN CARLOS PEREZ LOPEZ")
 */
function validateNameMatch(input: string, sunatName: string | undefined): boolean {
  if (!input || !sunatName) return false;

  const normalizedInput = normalizeName(input);
  const normalizedSunat = normalizeName(sunatName);

  // Split into words
  const inputWords = normalizedInput.split(' ').filter((w) => w.length > 0);
  const sunatWords = normalizedSunat.split(' ').filter((w) => w.length > 0);

  // All words from user input must be present in SUNAT name
  return inputWords.every((word) => sunatWords.includes(word));
}

interface StepProps {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  errors: FormErrors;
  onVerificationChange?: (isVerified: boolean) => void;
  isRucVerified?: boolean; // ← Para hacer campos read-only después de verificar
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

      // Parse representatives JSON string if it exists (PJ only)
      if (result.data?.representativesJson) {
        try {
          result.data.representatives = JSON.parse(result.data.representativesJson);
          // Clean up the JSON string to avoid confusion
          delete result.data.representativesJson;
        } catch (_parseError) {
          result.data.representatives = [];
        }
      }

      setIsRucVerified(true);
      setVerificationResult(result.data);

      // AUTO-SET personType from backend detection (NOT user selection)
      const detectedPersonType = result.data?.personType || 'natural';
      onChange('personType', detectedPersonType); // ← UPDATE the form data

      // ALWAYS set location fields (for BOTH PN and PJ) IMMEDIATELY after verification
      // This ensures data shows in Step 3 when modal opens
      // ⚠️ FIX: Use result.data instead of verificationResult (state is async in React!)
      if (result.data) {
        onChange('departamento', result.data.departamento || '');
        onChange('provincia', result.data.provincia || '');
        onChange('distrito', result.data.distrito || '');
        const fullAddress = `${result.data.departamento || ''}, ${result.data.provincia || ''}, ${result.data.distrito || ''}`;
        onChange('address', fullAddress);
      }

      // Reset validation fields - user MUST type them manually
      if (detectedPersonType === 'natural') {
        // For PN: Suggest the name from SUNAT, but let user type DNI manually
        setDniData({
          dni: '', // ← USER MUST TYPE THEIR 8-DIGIT DNI (not the 11-digit RUC!)
          fullName: verificationResult?.nombre_o_razon_social || '', // ← SUGGEST the name from SUNAT
        });
      } else {
        // For PJ: User must type representative's DNI and name
        setPjRepData({
          dni: '',
          fullName: '',
        });
      }

      // For BOTH person types: Skip Factiliza modal, go directly to validation
      // The RUC data is stored in verificationResult for backend validation
      // but we DON'T display it before the user validates their input
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
          disabled={true} // ← SOLO LECTURA (auto-detectado)
        />

        <Select
          label="País"
          outlined
          style={{ flex: 1 }}
          value="Perú" // ← SIEMPRE Perú (SASS solo funciona en Perú por ahora)
          disabled={true} // ← BLOQUEADO permanentemente
        >
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
          supportingText={isRucVerified ? '✓ Verificado con Factiliza' : 'Ingrese 11 dígitos (RUC)'}
        />
        <Button
          variant={isRucVerified ? 'tonal' : 'filled'}
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px', // Adjusted to align better within the input field
            transform: 'translateY(0)',
            borderRadius: '100px',
            padding: '8px 16px',
            minWidth: '100px',
            height: '36px',
          }}
          onClick={handleVerifyRuc}
          disabled={
            isVerifying || !formData.taxId || formData.taxId.length !== 11 || isRucVerified // Disable if already verified to avoid wasting API calls
          }
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
                  // Allow 8 digits (DNI) or 9+ digits (CE - Carné de Extranjería)
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const rawValue = getFieldValue(e).replace(/\D/g, '');
                    // Limit to reasonable length (max 12 digits for any document)
                    const value = rawValue.slice(0, 12);
                    setPjRepData((prev) => ({ ...prev, dni: value }));
                  }}
                  placeholder="12345678 (DNI) o 123456789 (CE)"
                  helperText="Ingrese DNI (8 dígitos) o CE (9 dígitos)"
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
                    if (
                      !validateNameMatch(
                        dniData.fullName,
                        verificationResult?.nombre_o_razon_social,
                      )
                    ) {
                      setVerifyError('Verificar apellidos y nombres. No coincide con SUNAT.');
                      return;
                    }
                    onChange('legalRepName', dniData.fullName);
                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  } else {
                    // NEW: PJ Representative Validation - 100% CLIENT-SIDE (ZERO API calls!)
                    if (!pjRepData.dni || !pjRepData.fullName) {
                      setVerifyError('Complete DNI y nombre del representante');
                      return;
                    }

                    // Get representatives from verificationResult (already fetched in Step 1)
                    // IMPORTANT: Server returns 'representatives' (English), NOT 'representantes'
                    const representatives = verificationResult?.representatives || [];

                    if (representatives.length === 0) {
                      setVerifyError(
                        'No se encontraron representantes para este RUC. Verifique el RUC nuevamente.',
                      );
                      return;
                    }

                    // Normalize user input
                    const normalizedInputName = normalizeName(pjRepData.fullName);
                    const normalizedInputDni = pjRepData.dni.trim();

                    // Check if DNI + Name match any representative
                    // API returns: tipo_de_documento, numero_de_documento, nombre
                    const match = representatives.some((rep: any) => {
                      const repDni = (rep.numero_de_documento || '').trim();
                      const repFullName = normalizeName(rep.nombre || '');

                      // Match DNI (exact match)
                      const dniMatch = repDni === normalizedInputDni;

                      // Match Name (BIDIRECTIONAL - more strict)
                      // 1. All words from user input must be in rep name
                      // 2. Most words from rep name must be in user input (avoid "MART" matching "MARTIN")
                      const inputWords = normalizedInputName
                        .split(' ')
                        .filter((w: string) => w.length > 0);
                      const repWords = repFullName.split(' ').filter((w: string) => w.length > 0);

                      // User words in rep name (more flexible - allows abbreviations)
                      const userWordsInRep = inputWords.every((word: string) =>
                        repFullName.includes(word),
                      );

                      // Rep words in user input (more strict - prevents "MART" from matching "MARTIN")
                      // Allow up to 1 missing word (for middle names/abbreviations)
                      const missingWords = repWords.filter(
                        (word: string) => !normalizedInputName.includes(word),
                      );
                      const repWordsInUser = missingWords.length <= 1; // Allow 1 word difference

                      const nameMatch = userWordsInRep && repWordsInUser;

                      return dniMatch && nameMatch;
                    });

                    if (!match) {
                      setVerifyError(
                        'El DNI y nombre ingresados no coinciden con los representantes legales registrados en SUNAT para este RUC.',
                      );
                      return;
                    }

                    // SUCCESS! Save validated data
                    // ⚠️ FIX: Use formData.personType instead of detectedPersonType (not in scope)

                    // ALWAYS set location fields (for BOTH PN and PJ)
                    onChange('departamento', verificationResult?.departamento || '');
                    onChange('provincia', verificationResult?.provincia || '');
                    onChange('distrito', verificationResult?.distrito || '');
                    const fullAddress = `${verificationResult?.departamento || ''}, ${verificationResult?.provincia || ''}, ${verificationResult?.distrito || ''}`;
                    onChange('address', fullAddress);

                    if (formData.personType === 'natural') {
                      // PN: Set legalRepName to user input, leave commercialName empty for user to fill
                      onChange('legalRepName', dniData.fullName);
                      // commercialName is NOT set (user will fill it as their business name)
                    } else {
                      // PJ: Set commercialName to razon_social, legalRepName to representative
                      onChange('commercialName', verificationResult?.nombre_o_razon_social || '');
                      onChange('legalRepName', pjRepData.fullName);
                    }

                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  }
                }}
                disabled={
                  formData.personType === 'natural'
                    ? !dniData.fullName
                    : !pjRepData.dni || !pjRepData.fullName || isValidatingRep
                }
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Commercial Name */}
      {/* PN: Enabled (user fills business name). PJ: Disabled (comes from SUNAT as Razón Social) */}
      <TextField
        label={formData.personType === 'natural' ? 'Nombre Comercial (opcional)' : 'Razón Social'}
        placeholder={formData.personType === 'natural' ? 'Mi Negocio' : formData.commercialName}
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.commercialName}
        disabled={isRucVerified && formData.personType === 'juridica'} // ← Only disable for PJ (SUNAT data)
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('commercialName', getFieldValue(e));
        }}
        error={!!errors.commercialName}
        errorText={errors.commercialName}
        helperText={
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

export const Step3Contact = ({ formData, onChange, errors, isRucVerified }: StepProps) => (
  <>
    {/* ALL location fields are READ-ONLY when RUC is verified (both PN and PJ) */}
    <div className="flex-responsive-row gap-md">
      <TextField
        label="DEPARTAMENTO"
        placeholder="Lima"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.departamento}
        disabled={isRucVerified} // ← READ-ONLY for BOTH PN and PJ when verified
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('departamento', getFieldValue(e));
        }}
        error={!!errors.departamento}
        errorText={errors.departamento}
        helperText={isRucVerified ? 'Verificado por SUNAT (no editable)' : ''}
      >
        <Icon slot="trailing-icon">map</Icon>
      </TextField>

      <TextField
        label="PROVINCIA"
        placeholder="Lima"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.provincia}
        disabled={isRucVerified} // ← READ-ONLY for BOTH PN and PJ when verified
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('provincia', getFieldValue(e));
        }}
        error={!!errors.provincia}
        errorText={errors.provincia}
        helperText={isRucVerified ? 'Verificado por SUNAT (no editable)' : ''}
      />
    </div>

    <div className="flex-responsive-row gap-md" style={{ marginTop: '16px' }}>
      <TextField
        label="DISTRITO"
        placeholder="Miraflores"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.distrito}
        disabled={isRucVerified} // ← READ-ONLY for BOTH PN and PJ when verified
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('distrito', getFieldValue(e));
        }}
        error={!!errors.distrito}
        errorText={errors.distrito}
        helperText={isRucVerified ? 'Verificado por SUNAT (no editable)' : ''}
      >
        <Icon slot="trailing-icon">location_on</Icon>
      </TextField>

      <TextField
        label="Ciudad (Opcional)"
        placeholder="Lima"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.city}
        // ← Ciudad is OPTIONAL and editable (user can type their city even after RUC verification)
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('city', getFieldValue(e));
        }}
        error={!!errors.city}
        errorText={errors.city}
      />
    </div>

    <div className="flex-responsive-row gap-md" style={{ marginTop: '16px' }}>
      <TextField
        label="Teléfono"
        placeholder="999 999 999"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.phone}
        prefixText={formData.countryPrefix}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('phone', getFieldValue(e));
        }}
        error={!!errors.phone}
        errorText={errors.phone}
      >
        <Icon slot="trailing-icon">phone</Icon>
      </TextField>

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
  </>
);

export const Step4Legal = ({ formData, onChange, errors, isRucVerified }: StepProps) => (
  <>
    {/* Nombre del Representante: READ-ONLY after verification (comes from SUNAT) */}
    <TextField
      label={
        formData.personType === 'natural' ? 'Nombre Completo' : 'Nombre del Representante Legal'
      }
      variant="outlined"
      style={{ width: '100%' }}
      value={formData.legalRepName}
      disabled={isRucVerified} // ← READ-ONLY when verified
      onInput={(e: React.FormEvent<HTMLElement>) => {
        onChange('legalRepName', getFieldValue(e));
      }}
      error={!!errors.legalRepName}
      errorText={errors.legalRepName}
      helperText={isRucVerified ? 'Verificado por SUNAT (no editable)' : ''}
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
      <TextField
        label="Celular de contacto"
        placeholder="999 999 999"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.phone} // ← Use phone from Phase 3 (user input)
        prefixText={formData.countryPrefix}
        // ← REMOVED disabled: user wants this editable
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('phone', getFieldValue(e)); // ← Update phone in formData
        }}
        error={!!errors.phone}
        errorText={errors.phone}
      >
        <Icon slot="trailing-icon">smartphone</Icon>
      </TextField>

      <TextField
        label="Email de contacto"
        placeholder="gerente@empresa.com"
        variant="outlined"
        style={{ flex: 1 }}
        value={formData.email} // ← Use email from Phase 3 (user input)
        type="email"
        // ← REMOVED disabled: user wants this editable
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('email', getFieldValue(e)); // ← Update email in formData
        }}
        error={!!errors.email}
        errorText={errors.email}
      >
        <Icon slot="trailing-icon">alternate_email</Icon>
      </TextField>
    </div>
  </>
);
