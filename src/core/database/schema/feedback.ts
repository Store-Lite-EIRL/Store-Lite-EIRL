// =====================================================
// DRIZZLE ORM SCHEMA - Feedback System
// TABLES: feedback_tickets, feedback_responses
// =====================================================
// Seller feedback system for Store Lite support.
// Users submit categorized feedback (bugs, suggestions, questions).
// Admin responds via email, responses stored in DB.
// Priority based on plan: enterprise_pro = high, others = normal/low.
// =====================================================

import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import {
  feedbackCategoryEnum,
  feedbackPriorityEnum,
  feedbackRequestTypeEnum,
  feedbackSenderTypeEnum,
  feedbackStatusEnum,
} from './enums';
import { profiles } from './profiles';

// =====================================================
// TABLE: feedback_tickets
// =====================================================

export const feedbackTickets = pgTable(
  'feedback_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ── References ──
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // ── Ticket data ──
    ticketNumber: text('ticket_number').notNull().unique(),
    requestType: feedbackRequestTypeEnum('request_type').notNull().default('feedback'),
    category: feedbackCategoryEnum('category').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),

    // ── Status & priority ──
    status: feedbackStatusEnum('status').notNull().default('open'),
    priority: feedbackPriorityEnum('priority').notNull().default('normal'),

    // ── Timestamps ──
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_ft_business_id').on(table.businessId),
    userIdIdx: index('idx_ft_user_id').on(table.userId),
    statusIdx: index('idx_ft_status').on(table.status),
    ticketNumberIdx: index('idx_ft_ticket_number').on(table.ticketNumber),
    createdAtIdx: index('idx_ft_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: feedback_responses
// =====================================================

export const feedbackResponses = pgTable(
  'feedback_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Reference to ticket ──
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => feedbackTickets.id, { onDelete: 'cascade' }),

    // ── Response data ──
    senderType: feedbackSenderTypeEnum('sender_type').notNull(),
    message: text('message').notNull(),

    // ── Timestamps ──
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('idx_fr_ticket_id').on(table.ticketId),
    createdAtIdx: index('idx_fr_created_at').on(table.createdAt),
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type FeedbackTicket = typeof feedbackTickets.$inferSelect;
export type NewFeedbackTicket = typeof feedbackTickets.$inferInsert;
export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
export type NewFeedbackResponse = typeof feedbackResponses.$inferInsert;
