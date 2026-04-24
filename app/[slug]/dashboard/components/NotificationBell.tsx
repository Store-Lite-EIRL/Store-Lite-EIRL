'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';
import styles from './NotificationBell.module.css';

interface NotificationBellProps {
  businessId: string;
}

export function NotificationBell({ businessId }: NotificationBellProps) {
  const { unreadCount } = useNotifications({
    businessId,
  });

  return (
    <div className={styles.container} title={`${unreadCount} notificaciones sin leer`}>
      <div className={styles.iconWrap}>
        <Bell size={24} className={unreadCount > 0 ? styles.ringing : ''} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>
    </div>
  );
}
