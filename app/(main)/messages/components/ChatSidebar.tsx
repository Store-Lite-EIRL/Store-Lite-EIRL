'use client';
import React from 'react';
import styles from '../messages.module.css';

interface ChatSidebarProps {
  activeChat: number | null;
  onSelectChat: (id: number) => void;
}

const MOCK_CHATS = [
  { id: 1, name: 'Alice Smith', initial: 'A', preview: 'Hey, are we still on for tomorrow?', time: '10:42 AM', unread: 2 },
  { id: 2, name: 'Bob Johnson', initial: 'B', preview: 'The new designs look great!', time: 'Yesterday', unread: 0 },
  { id: 3, name: 'Support Team', initial: 'S', preview: 'Your ticket #1234 has been resolved.', time: 'Tuesday', unread: 0 },
];

export default function ChatSidebar({ activeChat, onSelectChat }: ChatSidebarProps) {
  return (
    <>
      <div className={styles.sidebarHeader}>
        <h2>Messages</h2>
        <md-icon-button>
          <md-icon>edit_square</md-icon>
        </md-icon-button>
      </div>
      <div className={styles.chatList}>
        {MOCK_CHATS.map((chat) => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${activeChat === chat.id ? styles.active : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className={styles.avatar}>{chat.initial}</div>
            <div className={styles.chatInfo}>
              <h3 className={styles.chatName}>{chat.name}</h3>
              <p className={styles.chatPreview}>{chat.preview}</p>
            </div>
            <div className={styles.chatMeta}>
              <span>{chat.time}</span>
              {chat.unread > 0 && (
                <div className={styles.badgeNum} style={{ position: 'relative', top: 0, right: 0 }}>
                  {chat.unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
