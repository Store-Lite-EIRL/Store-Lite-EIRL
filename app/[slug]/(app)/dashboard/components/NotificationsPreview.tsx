'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { Checkbox } from '@/shared/components/ui/inputs/Checkbox';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  MessageSquare,
  Package,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import styles from './NotificationsPreview.module.css';

interface NotificationsPreviewProps {
  businessId: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: Bell },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'almacen', label: 'Almacen', icon: Package },
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'sistema', label: 'Sistema', icon: Info },
] as const;

export function NotificationsPreview({ businessId }: NotificationsPreviewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showReadAlert, setShowReadAlert] = useState(false);
  const {
    notifications,
    unreadCount,
    unreadCountByCategory,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ businessId });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    setShowReadAlert(true);
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      !notification.isDismissed &&
      (activeCategory === 'all' || notification.category === activeCategory),
  );

  const latestNotification = filteredNotifications[0];

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.id === category)?.label ?? 'Sistema';
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);

    // Reset hours to compare dates only
    now.setHours(0, 0, 0, 0);
    notifDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      const day = notifDate.getDate();
      const month = notifDate.getMonth() + 1;
      return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>
            <Sparkles size={14} />
            Centro de actividad
          </span>
          <h3 className={styles.heroTitle}>Notificaciones y alertas del negocio</h3>
          <p className={styles.heroDescription}>
            Revisá mensajes, stock y eventos clave sin perder el foco del dashboard.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>Sin leer</span>
            <strong className={styles.statValue}>{unreadCount}</strong>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>Mostrando</span>
            <strong className={styles.statValue}>{filteredNotifications.length}</strong>
          </div>
          {latestNotification && (
            <div className={styles.heroActivity}>
              <div className={styles.activityIcon}>
                {latestNotification.category === 'chat' ? (
                  <MessageSquare size={20} />
                ) : latestNotification.category === 'almacen' ? (
                  <Package size={20} />
                ) : latestNotification.category === 'plan' ? (
                  <CreditCard size={20} />
                ) : latestNotification.category === 'pedidos' ? (
                  <ShoppingCart size={20} />
                ) : (
                  <Info size={20} />
                )}
              </div>
              <div className={styles.activityContent}>
                <span className={styles.activityLabel}>Ultima actividad</span>
                <span className={styles.activityValue}>
                  {formatNotificationDate(latestNotification.createdAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.tabs}>
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const count =
              category.id === 'all'
                ? unreadCount
                : unreadCountByCategory[category.id as keyof typeof unreadCountByCategory];

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`${styles.tab} ${activeCategory === category.id ? styles.tabActive : ''}`}
              >
                <Icon size={18} />
                <span>{category.label}</span>
                {count > 0 && <span className={styles.badge}>{count}</span>}
              </button>
            );
          })}
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className={styles.actionBtn}>
            <CheckCheck size={16} />
            <span>Marcar todas</span>
          </button>
        )}
      </div>

      <article className={styles.card}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIconWrap}>
              <Bell size={48} strokeWidth={1} />
            </div>
            <p className={styles.emptyText}>No hay notificaciones en esta categoría.</p>
          </div>
        ) : (
          <div className={styles.listViewport}>
            <ul className={styles.list} role="list">
              {filteredNotifications.map((notification) => {
                const itemClasses = [
                  styles.item,
                  notification.isRead ? styles.read : styles.unread,
                  notification.isNew ? styles.new : '',
                  styles[`item_${notification.category}`],
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <li key={notification.id} className={itemClasses}>
                    {/* Columna 1: Icono + nombre del tipo */}
                    <div className={styles.colType}>
                      <div className={`${styles.iconWrap} ${styles[notification.category]}`}>
                        {notification.category === 'chat' ? (
                          <MessageSquare size={18} />
                        ) : notification.category === 'almacen' ? (
                          <Package size={18} />
                        ) : notification.category === 'plan' ? (
                          <CreditCard size={18} />
                        ) : notification.category === 'pedidos' ? (
                          <ShoppingCart size={18} />
                        ) : (
                          <Info size={18} />
                        )}
                      </div>
                      <span
                        className={[styles.typeLabel, styles[`type_${notification.category}`]].join(
                          ' ',
                        )}
                      >
                        {getCategoryLabel(notification.category)}
                      </span>
                    </div>

                    {/* Columna 2: Contenido */}
                    <div className={styles.colContent}>
                      {notification.category === 'pedidos' &&
                        (notification as any).data?.productImage && (
                          <div className={styles.productPreview}>
                            <img
                              src={(notification as any).data.productImage}
                              alt="Producto"
                              className={styles.productImage}
                            />
                          </div>
                        )}
                      <h3 className={styles.title}>{notification.title}</h3>
                      <p className={styles.message}>{notification.message}</p>
                    </div>

                    {/* Columna 3: Fecha + Checkbox */}
                    <div className={styles.colActions}>
                      <div className={styles.timeGroup}>
                        <span className={styles.time}>
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                        {!notification.isRead && <span className={styles.pulseDot} />}
                      </div>
                      <Checkbox
                        checked={notification.isRead}
                        onChange={() => handleMarkAsRead(notification.id)}
                        className={styles.checkbox}
                        disabled={notification.isRead}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </article>

      {showReadAlert && (
        <AlertSnackbar
          open={showReadAlert}
          description="Marcado como leido"
          color="success"
          position="bottom-center"
          onClose={() => setShowReadAlert(false)}
          autoCloseDuration={2000}
        />
      )}
    </div>
  );
}
