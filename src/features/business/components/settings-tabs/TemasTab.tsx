'use client';

import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import React from 'react';
import styles from '../BusinessSettingsModal.module.css';

export const TemasTab: React.FC = () => {
  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Apariencia y Temas</h2>
      <p className={styles.formHint}>Personaliza los colores y la apariencia de tu tienda.</p>

      <div style={{ marginTop: '24px' }}>
        <ThemeSettings />
      </div>
    </div>
  );
};
