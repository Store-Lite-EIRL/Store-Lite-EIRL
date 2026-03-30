'use client';

import type { Business } from '@/core/database/schema';
import { useEffect, useState } from 'react';
import { useBusinessActions } from './useBusinessActions';
import { useLogoManager } from './useLogoManager';

const getInitialFormData = (business: Business | null) => ({
  name: business?.name || '',
  description: business?.description || '',
  address: business?.address || '',
  whatsappNumber: business?.whatsappNumber || '',
  storeType: business?.storeType || '',
  taxId: business?.taxId || '',
  personType: business?.personType || '',
  country: business?.country || '',
  city: business?.city || '',
  email: business?.email || '',
  legalRepName: business?.legalRepName || '',
  legalRepRole: business?.legalRepRole || '',
  legalRepPhone: business?.legalRepPhone || '',
  legalRepEmail: business?.legalRepEmail || '',
});

export function useBusinessSettings(business: Business | null, open: boolean) {
  const [formData, setFormData] = useState(getInitialFormData(business));
  const [isSaving, setIsSaving] = useState(false);

  const { alert, setAlert, handleSave, closeAlert } = useBusinessActions(isSaving, setIsSaving);
  const { logoPreview, setLogoPreview, isUpdatingLogo, handleLogoUpload } = useLogoManager(
    business?.id,
    business?.slug,
    business?.logoUrl || null,
    setAlert
  );

  // Sync state when business prop changes
  useEffect(() => {
    if (!business) return;
    setFormData(getInitialFormData(business));
    setLogoPreview(business.logoUrl || null);
  }, [business, open, setLogoPreview]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = business
    ? (Object.keys(formData) as (keyof typeof formData)[]).some((key) => {
        const businessKey = key as keyof Business;
        const originalValue = (business[businessKey] as string) || '';
        return formData[key] !== originalValue;
      })
    : false;

  const onSave = () => {
    if (business) {
      handleSave(business.id, business.slug, formData, hasChanges);
    }
  };

  return {
    formData,
    handleChange,
    logoPreview,
    setLogoPreview,
    isUpdatingLogo,
    isSaving,
    hasChanges,
    alert,
    handleSave: onSave,
    handleLogoUpload,
    closeAlert,
  };
}
