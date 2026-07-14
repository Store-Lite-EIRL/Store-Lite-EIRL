'use client';

import type { NotificationWithMeta } from '@/hooks/useNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeDate } from '@/shared/utils/date';
import type { LucideProps } from 'lucide-react';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  MessageSquare,
  Package,
  ShoppingCart,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { getCategoryIcon } from './categoryIcons';
import { NotificationDetailDialog } from './NotificationDetailDialog';
import styles from './notifications.module.css';

/** Definición completa de categorías con íconos. */
const CATEGORIES: readonly { id: string; label: string; icon: ComponentType<LucideProps> }[] = [
  { id: 'all', label: 'Todas', icon: Bell },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'almacen', label: 'Almacén', icon: Package },
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'sistema', label: 'Sistema', icon: Info },
];

interface NotificationsClientProps {
  businessId: string;
  businessName: string;
  availableCategoryIds: string[];
}

export default function NotificationsClient({
  businessId,
  businessName: _businessName,
  availableCategoryIds,
}: NotificationsClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithMeta | null>(
    null,
  );

  // Categorías filtradas localmente según los IDs que vienen del server
  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => availableCategoryIds.includes(c.id)),
    [availableCategoryIds],
  );

  // Si la categoría activa ya no está disponible (cambio de plan), resetear a 'all'
  const safeCategory = useMemo(
    () => (availableCategories.some((c) => c.id === activeCategory) ? activeCategory : 'all'),
    [availableCategories, activeCategory],
  );

  const {
    notifications,
    unreadCount,
    unreadCountByCategory,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ businessId });

  const getCategoryLabel = (category: string) => {
    const found = CATEGORIES.find((c) => c.id === category);
    return found?.label ?? 'Sistema';
  };

  const filteredNotifications = notifications.filter(
    (n) => !n.isDismissed && (safeCategory === 'all' || n.category === safeCategory),
  );

  // Derived state flags
  const showError = error && notifications.length === 0 && !isLoading;
  const showLoading = isLoading && notifications.length === 0;
  const showPopulated = !isLoading && !showError && filteredNotifications.length > 0;

  const renderState = () => {
    if (showLoading) {
      return (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <p className={styles.stateText}>Cargando notificaciones...</p>
        </div>
      );
    }

    if (showError) {
      return (
        <div className={styles.stateBox}>
          <div className={styles.errorIconWrap}>
            <Info size={48} strokeWidth={1} />
          </div>
          <p className={styles.stateText}>Error al cargar las notificaciones</p>
          <p className={styles.stateSubtext}>{error}</p>
        </div>
      );
    }

    if (filteredNotifications.length === 0) {
      const isEmptyAll = safeCategory === 'all';
      return (
        <div className={styles.stateBox}>
          <div className={styles.emptyIconWrap}>
            <Bell size={48} strokeWidth={1} />
          </div>
          <p className={styles.stateText}>
            {isEmptyAll ? 'No hay notificaciones' : 'No hay notificaciones en esta categoría.'}
          </p>
          {isEmptyAll && (
            <p className={styles.stateSubtext}>
              Las notificaciones aparecerán aquí cuando las recibas.
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>Notificaciones</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'No hay notificaciones sin leer'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className={styles.markAllBtn}>
            <CheckCheck size={18} />
            <span>Marcar todas</span>
          </button>
        )}
      </header>

      {/* Category filter tabs — filtradas según plan */}
      <div className={styles.tabs}>
        {availableCategories.map((category) => {
          const Icon = category.icon;
          const count =
            category.id === 'all'
              ? unreadCount
              : unreadCountByCategory[category.id as keyof typeof unreadCountByCategory];

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`${styles.tab} ${safeCategory === category.id ? styles.tabActive : ''}`}
            >
              <Icon size={18} />
              <span>{category.label}</span>
              {count > 0 && <span className={styles.tabBadge}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Notification list / states */}
      <div className={styles.listViewport}>
        {showPopulated ? (
          <ul className={styles.list} role="list">
            {filteredNotifications.map((notification) => {
              const itemClasses = [
                styles.item,
                notification.isRead ? styles.read : styles.unread,
                notification.isNew ? styles.newItem : '',
                styles[`item_${notification.category}`] || '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    setSelectedNotification(notification);
                  }}
                  className={itemClasses}
                  role="listitem"
                >
                  <div className={styles.colType}>
                    <div className={`${styles.iconWrap} ${styles[notification.category]}`}>
                      {getCategoryIcon(notification.category)}
                    </div>
                    <span
                      className={
                        styles[`typeLabel_${notification.category}` as keyof typeof styles] ||
                        styles.typeLabel
                      }
                    >
                      {getCategoryLabel(notification.category)}
                    </span>
                  </div>

                  <div className={styles.colContent}>
                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                    <p className={styles.itemMessage}>{notification.message}</p>
                    <div className={styles.timeGroup}>
                      <span className={styles.time}>
                        {formatRelativeDate(notification.createdAt)}
                      </span>
                      {!notification.isRead && <span className={styles.pulseDot} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          renderState()
        )}
      </div>

      <NotificationDetailDialog
        notification={selectedNotification}
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
