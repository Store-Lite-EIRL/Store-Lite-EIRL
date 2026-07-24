// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLE: notifications
// =====================================================

import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { notificationCategoryEnum, notificationTypeEnum } from './enums';

// =====================================================
// TABLE: notifications
// =====================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),

    // Tipo de notificación (acción específica)
    type: notificationTypeEnum('type').notNull(),
    // Categoría para filtrado en UI
    category: notificationCategoryEnum('category').notNull(),

    // Contenido
    title: text('title').notNull(),
    message: text('message').notNull(),
    // Datos adicionales (orderId, productId, etc)
    data: jsonb('data').default({}),

    // Estado
    isRead: boolean('is_read').default(false).notNull(),
    isDismissed: boolean('is_dismissed').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => ({
    businessIdIdx: index('idx_notifications_business_id').on(table.businessId),
    businessIdCreatedAtIdx: index('idx_notifications_business_created').on(
      table.businessId,
      table.createdAt.desc(),
    ),
    unreadIdx: index('idx_notifications_unread')
      .on(table.businessId, table.isRead)
      .where(sql`${table.isRead} = false AND ${table.isDismissed} = false`),
    categoryIdx: index('idx_notifications_category').on(table.businessId, table.category),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
