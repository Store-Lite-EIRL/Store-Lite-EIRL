'use client';

import { useAuth } from '@/features/auth';
import { clearBusinessSessionData } from '@/hooks/useBusinessSession';
import { Icon } from '@/shared/components/ui/data-display';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import styles from '@app/list-business/ListBusiness.module.css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setShowConfirm(false);
    setIsLoggingOut(true);
    try {
      await signOut();
      // Clear business session on user logout
      clearBusinessSessionData();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <md-icon-button
        onClick={() => setShowConfirm(true)}
        suppressHydrationWarning
        disabled={isLoggingOut}
        title="Cerrar sesión"
        class={styles.logoutButton}
      >
        <Icon size={28}>power_settings_new</Icon>
      </md-icon-button>

      <Dialog
        open={showConfirm}
        onClose={() => !isLoggingOut && setShowConfirm(false)}
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
            logout
          </Icon>
          Cerrar sesión
        </div>
        <div slot="content">
          <p>¿Estás seguro de que deseas cerrar sesión?</p>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              marginTop: '8px',
            }}
          >
            Serás redirigido a la pantalla de inicio de sesión.
          </p>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setShowConfirm(false)} disabled={isLoggingOut}>
            Cancelar
          </md-text-button>
          <md-filled-button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}
          >
            {isLoggingOut ? (
              <CircularProgress
                indeterminate
                style={{ width: '18px', height: '18px', color: 'var(--md-sys-color-on-error)' }}
              />
            ) : (
              'Cerrar sesión'
            )}
          </md-filled-button>
        </div>
      </Dialog>

      {isLoggingOut && (
        <div className={styles.loadingOverlay}>
          <CircularProgress indeterminate fourColor />
        </div>
      )}
    </>
  );
}
