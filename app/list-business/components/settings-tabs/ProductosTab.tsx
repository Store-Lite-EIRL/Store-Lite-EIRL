'use client';

import { Icon } from '@/shared/components/ui/data-display';
import React from 'react';
import styles from '../BusinessSettingsModal.module.css';

export const ProductosTab: React.FC = () => {
  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Productos</h2>
      <p className={styles.formHint}>Gestiona el catálogo de productos de tu negocio.</p>

      <div className={styles.actionsCard}>
        <div className={styles.actionsCardInfo}>
          <div className={styles.actionsCardTitle}>Descargar catálogo CSV</div>
          <div className={styles.actionsCardDesc}>Exporta todos tus productos actuales.</div>
        </div>
        <md-outlined-button suppressHydrationWarning>
          <Icon slot="icon" size={18}>
            download
          </Icon>
          Descargar
        </md-outlined-button>
      </div>

      <div className={styles.actionsCard}>
        <div className={styles.actionsCardInfo}>
          <div className={styles.actionsCardTitle}>Importar productos</div>
          <div className={styles.actionsCardDesc}>
            Añade múltiples productos desde un archivo CSV.
          </div>
        </div>
        <md-filled-button suppressHydrationWarning>
          <Icon slot="icon" size={18}>
            upload
          </Icon>
          Importar
        </md-filled-button>
      </div>
    </div>
  );
};
