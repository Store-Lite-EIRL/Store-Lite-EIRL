'use client';

// =====================================================
// FeedbackPageClient — Client-side feedback page
// =====================================================

import { Icon } from '@/shared/components/ui';
import { useState } from 'react';
import styles from './ayuda.module.css';
import { FeedbackForm } from './components/FeedbackForm';
import { FeedbackHistory } from './components/FeedbackHistory';
import { FeedbackTicketDetail } from './components/FeedbackTicketDetail';

interface FeedbackPageClientProps {
  businessId: string;
  priority: 'low' | 'normal' | 'high';
  userRole: 'owner' | 'admin' | 'member';
}

type Tab = 'submit' | 'history';

export function FeedbackPageClient({ businessId, priority, userRole }: FeedbackPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('submit');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // If viewing a ticket detail
  if (selectedTicketId) {
    return (
      <div className={styles.feedbackPage}>
        <FeedbackTicketDetail
          ticketId={selectedTicketId}
          _businessId={businessId}
          userRole={userRole}
          onBack={() => setSelectedTicketId(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.feedbackPage}>
      {/* Header */}
      <div className={styles.feedbackHeader}>
        <h1 className={styles.feedbackTitle}>Feedback</h1>
        <p className={styles.feedbackSubtitle}>
          Ayudanos a mejorar Store Lite. Enviá sugerencias, reportá bugs o hacé consultas.
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.feedbackTabs}>
        <button
          className={`${styles.feedbackTab} ${activeTab === 'submit' ? styles.feedbackTabActive : ''}`}
          onClick={() => setActiveTab('submit')}
          type="button"
        >
          <Icon size={18}>edit</Icon>
          Enviar feedback
        </button>
        <button
          className={`${styles.feedbackTab} ${activeTab === 'history' ? styles.feedbackTabActive : ''}`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          <Icon size={18}>history</Icon>
          Historial
        </button>
      </div>

      {/* Content */}
      {activeTab === 'submit' && (
        <FeedbackForm
          businessId={businessId}
          priority={priority}
          onSuccess={() => setActiveTab('history')}
        />
      )}

      {activeTab === 'history' && (
        <FeedbackHistory businessId={businessId} onSelectTicket={setSelectedTicketId} />
      )}
    </div>
  );
}
