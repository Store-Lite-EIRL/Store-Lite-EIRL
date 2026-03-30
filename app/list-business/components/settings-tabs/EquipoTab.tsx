'use client';

import React from 'react';
import { Icon } from '@/shared/components/ui/data-display';
import styles from '../BusinessSettingsModal.module.css';

interface EquipoTabProps {
  businessName: string;
}

export const EquipoTab: React.FC<EquipoTabProps> = ({ businessName: _businessName }) => {
  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Equipo</h2>
      <p className={styles.formHint}>Administra los miembros de tu equipo y sus permisos.</p>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <md-filled-button suppressHydrationWarning>
          <Icon slot="icon" size={18}>
            person_add
          </Icon>
          Invitar miembro
        </md-filled-button>
      </div>

      <div className={styles.teamList}>
        <div className={styles.teamMember}>
          <div className={styles.teamAvatar}>AE</div>
          <div className={styles.teamInfo}>
            <div className={styles.teamName}>Alonso Ernesto</div>
            <div className={styles.teamRole}>Propietario</div>
          </div>
          <md-icon-button suppressHydrationWarning>
            <Icon size={20}>more_vert</Icon>
          </md-icon-button>
        </div>
        <div className={styles.teamMember}>
          <div className={styles.teamAvatar}>JS</div>
          <div className={styles.teamInfo}>
            <div className={styles.teamName}>Juan Silva</div>
            <div className={styles.teamRole}>Administrador</div>
          </div>
          <md-icon-button suppressHydrationWarning>
            <Icon size={20}>more_vert</Icon>
          </md-icon-button>
        </div>
      </div>
    </div>
  );
};
