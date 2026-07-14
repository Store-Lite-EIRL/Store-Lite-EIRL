'use client';

import { useNotifications } from '@/hooks/useNotifications';

interface NavbarNotificationsBadgeProps {
  businessId: string;
}

export function NavbarNotificationsBadge({ businessId }: NavbarNotificationsBadgeProps) {
  const { unreadCount } = useNotifications({ businessId, autoFetch: false, enableRealtime: true });

  if (unreadCount === 0) return null;

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <span className="navbar__badge" aria-label={`${unreadCount} notificaciones sin leer`}>
      {displayCount}
    </span>
  );
}
