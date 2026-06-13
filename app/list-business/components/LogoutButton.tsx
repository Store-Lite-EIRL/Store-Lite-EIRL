'use client';

import { useAuth } from '@/features/auth';
import { clearBusinessSessionData } from '@/hooks/useBusinessSession';
import { Icon } from '@/shared/components/ui/data-display';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../ListBusiness.module.css';

export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
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
        onClick={handleLogout}
        suppressHydrationWarning
        disabled={isLoggingOut}
        title="Cerrar sesión"
        class={styles.logoutButton}
      >
        <Icon size={28}>power_settings_new</Icon>
      </md-icon-button>

      {isLoggingOut && (
        <div className={styles.loadingOverlay}>
          <CircularProgress indeterminate fourColor />
        </div>
      )}
    </>
  );
}
