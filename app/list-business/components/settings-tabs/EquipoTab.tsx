'use client';

import { Icon } from '@/shared/components/ui/data-display';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { getBusinessTeam } from '../../actions';
import styles from '../BusinessSettingsModal.module.css';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

interface EquipoTabProps {
  businessId: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role: string): string {
  switch (role) {
    case 'owner':
      return 'Propietario';
    case 'admin':
      return 'Administrador';
    case 'member':
      return 'Miembro';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export const EquipoTab: React.FC<EquipoTabProps> = ({ businessId }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusinessTeam(businessId)
      .then((data) => {
        setMembers(data);
        setLoading(false);
        return null;
      })
      .catch(() => {
        setLoading(false);
      });
  }, [businessId]);

  if (loading) {
    return (
      <div className={styles.contentContainer}>
        <h2 className={styles.sectionTitle}>Equipo</h2>
        <p className={styles.formHint}>Miembros actuales de tu negocio.</p>
        <div className={styles.teamList}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.teamMember} style={{ opacity: 0.4 }}>
              <div className={styles.teamAvatar}>—</div>
              <div className={styles.teamInfo}>
                <div className={styles.teamName}>Cargando...</div>
                <div className={styles.teamRole}>&nbsp;</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className={styles.contentContainer}>
        <h2 className={styles.sectionTitle}>Equipo</h2>
        <p className={styles.formHint}>Miembros actuales de tu negocio.</p>
        <div className={styles.actionsCard}>
          <div className={styles.actionsCardInfo}>
            <div className={styles.actionsCardTitle}>Sin miembros aún</div>
            <div className={styles.actionsCardDesc}>
              Invita miembros desde la sección de equipo en tu negocio.
            </div>
          </div>
          <Icon size={24}>group</Icon>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Equipo</h2>
      <p className={styles.formHint}>Miembros actuales de tu negocio.</p>
      <div className={styles.teamList}>
        {members.map((member) => (
          <div key={member.id} className={styles.teamMember}>
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={member.fullName}
                width={40}
                height={40}
                className={styles.teamAvatar}
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <div className={styles.teamAvatar}>{getInitials(member.fullName)}</div>
            )}
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{member.fullName}</div>
              <div className={styles.teamRole}>
                {formatRole(member.role)} · {member.email}
              </div>
            </div>
            <md-icon-button suppressHydrationWarning>
              <Icon size={20}>more_vert</Icon>
            </md-icon-button>
          </div>
        ))}
      </div>
    </div>
  );
};
