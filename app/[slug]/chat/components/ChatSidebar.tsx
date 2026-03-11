import { Icon } from '@/shared/components/ui';
import styles from './ChatSidebar.module.css';

import type { Chat } from './ChatClient';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
}: ChatSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>Mensajes</h2>
      </header>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Icon size={20} className={styles.searchIcon}>
            search
          </Icon>
          <input
            type="text"
            placeholder="Buscar en mensajes..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className={styles.chatList}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className={styles.avatarContainer}>
              <img src={chat.avatarUrl} alt={`Avatar de ${chat.name}`} className={styles.avatar} />
              {chat.online && <span className={styles.onlineBadge} />}
            </div>

            <div className={styles.chatInfo}>
              <div className={styles.chatTopLine}>
                <span className={styles.chatName}>{chat.name}</span>
                <span className={styles.chatTime}>{chat.time}</span>
              </div>
              <div className={styles.chatBottomLine}>
                <span className={styles.chatPreview}>{chat.preview}</span>
                {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
              </div>
            </div>
          </div>
        ))}
        {chats.length === 0 && (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            No se encontraron chats
          </div>
        )}
      </div>
    </aside>
  );
}
