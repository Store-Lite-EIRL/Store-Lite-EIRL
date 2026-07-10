'use client';

import {
  getBusinessTeam,
  removeTeamMemberAction,
} from '@/features/business/actions/businessActions';
import { Icon } from '@/shared/components/ui/data-display';
import { LinearProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
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
  const [brokenAvatars, setBrokenAvatars] = useState<Set<string>>(new Set());
  const [openMenuMemberId, setOpenMenuMemberId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleAvatarError = (memberId: string) => {
    setBrokenAvatars((prev) => new Set(prev).add(memberId));
  };

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

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember) return;

    setIsRemoving(true);
    setRemoveError(null);

    try {
      const result = await removeTeamMemberAction(confirmRemoveMember.id);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== confirmRemoveMember.id));
        setConfirmRemoveMember(null);
      } else {
        setRemoveError(result.error || 'Error al quitar miembro');
      }
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIsRemoving(false);
    }
  };

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
            {member.avatarUrl && !brokenAvatars.has(member.id) ? (
              <Image
                src={member.avatarUrl}
                alt={member.fullName}
                width={40}
                height={40}
                className={styles.teamAvatar}
                style={{ objectFit: 'cover' }}
                unoptimized
                onError={() => handleAvatarError(member.id)}
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
            <div style={{ position: 'relative' }}>
              <md-icon-button
                id={`member-menu-${member.id}`}
                suppressHydrationWarning
                onClick={() =>
                  setOpenMenuMemberId(openMenuMemberId === member.id ? null : member.id)
                }
              >
                <Icon size={20}>more_vert</Icon>
              </md-icon-button>

              <md-menu
                anchor={`member-menu-${member.id}`}
                open={openMenuMemberId === member.id}
                anchor-corner="bottom-end"
                menu-corner="start"
                style={{ zIndex: 200 }}
                suppressHydrationWarning
                onClose={() => setOpenMenuMemberId(null)}
              >
                <div
                  style={{
                    padding: '8px',
                    minWidth: '180px',
                  }}
                >
                  <button
                    onClick={() => {
                      setOpenMenuMemberId(null);
                      setConfirmRemoveMember(member);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--md-sys-color-error)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'var(--md-sys-color-error-container, #fce4ec)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={18}>person_remove</Icon>
                    Quitar miembro
                  </button>
                </div>
              </md-menu>
            </div>
          </div>
        ))}
      </div>

      {/* Remove member confirmation dialog */}
      <Dialog
        open={!!confirmRemoveMember}
        onClose={() => !isRemoving && setConfirmRemoveMember(null)}
        type="alert"
      >
        <div slot="headline">
          <Icon
            style={{
              color: 'var(--md-sys-color-error)',
              marginRight: '8px',
              verticalAlign: 'middle',
            }}
          >
            person_remove
          </Icon>
          Quitar miembro
        </div>
        <div slot="content">
          <p>
            ¿Estás seguro de que deseas quitar a <strong>{confirmRemoveMember?.fullName}</strong>{' '}
            del equipo?
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              marginTop: '8px',
            }}
          >
            Este miembro perderá acceso a todas las funciones del negocio.
          </p>

          {isRemoving && (
            <div style={{ marginTop: '16px' }}>
              <LinearProgress indeterminate />
              <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '4px' }}>
                Quitando miembro...
              </p>
            </div>
          )}

          {removeError && (
            <div
              style={{ color: 'var(--md-sys-color-error)', marginTop: '8px', fontSize: '0.875rem' }}
            >
              {removeError}
            </div>
          )}
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setConfirmRemoveMember(null)} disabled={isRemoving}>
            Cancelar
          </md-text-button>
          <md-filled-button
            onClick={handleRemoveMember}
            disabled={isRemoving}
            style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}
          >
            Quitar del equipo
          </md-filled-button>
        </div>
      </Dialog>
    </div>
  );
};
