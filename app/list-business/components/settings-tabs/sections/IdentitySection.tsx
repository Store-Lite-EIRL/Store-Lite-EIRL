import { Icon } from '@/shared/components/ui/data-display';
import Image from 'next/image';
import React from 'react';
import styles from '../../BusinessSettingsModal.module.css';

interface IdentitySectionProps {
  name: string;
  description: string;
  storeType: string;
  logoPreview: string | null;
  isUpdatingLogo: boolean;
  handleChange: (field: string, value: string) => void;
  handleFileClick: () => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  name,
  description,
  storeType,
  logoPreview,
  isUpdatingLogo,
  handleChange,
  handleFileClick,
}) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.profileHeader}>
        <div className={styles.bannerPlaceholder}>
          <div className={styles.logoPreviewContainer}>
            {logoPreview ? (
              <div className={styles.logoPreviewImage}>
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  sizes="120px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ) : (
              <Icon size={40} style={{ color: 'var(--md-sys-color-outline)' }}>
                business
              </Icon>
            )}
            {isUpdatingLogo && (
              <div className={styles.logoLoadingOverlay}>
                <Icon size={24} className={styles.spinIcon}>
                  refresh
                </Icon>
              </div>
            )}
          </div>
          <button
            className={styles.editLogoButton}
            onClick={handleFileClick}
            disabled={isUpdatingLogo}
            title="Cambiar logo"
          >
            <Icon size={20}>photo_camera</Icon>
          </button>
        </div>
        <div className={styles.profileInfo}>
          <h3 className={styles.businessNamePreview}>{name || 'Nombre del negocio'}</h3>
          <p className={styles.businessTypePreviewText}>{description}</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Nombre del negocio</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={name}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('name', (e.target as HTMLInputElement).value)
            }
            placeholder="Ej. Mi Tienda"
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Tipo de establecimiento</label>
          <md-outlined-text-field
            suppressHydrationWarning
            value={storeType}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              handleChange('storeType', (e.target as HTMLInputElement).value)
            }
            placeholder="Ej. Restaurante, Farmacia..."
          />
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>Descripción</label>
        <md-outlined-text-field
          suppressHydrationWarning
          type="textarea"
          rows={3}
          value={description}
          onInput={(e: React.FormEvent<HTMLTextAreaElement>) =>
            handleChange('description', (e.target as HTMLTextAreaElement).value)
          }
          placeholder="Breve descripción de tu negocio"
        />
      </div>
    </div>
  );
};
