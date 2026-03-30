import React from 'react';
import styles from '../../BusinessSettingsModal.module.css';

interface LegalSectionProps {
  taxId: string;
  personType: string;
  legalRepName: string;
  legalRepRole: string;
  legalRepPhone: string;
  legalRepEmail: string;
  handleChange: (field: string, value: string) => void;
}

export const LegalSection: React.FC<LegalSectionProps> = ({
  taxId,
  personType,
  legalRepName,
  legalRepRole,
  legalRepPhone,
  legalRepEmail,
  handleChange,
}) => {
  return (
    <div className={styles.formSection}>
      <h3 className={styles.subSectionTitle}>Información Legal</h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>RUC / DNI</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={taxId}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('taxId', (e.target as HTMLInputElement).value)
            }
            placeholder="10456789012"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Tipo de persona</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={personType}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('personType', (e.target as HTMLInputElement).value)
            }
            placeholder="Natural o Jurídica"
          />
        </div>
      </div>

      <h3 className={styles.subSectionTitle}>Representante Legal</h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Nombre completo</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={legalRepName}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('legalRepName', (e.target as HTMLInputElement).value)
            }
            placeholder="Nombre del representante"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Cargo / Rol</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={legalRepRole}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('legalRepRole', (e.target as HTMLInputElement).value)
            }
            placeholder="Ej. Gerente General"
          />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Teléfono Rep.</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={legalRepPhone}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('legalRepPhone', (e.target as HTMLInputElement).value)
            }
            placeholder="+51..."
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Correo Rep.</label>
          <md-outlined-text-field
            suppressHydrationWarning
            type="email"
            value={legalRepEmail}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('legalRepEmail', (e.target as HTMLInputElement).value)
            }
            placeholder="rep@negocio.com"
          />
        </div>
      </div>
    </div>
  );
};
