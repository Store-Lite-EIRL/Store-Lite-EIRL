// =====================================================
// FEEDBACK — Types
// =====================================================

import type { FeedbackResponse, FeedbackTicket } from '@/core/database/schema/feedback';

// ── Input types ──

export interface SubmitFeedbackInput {
  businessId: string;
  category: 'bug' | 'suggestion' | 'question' | 'other';
  subject: string;
  message: string;
}

export interface RespondToTicketInput {
  ticketId: string;
  message: string;
}

// ── Output types ──

export interface FeedbackTicketWithResponses extends FeedbackTicket {
  responses: FeedbackResponse[];
  businessName?: string;
  userName?: string;
}

export interface FeedbackHistoryItem {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  responseCount: number;
  createdAt: Date;
}

export type FeedbackPriority = 'low' | 'normal' | 'high';

export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type FeedbackRequestType = 'support' | 'feedback' | 'complaint';

// ── Action result types ──

export interface SubmitFeedbackResult {
  success: boolean;
  ticketId?: string;
  ticketNumber?: string;
  error?: string;
}

export interface GetFeedbackHistoryResult {
  success: boolean;
  tickets?: FeedbackHistoryItem[];
  error?: string;
}

export interface GetFeedbackTicketResult {
  success: boolean;
  ticket?: FeedbackTicketWithResponses;
  error?: string;
}
