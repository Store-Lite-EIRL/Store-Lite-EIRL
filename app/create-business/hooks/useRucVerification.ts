'use client';

import { verifyIdentityAction } from '@app/actions/kyb';
import { useState } from 'react';
import type { BusinessData } from '../types';

export interface UseRucVerificationOptions {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  onVerificationChange?: (isVerified: boolean) => void;
}

export function useRucVerification({
  formData,
  onChange,
  onVerificationChange,
}: UseRucVerificationOptions) {
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

  // State to hold RUC verification result
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Handle RUC verification via API
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
      onChange('personType', detectedPersonType); // ← UPDATE the form data

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
          dni: '', // ← USER MUST TYPE THEIR 8-DIGIT DNI (not the 11-digit RUC!)
          fullName: '', // ← USER MUST TYPE THEIR NAME to confirm identity
        });

        // ✅ PN: Mark as verified
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

  return {
    isRucVerified,
    isVerifying,
    verifyError,
    showValidationModal,
    verificationResult,
    dniData,
    pjRepData,
    isValidatingRep,
    handleVerifyRuc,
    setVerifyError,
    setShowValidationModal,
    setDniData,
    setPjRepData,
    setIsRucVerified,
  };
}
