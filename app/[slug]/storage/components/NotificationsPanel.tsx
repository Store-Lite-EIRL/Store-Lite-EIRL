'use client';

import type { NotificationWithMeta } from '@/hooks/useNotifications';
import { Icon } from '@/shared/components/ui';
import { useEffect, useRef } from 'react';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationWithMeta[];
  isLoading: boolean;
  unreadCount: number;
}

const formatDate = (date: Date) => {
  const now = new Date();
  const notifDate = new Date(date);

  now.setHours(0, 0, 0, 0);
  notifDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;

  const day = notifDate.getDate();
  const month = notifDate.getMonth() + 1;
  return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
};

const CATEGORY_ICONS: Record<string, string> = {
  chat: 'chat',
  almacen: 'inventory_2',
  plan: 'credit_card',
  pedidos: 'shopping_cart',
  sistema: 'info',
};

const CATEGORY_LABELS: Record<string, string> = {
  chat: 'Chat',
  almacen: 'Almacén',
  plan: 'Plan',
  pedidos: 'Pedidos',
  sistema: 'Sistema',
};

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  isLoading,
  unreadCount,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to prevent the opening click from triggering close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const activeNotifications = notifications.filter((n) => !n.isDismissed);

  return (
    <>
      {/* Backdrop */}
      <div className="notif-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="notif-panel" ref={panelRef}>
        {/* Header */}
        <div className="notif-panel-header">
          <div className="notif-panel-header-left">
            <h2 className="notif-panel-title">Notificaciones</h2>
            {unreadCount > 0 && <span className="notif-panel-badge">{unreadCount} sin leer</span>}
          </div>
          <button className="notif-close-btn" onClick={onClose}>
            <Icon>close</Icon>
          </button>
        </div>

        {/* List */}
        <div className="notif-panel-list">
          {isLoading ? (
            <div className="notif-panel-empty">
              <div className="notif-spinner" />
              <p>Cargando notificaciones...</p>
            </div>
          ) : activeNotifications.length === 0 ? (
            <div className="notif-panel-empty">
              <div className="notif-empty-icon">
                <Icon>notifications_none</Icon>
              </div>
              <p className="notif-empty-text">No tenés notificaciones pendientes</p>
              <p className="notif-empty-subtext">Las nuevas notificaciones aparecerán acá</p>
            </div>
          ) : (
            activeNotifications.map((notification) => {
              const category = notification.category;
              const iconName = CATEGORY_ICONS[category] || 'info';
              const categoryLabel = CATEGORY_LABELS[category] || 'Sistema';

              return (
                <div
                  key={notification.id}
                  className={`notif-item ${!notification.isRead ? 'notif-item-unread' : ''} ${notification.isNew ? 'notif-item-new' : ''} notif-item-${category}`}
                >
                  <div className={`notif-item-icon notif-icon-${category}`}>
                    <Icon>{iconName}</Icon>
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-header">
                      <span className="notif-item-category">{categoryLabel}</span>
                      <span className="notif-item-time">{formatDate(notification.createdAt)}</span>
                    </div>
                    <h4 className="notif-item-title">{notification.title}</h4>
                    <p className="notif-item-message">{notification.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
