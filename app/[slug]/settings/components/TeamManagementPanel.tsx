'use client';

import type { Permission } from '@/lib/permissions/definitions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions/definitions';
import {
  AlertSnackbar,
  Button,
  Card,
  CircularProgress,
  Icon,
  IconButton,
  Select,
  SelectOption,
} from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState, useTransition } from 'react';
import {
  generateInvitationCode,
  getInvitationCode,
  getTeamMembers,
  removeTeamMember,
  revokeInvitationCode,
  updateMemberPermissions,
  updateMemberRole,
} from '../../../actions/team';
import { type Entitlements, type SettingsBusiness, type TeamMemberData } from '../constants';
import { useSnackbarFeedback } from '../hooks/useSettingsState';
import styles from '../settings.module.css';
import { PermissionsMatrix } from './PermissionsMatrix';

export function TeamManagementPanel({
  business,
  entitlements,
  isOwner,
  permissions,
}: {
  business: SettingsBusiness;
  entitlements: Entitlements;
  isOwner: boolean;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const { feedback, showSuccess, showError, close: closeFeedback } = useSnackbarFeedback();

  // Modal de edición de permisos
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<Permission[]>([]);

  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);

  // Dialog de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    userId: string;
    fullName: string | null;
  } | null>(null);

  const currentMemberCount = members.length;
  const maxMembers = entitlements.maxTeamMembers;
  const canAddMembers = currentMemberCount < maxMembers;

  const loadTeamData = async () => {
    setIsLoading(true);
    // Load members
    const membersResult = await getTeamMembers(business.id);
    if (membersResult.success && membersResult.members) {
      setMembers(membersResult.members as TeamMemberData[]);
    }

    // Load invitation code
    const codeResult = await getInvitationCode(business.id);
    if (codeResult.success && codeResult.invitation) {
      setInvitationCode(codeResult.invitation.code);
    }
    setIsLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    loadTeamData();
  }, [business.id]);

  const handleGenerateCode = useCallback(() => {
    startTransition(async () => {
      const result = await generateInvitationCode(business.id);
      if (result.success && result.code) {
        setInvitationCode(result.code);
        showSuccess('Código de invitación generado exitosamente.');
      } else {
        showError(result.error || 'Error al generar el código.');
      }
    });
  }, [business.id, showSuccess, showError, startTransition, setInvitationCode]);

  // Rotación automática del código (cada 60 segundos)
  useEffect(() => {
    if (!invitationCode || !isOwner || !canAddMembers) return;

    const interval = setInterval(() => {
      handleGenerateCode();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [invitationCode, isOwner, handleGenerateCode, canAddMembers]);

  const handleRevokeCode = () => {
    if (!invitationCode) return;
    startTransition(async () => {
      const result = await revokeInvitationCode(business.id, invitationCode);
      if (result.success) {
        setInvitationCode(null);
        showSuccess('Código de invitación revocado.');
      } else {
        showError(result.error || 'Error al revocar el código.');
      }
    });
  };

  const handleRemoveMember = (userId: string, fullName: string | null) => {
    setMemberToDelete({ userId, fullName });
    setShowDeleteDialog(true);
  };

  const confirmRemoveMember = () => {
    if (!memberToDelete) return;

    startTransition(async () => {
      const result = await removeTeamMember(business.id, memberToDelete.userId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== memberToDelete.userId));
        showSuccess('Miembro eliminado del equipo.');
      } else {
        showError(result.error || 'Error al eliminar el miembro.');
      }
      setShowDeleteDialog(false);
      setMemberToDelete(null);
    });
  };

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode).catch(() => {});
    }
  };

  // Abrir modal de edición de permisos
  const handleOpenPermissionsModal = (member: TeamMemberData) => {
    setSelectedMember(member);
    // Usar permisos custom si existen, si no usar los del rol por defecto
    const memberRole = member.role as 'admin' | 'member';
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[memberRole] || [];
    setEditingPermissions(
      (member.customPermissions && member.customPermissions.length > 0
        ? member.customPermissions
        : defaultPermissions) as Permission[],
    );
    setShowPermissionsModal(true);
  };

  // Cerrar modal
  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedMember(null);
    setEditingPermissions([]);
  };

  // Toggle permiso
  const handleTogglePermission = (permission: Permission, enabled: boolean) => {
    setEditingPermissions((prev) => {
      if (enabled) {
        return [...prev, permission];
      } else {
        return prev.filter((p) => p !== permission);
      }
    });
  };

  // Guardar permisos
  const handleSavePermissions = () => {
    if (!selectedMember) return;

    startTransition(async () => {
      const result = await updateMemberPermissions(
        business.id,
        selectedMember.userId,
        editingPermissions,
      );

      if (result.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === selectedMember.userId
              ? { ...m, customPermissions: editingPermissions }
              : m,
          ),
        );
        showSuccess('Permisos actualizados correctamente.');
      } else {
        showError(result.error || 'Error al guardar permisos.');
      }
      handleClosePermissionsModal();
    });
  };

  // Cambiar rol
  const handleChangeRole = (memberUserId: string, newRole: 'admin' | 'member') => {
    startTransition(async () => {
      const result = await updateMemberRole(business.id, memberUserId, newRole);
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole } : m)),
        );
        showSuccess(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Miembro'}.`);
      } else {
        showError(result.error || 'Error al cambiar rol.');
      }
    });
  };

  if (entitlements.maxTeamMembers <= 1) {
    return (
      <div className={styles.sectionArea}>
        <div className={styles.businessHero}>
          <div className={styles.businessHeroIcon}>
            <Icon size={28}>group</Icon>
          </div>
          <div>
            <h2 className={styles.businessHeroTitle}>Equipo</h2>
            <p className={styles.businessHeroSubtitle}>
              Invitá a colaboradores para gestionar tu negocio.
            </p>
          </div>
        </div>
        <Card variant="outlined" className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' } as React.CSSProperties}>
              lock
            </Icon>
            <div>
              <p className={styles.upgradeBannerTitle}>Equipos multi-usuario</p>
              <p className={styles.upgradeBannerText}>
                Invitar miembros al equipo está disponible en planes Business Pro o superior.
              </p>
            </div>
          </div>
          <Button variant="filled" onClick={() => router.push('/pricing')}>
            Mejorar Plan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.sectionArea}>
      <div className={styles.businessHero}>
        <div className={styles.businessHeroIcon}>
          <Icon size={28}>group</Icon>
        </div>
        <div>
          <h2 className={styles.businessHeroTitle}>Equipo</h2>
          <p className={styles.businessHeroSubtitle}>Gestioná quién tiene acceso a tu negocio.</p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.teamLoading}>
          <CircularProgress indeterminate />
        </div>
      ) : (
        <>
          {/* Members List */}
          <Card variant="elevated" className={styles.teamMembersCard}>
            <div className={styles.teamMembersHeader}>
              <span className={styles.teamMembersTitle}>Miembros</span>
              <span className={styles.teamMembersCount}>
                {currentMemberCount}/{maxMembers === -1 ? '∞' : maxMembers}
              </span>
            </div>
            {members.map((member, index) => (
              <React.Fragment key={member.userId}>
                {index > 0 && <div className={styles.teamMemberDivider} />}
                <div className={styles.teamMemberItem}>
                  <div
                    className={`${styles.teamMemberAvatar} ${member.role === 'owner' ? styles.teamMemberAvatarOwner : ''}`}
                  >
                    {(member.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.teamMemberInfo}>
                    <span className={styles.teamMemberName}>{member.fullName || 'Sin nombre'}</span>
                    <span className={styles.teamMemberEmail}>{member.email || 'Sin email'}</span>
                  </div>
                  <div className={styles.teamMemberMeta}>
                    {member.role === 'owner' ? (
                      <span className={`${styles.teamRoleBadge} ${styles.teamRoleBadgeOwner}`}>
                        <Icon size={14}>star</Icon>
                        Owner
                      </span>
                    ) : (
                      <>
                        <div className={styles.teamMemberRoleSelect}>
                          <Select
                            value={member.role}
                            onChange={(e: any) =>
                              handleChangeRole(
                                member.userId,
                                (e.target?.value || e.currentTarget?.value) as 'admin' | 'member',
                              )
                            }
                          >
                            <SelectOption value="admin">Admin</SelectOption>
                            <SelectOption value="member">Miembro</SelectOption>
                          </Select>
                        </div>
                        {(isOwner || permissions.includes('team.manage')) && (
                          <div className={styles.teamMemberActions}>
                            <IconButton
                              onClick={() => handleOpenPermissionsModal(member)}
                              disabled={isPending}
                              title="Permisos"
                            >
                              <Icon size={20}>settings</Icon>
                            </IconButton>
                            <IconButton
                              onClick={() => handleRemoveMember(member.userId, member.fullName)}
                              disabled={isPending}
                              title="Eliminar"
                            >
                              <Icon size={20} style={{ color: 'var(--md-sys-color-error)' }}>
                                delete
                              </Icon>
                            </IconButton>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </Card>

          {/* Invitation Code */}
          {(isOwner || permissions.includes('team.invite')) && (
            <Card variant="elevated" className={styles.teamInviteCard}>
              <div className={styles.teamMembersHeader}>
                <span className={styles.teamMembersTitle}>Código de invitación</span>
              </div>

              {canAddMembers ? (
                <div className={styles.teamInviteContent}>
                  <p className={styles.teamMemberEmail} style={{ padding: 0, margin: 0 }}>
                    {invitationCode
                      ? 'Compartí este código con quienes quieras invitar. Por seguridad, rota automáticamente.'
                      : 'Generá un código para invitar a nuevos miembros al equipo.'}
                  </p>

                  {invitationCode ? (
                    <div className={styles.teamInviteCodeDisplay}>
                      <div className={styles.teamInviteRotation}>
                        <Icon size={16} className={styles.rotatingIcon}>
                          sync
                        </Icon>
                        Protección activa — rotación automática
                      </div>
                      <span className={styles.teamInviteCode} onClick={handleCopyCode}>
                        {invitationCode}
                      </span>
                      <div className={styles.teamInviteActions}>
                        <Button variant="tonal" onClick={handleCopyCode}>
                          <Icon slot="icon" size={20}>
                            content_copy
                          </Icon>
                          Copiar código
                        </Button>
                        <Button variant="text" onClick={handleRevokeCode} disabled={isPending}>
                          <Icon slot="icon" size={20}>
                            block
                          </Icon>
                          Revocar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="filled" onClick={handleGenerateCode} disabled={isPending}>
                      <Icon slot="icon" size={20}>
                        add
                      </Icon>
                      {isPending ? 'Generando...' : 'Generar código de acceso'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className={styles.planLimitBanner}>
                  <div className={styles.planLimitIcon}>
                    <Icon size={32}>group_add</Icon>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p className={styles.planLimitTitle}>¡Límite de equipo alcanzado!</p>
                    <p className={styles.planLimitDescription}>
                      Tu plan actual permite hasta {maxMembers} miembros. Subí de nivel para seguir
                      sumando talento a tu negocio.
                    </p>
                  </div>
                  <div className={styles.planLimitActions}>
                    <Button variant="filled" onClick={() => router.push('/pricing')}>
                      <Icon slot="icon" size={20}>
                        workspace_premium
                      </Icon>
                      Ver Planes Premium
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* How to join */}
          <Card variant="elevated" className={styles.teamHowCard}>
            <div className={styles.teamMembersHeader}>
              <span className={styles.teamMembersTitle}>Cómo unirse</span>
            </div>
            <ol className={styles.teamHowList}>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>1</span>
                <span className={styles.teamHowStepText}>
                  Iniciar sesión con Google en la plataforma
                </span>
              </li>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>2</span>
                <span className={styles.teamHowStepText}>Ir a la página de unirse al equipo</span>
              </li>
              <li className={styles.teamHowStep}>
                <span className={styles.teamHowStepNumber}>3</span>
                <span className={styles.teamHowStepText}>
                  Ingresar el código de invitación compartido
                </span>
              </li>
            </ol>
          </Card>
        </>
      )}

      {/* Modal de edición de permisos */}
      <Dialog open={showPermissionsModal && !!selectedMember} onClose={handleClosePermissionsModal}>
        <div slot="headline">
          {selectedMember
            ? `Permisos de ${selectedMember.fullName || 'Miembro'}`
            : 'Permisos de Miembro'}
        </div>
        <div slot="content">
          <p
            className={styles.permissionsModalSubtitle}
            style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}
          >
            Editá los permisos individuales para este miembro. Las acciones de administración del
            equipo están bloqueadas por defecto para miembros.
          </p>
          {selectedMember && (
            <PermissionsMatrix
              role={selectedMember.role as 'admin' | 'member'}
              permissions={editingPermissions}
              onChange={handleTogglePermission}
            />
          )}
        </div>
        <div slot="actions">
          <Button variant="text" onClick={handleClosePermissionsModal}>
            Cancelar
          </Button>
          <Button variant="filled" onClick={handleSavePermissions} disabled={isPending}>
            <Icon slot="icon" size={20}>
              save
            </Icon>
            {isPending ? 'Guardando...' : 'Guardar Permisos'}
          </Button>
        </div>
      </Dialog>

      <AlertSnackbar
        open={feedback.open}
        description={feedback.description}
        color={feedback.color}
        icon={feedback.icon}
        onClose={closeFeedback}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <div slot="headline">Eliminar miembro</div>
        <div slot="content">
          ¿Estás seguro de que querés eliminar a{' '}
          <strong>{memberToDelete?.fullName || 'este miembro'}</strong> de tu equipo? No podrá
          volver a entrar a menos que lo vuelvas a invitar.
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            onClick={confirmRemoveMember}
            disabled={isPending}
            style={{
              backgroundColor: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)',
            }}
          >
            Eliminar permanentemente
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
