import styles from './NotificationsPreview.module.css';

export interface NotificationItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface NotificationsPreviewProps {
  notifications: NotificationItem[];
}

export function NotificationsPreview({ notifications }: NotificationsPreviewProps) {
  if (notifications.length === 0) {
    return (
      <article className={styles.card}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✨</span>
          <p className={styles.emptyText}>No hay alertas pendientes. ¡Todo bajo control!</p>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <ul className={styles.list} role="list">
        {notifications.map((notif) => (
          <li key={notif.id} className={`${styles.item} ${styles[notif.type]}`}>
            <div className={styles.iconWrap}>
              {notif.type === 'error' && '🔴'}
              {notif.type === 'warning' && '🟡'}
              {notif.type === 'info' && '🔵'}
            </div>
            <div className={styles.content}>
              <h3 className={styles.title}>{notif.title}</h3>
              <p className={styles.message}>{notif.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
