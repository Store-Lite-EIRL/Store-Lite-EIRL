'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Checkbox } from '@/shared/components/ui/inputs/Checkbox';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  MessageSquare,
  Package,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useState } from 'react';
import styles from './notifications.module.css';

interface NotificationsClientProps {
  businessId: string;
  businessName: string;
}

const CATEGORIES = [
  { id: 'all' as const, label: 'Todas', icon: Bell },
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'almacen' as const, label: 'Almacén', icon: Package },
  { id: 'plan' as const, label: 'Plan', icon: CreditCard },
  { id: 'pedidos' as const, label: 'Pedidos', icon: ShoppingCart },
  { id: 'sistema' as const, label: 'Sistema', icon: Info },
] as const;

export default function NotificationsClient({
  businessId,
  businessName: _businessName,
}: NotificationsClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const {
    notifications,
    unreadCount,
    unreadCountByCategory,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications({ businessId });

  const getCategoryIcon = (category: string, size = 18) => {
    switch (category) {
      case 'chat':
        return <MessageSquare size={size} />;
      case 'almacen':
        return <Package size={size} />;
      case 'plan':
        return <CreditCard size={size} />;
      case 'pedidos':
        return <ShoppingCart size={size} />;
      default:
        return <Info size={size} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = CATEGORIES.find((c) => c.id === category);
    return found?.label ?? 'Sistema';
  };

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

  const filteredNotifications = notifications.filter(
    (n) => !n.isDismissed && (activeCategory === 'all' || n.category === activeCategory),
  );

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDismiss = (id: string) => {
    dismiss(id);
  };

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
      const isEmptyAll = activeCategory === 'all';
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

      {/* Category filter tabs */}
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
                <li key={notification.id} className={itemClasses} role="listitem">
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
                  </div>

                  <div className={styles.colActions}>
                    <div className={styles.timeGroup}>
                      <span className={styles.time}>{formatDate(notification.createdAt)}</span>
                      {!notification.isRead && <span className={styles.pulseDot} />}
                    </div>

                    <div className={styles.actionGroup}>
                      <Checkbox
                        checked={notification.isRead}
                        onChange={() => handleMarkAsRead(notification.id)}
                        className={styles.checkbox}
                        disabled={notification.isRead}
                      />
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className={styles.dismissBtn}
                        aria-label="Descartar notificación"
                        title="Descartar"
                      >
                        <X size={16} />
                      </button>
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
    </div>
  );
}
