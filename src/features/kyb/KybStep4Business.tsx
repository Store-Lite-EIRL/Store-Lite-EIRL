// =====================================================
// KYB STEP 4: Business Data & Creation
// =====================================================
// Description: Final step, business contact info, create business
// =====================================================

'use client';

import { createVerifiedBusinessAction } from './kybActions';
import type { WizardData } from './kybWizard';

export function KybStep4Business({
  onSubmit,
  loading,
  initialData,
}: {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  initialData: WizardData;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Append data from previous steps
    if (initialData.taxId) formData.append('taxId', initialData.taxId);
    if (initialData.personType) formData.append('personType', initialData.personType);
    if (initialData.legalRepName) formData.append('legalRepName', initialData.legalRepName);
    if (initialData.legalRepPhone) formData.append('legalRepPhone', initialData.legalRepPhone);
    if (initialData.address) formData.append('address', initialData.address);

    // Call Server Action
    const res = await createVerifiedBusinessAction(formData);
    if (res.error) {
      alert(res.error); // Replace with proper error UI
      return;
    }
    // Success! Redirect or show message
    alert('Negocio creado y verificado con éxito!');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <md-headline-small>Datos del Negocio</md-headline-small>
      <p className="text-on-surface-variant">
        Paso 4 de 4. Ingresa los datos de contacto del negocio.
      </p>

      {/* Business Phone (Default to rep phone) */}
      <md-outlined-text-field
        name="businessPhone"
        label="Teléfono del Negocio"
        className="w-full"
        defaultValue={initialData.legalRepPhone}
      />

      {/* Business Email */}
      <md-outlined-text-field
        name="businessEmail"
        label="Email del Negocio"
        type="email"
        required
        className="w-full"
      />

      {/* Slug */}
      <md-outlined-text-field
        name="slug"
        label="Slug de la tienda (mi-tienda)"
        required
        className="w-full"
        defaultValue={initialData.slug}
      />

      {/* Terms and Conditions */}
      <label className="flex items-center gap-2">
        <input type="checkbox" name="terms" required />
        <span className="text-sm">Acepto los Términos y Condiciones</span>
      </label>

      <div className="flex justify-end mt-4">
        <md-filled-button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Negocio Verificado'}
        </md-filled-button>
      </div>
    </form>
  );
}
