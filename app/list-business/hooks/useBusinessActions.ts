'use client';

import { useState } from 'react';
import { updateBusinessData } from '../../actions/business';

export interface AlertState {
  open: boolean;
  description: string;
  color: 'success' | 'error' | 'warning' | 'primary';
}

export function useBusinessActions(isSaving: boolean, setIsSaving: (s: boolean) => void) {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    description: '',
    color: 'primary',
  });

  const handleSave = async (
    businessId: string,
    businessSlug: string,
    formData: Record<string, string>,
    hasChanges: boolean
  ) => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setAlert((prev) => ({ ...prev, open: false }));

    try {
      const result = await updateBusinessData(businessId, businessSlug, formData);
      if (result.success) {
        setAlert({
          open: true,
          description: 'Configuración de negocio actualizada correctamente.',
          color: 'success',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setAlert({
        open: true,
        description: error instanceof Error ? error.message : 'Error al actualizar el negocio.',
        color: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const closeAlert = () => setAlert((prev) => ({ ...prev, open: false }));

  return { alert, setAlert, handleSave, closeAlert };
}
