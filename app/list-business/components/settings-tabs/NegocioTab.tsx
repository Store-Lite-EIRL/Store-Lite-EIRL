import React from 'react';
import styles from '../BusinessSettingsModal.module.css';
import { ContactSection } from './sections/ContactSection';
import { IdentitySection } from './sections/IdentitySection';
import { LegalSection } from './sections/LegalSection';

interface BusinessFormData {
  name: string;
  description: string;
  address: string;
  whatsappNumber: string;
  storeType: string;
  taxId: string;
  personType: string;
  country: string;
  city: string;
  email: string;
  legalRepName: string;
  legalRepRole: string;
  legalRepPhone: string;
  legalRepEmail: string;
}

interface NegocioTabProps {
  formData: BusinessFormData;
  handleChange: (field: keyof BusinessFormData, value: string) => void;
  logoPreview: string | null;
  isUpdatingLogo: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  handleSave: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const NegocioTab: React.FC<NegocioTabProps> = ({
  formData,
  handleChange,
  logoPreview,
  isUpdatingLogo,
  isSaving,
  hasChanges,
  handleSave,
  handleFileChange,
  fileInputRef,
}) => {
  const handleSectionChange = (field: string, value: string) => {
    handleChange(field as keyof BusinessFormData, value);
  };

  return (
    <div className={styles.contentContainer} style={{ paddingBottom: '40px' }}>
      <h2 className={styles.sectionTitle}>Vista general del negocio</h2>
      <p className={styles.formHint}>Información básica y legal de tu establecimiento.</p>

      <div className={styles.formWrapper}>
        <IdentitySection
          name={formData.name}
          description={formData.description}
          storeType={formData.storeType}
          logoPreview={logoPreview}
          isUpdatingLogo={isUpdatingLogo}
          handleChange={handleSectionChange}
          handleFileClick={() => fileInputRef.current?.click()}
        />

        <ContactSection
          whatsappNumber={formData.whatsappNumber}
          email={formData.email}
          address={formData.address}
          city={formData.city}
          country={formData.country}
          handleChange={handleSectionChange}
        />

        <LegalSection
          taxId={formData.taxId}
          personType={formData.personType}
          legalRepName={formData.legalRepName}
          legalRepRole={formData.legalRepRole}
          legalRepPhone={formData.legalRepPhone}
          legalRepEmail={formData.legalRepEmail}
          handleChange={handleSectionChange}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
          aria-label="Subir logo del negocio"
        />
      </div>

      <div className={styles.stickyFooter}>
        <md-filled-button
          suppressHydrationWarning
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </md-filled-button>
      </div>
    </div>
  );
};
