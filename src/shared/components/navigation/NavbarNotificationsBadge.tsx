'use client';

import { useNotificationsContext } from '@app/[slug]/(app)/context/NotificationsContext';

export function NavbarNotificationsBadge() {
  const { unreadCount } = useNotificationsContext();

  if (unreadCount === 0) return null;

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <span className="navbar__badge" aria-label={`${unreadCount} notificaciones sin leer`}>
      {displayCount}
    </span>
  );
}
