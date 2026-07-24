'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import styles from './RealtimeToast.module.css';

interface RealtimeToastProps {
  businessId: string;
}

export function RealtimeToast({ businessId }: RealtimeToastProps) {
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const onNewNotification = useCallback((notif: any) => {
    setActiveToast({
      id: notif.id,
      title: notif.title,
      message: notif.message,
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id === notif.id ? null : prev));
    }, 5000);
  }, []);

  useNotifications({
    businessId,
    onNewNotification,
  });

  if (!businessId || !activeToast) return null;

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
