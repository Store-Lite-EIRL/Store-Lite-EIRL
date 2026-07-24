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

function getStatus(isoDate: string): { label: string; isActive: boolean } {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);

  if (minutes < 5) return { label: 'activo', isActive: true };
  if (minutes < 60) return { label: `hace ${minutes} min`, isActive: false };
  if (hours < 24) return { label: `hace ${hours}h`, isActive: false };
  return { label: 'sin actividad', isActive: false };
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
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
  const total = messages.length;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.cardTitle}>Mensajes de clientes</h2>
          <span className={styles.totalBadge}>{total}</span>
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
          <p className={styles.emptyText}>No tenés mensajes aún.</p>
        </div>
      ) : (
        <ul className={styles.list} role="list">
          {messages.map((msg) => {
            const status = getStatus(msg.createdAt);

            return (
              <li key={msg.id} className={`${styles.item} ${!msg.isRead ? styles.itemUnread : ''}`}>
                <div className={styles.avatar} aria-hidden>
                  {getInitials(msg.senderName)}
                </div>

                <div className={styles.content}>
                  <div className={styles.contentHeader}>
                    <div className={styles.senderRow}>
                      <span className={styles.senderName}>{msg.senderName}</span>
                      {status.isActive && <span className={styles.activeBadge}>●</span>}
                    </div>
                    <span className={`${styles.time} ${status.isActive ? styles.timeActive : ''}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className={styles.preview}>
                    {msg.messageText.length > 60
                      ? `${msg.messageText.slice(0, 60)}…`
                      : msg.messageText}
                  </p>
                </div>

                {!msg.isRead && <div className={styles.unreadDot} aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
