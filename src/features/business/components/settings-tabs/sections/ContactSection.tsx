import React from 'react';
import styles from '../../BusinessSettingsModal.module.css';

interface ContactSectionProps {
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  country: string;
  locked: boolean;
  handleChange: (field: string, value: string) => void;
}

const LOCKED_NOTICE =
  'Este campo está bloqueado porque el negocio/producto tiene pagos registrados.';

export const ContactSection: React.FC<ContactSectionProps> = ({
  whatsappNumber,
  email,
  address,
  city,
  country,
  locked,
  handleChange,
}) => {
  return (
    <div className={styles.formSection}>
      <h3 className={styles.subSectionTitle}>Información de Contacto</h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Teléfono / WhatsApp</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={whatsappNumber}
            disabled
            className={styles.disabledField}
            placeholder="+51 987 654 321"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Correo electrónico</label>
          <md-outlined-text-field
            suppressHydrationWarning
            type="email"
            value={email}
            disabled
            className={styles.disabledField}
            placeholder="contacto@negocio.com"
          />
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>Dirección</label>
        <md-outlined-text-field
          suppressHydrationWarning
          value={address}
          disabled
          className={styles.disabledField}
          placeholder="Av. Principal 123, Urb. Los Olivos"
        />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Ciudad</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={city}
            disabled={locked}
            className={locked ? styles.disabledField : undefined}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('city', (e.target as HTMLInputElement).value)
            }
            placeholder="Lima"
          />
          {locked && <p className={styles.fieldNotice}>{LOCKED_NOTICE}</p>}
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>País</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={country}
            disabled
            className={styles.disabledField}
            placeholder="Perú"
          />
        </div>
      </div>
    </div>
  );
};
