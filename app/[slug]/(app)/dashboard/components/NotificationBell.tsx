'use client';

import { NotificationsPanel } from '@/features/storage/components/NotificationsPanel';
import { useNotificationsContext } from '@app/[slug]/(app)/context/NotificationsContext';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import styles from './NotificationBell.module.css';

export function NotificationBell() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const {
    unreadCount,
    notifications,
    isLoading: notifLoading,
    markAsRead,
  } = useNotificationsContext();

  return (
    <>
      <button
        className={styles.container}
        title={`${unreadCount} notificaciones sin leer`}
        onClick={() => setNotificationsOpen(true)}
        type="button"
      >
        <div className={styles.iconWrap}>
          <Bell size={24} className={unreadCount > 0 ? styles.ringing : ''} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
      </button>

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        isLoading={notifLoading}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
      />
    </>
  );
}
