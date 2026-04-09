import styles from './MessagesPreview.module.css';

export interface MessageItem {
  id: string;
  senderName: string;
  messageText: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

interface MessagesPreviewProps {
  messages: MessageItem[];
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days} día${days > 1 ? 's' : ''}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function MessagesPreview({ messages }: MessagesPreviewProps) {
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.cardTitle}>Mensajes de clientes</h2>
          {unread > 0 && (
            <span className={styles.unreadBadge} aria-label={`${unread} sin leer`}>
              {unread}
            </span>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✉️</span>
          <p className={styles.emptyText}>Todavía no recibiste mensajes.</p>
        </div>
      ) : (
        <ul className={styles.list} role="list">
          {messages.map((msg) => (
            <li key={msg.id} className={`${styles.item} ${!msg.isRead ? styles.itemUnread : ''}`}>
              <div className={styles.avatar} aria-hidden>
                {getInitials(msg.senderName)}
              </div>

              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  <span className={styles.senderName}>{msg.senderName}</span>
                  <span className={styles.time}>{timeAgo(msg.createdAt)}</span>
                </div>
                <p className={styles.preview}>
                  {msg.messageText.length > 80
                    ? `${msg.messageText.slice(0, 80)}…`
                    : msg.messageText}
                </p>
              </div>

              {!msg.isRead && <div className={styles.unreadDot} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
