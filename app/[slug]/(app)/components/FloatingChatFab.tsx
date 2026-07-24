'use client';

import { useEffect, useState } from 'react';
import { ChatDialog } from './ChatDialog';
import styles from './FloatingChatFab.module.css';

interface FloatingChatFabProps {
  businessName: string;
  businessId: string;
  slug: string;
  businessLogo?: string | null;
  initialOpen?: boolean;
}

export function FloatingChatFab({
  businessName,
  businessId,
  slug,
  businessLogo,
  initialOpen = false,
}: FloatingChatFabProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  // Auto-open on mount if returning from Google OAuth
  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true);
    }
  }, [initialOpen]);

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
          slug={slug}
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
