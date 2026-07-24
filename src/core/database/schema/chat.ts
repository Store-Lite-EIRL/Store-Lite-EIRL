// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLES: chat_sessions, messages
// =====================================================

import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { payments } from './orders';

// =====================================================
// TABLE: chat_sessions
// =====================================================

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
    guestId: text('guest_id').notNull(),
    guestName: text('guest_name').notNull(),
    guestGender: text('guest_gender').default(''),
    status: text('status', { enum: ['active', 'closed'] }).default('active'),
    authUserId: uuid('auth_user_id'),
    guestEmail: text('guest_email'),
    guestAvatarUrl: text('guest_avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    guestIdIdx: index('idx_chat_sessions_guest_id').on(table.guestId),
    businessIdIdx: index('idx_chat_sessions_business_id').on(table.businessId),
    paymentIdIdx: index('idx_chat_sessions_payment_id').on(table.paymentId),
  }),
);

// =====================================================
// TABLE: messages
// =====================================================

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    isFromStore: boolean('is_from_store').default(false),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('idx_messages_session_id').on(table.sessionId),
    paymentIdIdx: index('idx_messages_payment_id').on(table.paymentId),
    createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
  }),
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
