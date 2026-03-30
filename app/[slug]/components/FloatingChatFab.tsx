'use client';

import { useState } from 'react';
import { ChatDialog } from './ChatDialog';
import styles from './FloatingChatFab.module.css';

interface FloatingChatFabProps {
  businessName: string;
  businessId: string;
  businessLogo?: string | null;
}

export function FloatingChatFab({ businessName, businessId, businessLogo }: FloatingChatFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Transparent close-on-outside-click layer */}
      {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} aria-hidden />}

      {/* Chat dialog */}
      {isOpen && (
        <ChatDialog
          businessName={businessName}
          businessId={businessId}
          businessLogo={businessLogo}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* FAB button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        title="Chat con la tienda"
      >
        <span className={styles.fabIcon}>{isOpen ? 'close' : 'chat'}</span>
      </button>
    </>
  );
}
