'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import { useCallback, useEffect, useState } from 'react';
import styles from './AppSettingsModal.module.css';

interface AppSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type SettingsTab = 'apariencia';

const NAV_ITEMS: {
  id: SettingsTab;
  label: string;
  icon: string;
  comingSoon?: boolean;
}[] = [{ id: 'apariencia', label: 'Apariencia', icon: 'palette' }];

export default function AppSettingsModal({ open, onClose }: AppSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('apariencia');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  if (!open) return null;

  const renderContent = () => {
    if (activeTab === 'apariencia') {
      return (
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Apariencia
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              margin: '0 0 24px',
            }}
          >
            Personalizá los colores y la apariencia de tu panel.
          </p>
          <ThemeSettings />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContainer}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Ajustes</h3>

          <nav className={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`${styles.navButton} ${activeTab === item.id ? styles.navButtonActive : ''} ${item.comingSoon ? styles.navButtonDisabled : ''}`}
                onClick={() => !item.comingSoon && setActiveTab(item.id)}
                disabled={item.comingSoon}
              >
                <Icon size={20}>{item.icon}</Icon>
                {item.label}
                {item.comingSoon && <span className={styles.comingSoon}>Pronto</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className={styles.mainContent}>
          {renderContent()}

          <div className={styles.closeButtonContainer}>
            <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
              <Icon size={18}>close</Icon>
            </button>
            <span className={styles.closeHint}>ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
