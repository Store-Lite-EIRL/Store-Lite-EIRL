'use client';

import { useNotificationsContext } from '@app/[slug]/(app)/context/NotificationsContext';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './RealtimeToast.module.css';

export function RealtimeToast() {
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const { subscribeToNewNotifications } = useNotificationsContext();

  useEffect(() => {
    const unsubscribe = subscribeToNewNotifications((notif) => {
      setActiveToast({
        id: notif.id,
        title: notif.title,
        message: notif.message,
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setActiveToast((prev) => (prev?.id === notif.id ? null : prev));
      }, 5000);
    });

    return unsubscribe;
  }, [subscribeToNewNotifications]);

  if (!activeToast) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.icon}>
        <Bell size={20} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{activeToast.title}</h4>
        <p className={styles.message}>{activeToast.message}</p>
      </div>
      <button className={styles.close} onClick={() => setActiveToast(null)}>
        <X size={16} />
      </button>
    </div>
  );
}
