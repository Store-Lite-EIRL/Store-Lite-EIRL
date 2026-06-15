// =====================================================
// KYB STEP 1: Identity Verification (RUC / DNI)
// =====================================================
// Description: Select person type, input doc number, validate via Factiliza
// =====================================================

'use client';

import { useActionState, useState } from 'react';
import { verifyIdentityAction } from './kybActions';
import type { WizardData } from './KybWizard';

export function KybStep1Identity({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (data: Partial<WizardData>) => void;
  loading: boolean;
  initialData: WizardData;
}) {
  const [personType, setPersonType] = useState<'natural' | 'juridica'>(
    initialData.personType || 'natural',
  );
  const [state, formAction] = useActionState(async (prevState: unknown, formData: FormData) => {
    // Debug: Log what's actually being submitted from the client
    const res = await verifyIdentityAction(formData);
    if (!res.error && res.data) {
      onSubmit(res.data); // Pass the response data to wizard
    }
    return res;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <md-headline-small>Verificación de Identidad</md-headline-small>
      <p className="text-on-surface-variant">
        Paso 1 de 4. Selecciona el tipo de persona y valida el documento.
      </p>

      {/* Person Type Selector */}
      <div className="flex gap-4">
        <label className="flex-1">
          <input
            type="radio"
            name="personType"
            value="natural"
            checked={personType === 'natural'}
            onChange={() => setPersonType('natural')}
            required
          />
          <span className="ml-2">Persona Natural (DNI)</span>
        </label>
        <label className="flex-1">
          <input
            type="radio"
            name="personType"
            value="juridica"
            checked={personType === 'juridica'}
            onChange={() => setPersonType('juridica')}
            required
          />
          <span className="ml-2">Persona Jurídica (RUC)</span>
        </label>
      </div>

      {/* Document Number Input */}
      <md-outlined-text-field
        name="documentNumber"
        label="Número de Documento"
        placeholder="Ingrese DNI (8 dígitos) o RUC (11 dígitos)"
        required
        className="w-full"
      />

      {/* Error Display */}
      {state?.error && <div className="text-error">{state.error}</div>}

      {/* Verified Data Dialog (Simplified for now) */}
      {state?.success && state.data && (
        <div className="bg-secondary-container p-4 rounded-lg">
          <p className="font-bold">Datos Verificados:</p>
          <p>Razón Social: {state.data.razonSocial || state.data.legalRepName}</p>
          <p>Estado: ACTIVO / HABIDO</p>
          <p>Dirección: {state.data.address}</p>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <md-filled-button type="submit" disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar y Continuar'}
        </md-filled-button>
      </div>
    </form>
  );
}
