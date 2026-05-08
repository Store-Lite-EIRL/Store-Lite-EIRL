// =====================================================
// KYB STEP 2: Representative Verification
// =====================================================
// Description: Enter DNI/Name, validate against RUC reps (Juridica)
// =====================================================

'use client';

import type { WizardData } from './KybWizard';

export function KybStep2Representative({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  initialData: WizardData;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <md-headline-small>Datos del Representante</md-headline-small>
      <p className="text-on-surface-variant">
        Paso 2 de 4. Ingrese los datos del representante legal.
      </p>

      {/* DNI Input */}
      <md-outlined-text-field
        name="dni"
        label="DNI del Representante"
        required
        className="w-full"
        defaultValue={initialData.legalRepDni}
      />

      {/* Full Name */}
      <md-outlined-text-field
        name="fullName"
        label="Nombre Completo"
        required
        className="w-full"
        defaultValue={initialData.legalRepName}
      />

      {/* Business Data (Juridica) */}
      {initialData.personType === 'juridica' && (
        <>
          <md-outlined-text-field
            name="businessName"
            label="Razón Social / Nombre Comercial"
            required
            className="w-full"
            defaultValue={initialData.razonSocial}
          />
          <md-outlined-text-field
            name="address"
            label="Dirección"
            className="w-full"
            defaultValue={initialData.address}
          />
        </>
      )}

      <div className="flex justify-end mt-4">
        <md-filled-button type="submit" disabled={loading}>
          {loading ? 'Validando...' : 'Continuar'}
        </md-filled-button>
      </div>
    </form>
  );
}
