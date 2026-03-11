"use client";

import React from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import styles from './messages.module.css';

export default function MessagesPage() {
  // Temporary mock state to demonstrate UI
  const [activeChat, setActiveChat] = React.useState<number | null>(1);

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.sidebarSection}>
        <ChatSidebar activeChat={activeChat} onSelectChat={setActiveChat} />
      </div>
      <div className={styles.chatSection}>
        {activeChat ? (
          <ChatWindow chatId={activeChat} />
        ) : (
          <div className={styles.emptyState}>
            <md-icon className={styles.emptyIcon}>chat</md-icon>
            <h2>Select a conversation</h2>
            <p>Choose a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
