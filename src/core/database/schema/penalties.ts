// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLE: penalties
// =====================================================
// Seller penalty records for late fulfillment.
// Each penalty is a separate record with type, amount, status.
// =====================================================

import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { payments } from './orders';

// =====================================================
// TABLE: penalties
// =====================================================

export const penalties = pgTable(
  'penalties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'restrict' }),

    // ── Identification ──
    penaltyType: text('penalty_type', {
      enum: ['INCUMPLIMIENTO_PLAZO_PREPARACION', 'ABANDONO_PEDIDO'],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),

    // ── Amount ──
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    percentage: numeric('percentage', { precision: 5, scale: 2 }),
    productValue: numeric('product_value', { precision: 10, scale: 2 }),

    // ── Status ──
    status: text('status', {
      enum: ['pending', 'paid', 'cancelled', 'disputed'],
    })
      .notNull()
      .default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paymentMethod: text('payment_method'),
    paymentId: text('payment_id'),

    // ── Metadata ──
    orderNumber: text('order_number'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    notes: text('notes'),
  },
  (table) => ({
    businessIdIdx: index('idx_penalties_business_id').on(table.businessId),
    orderIdIdx: index('idx_penalties_order_id').on(table.orderId),
    statusIdx: index('idx_penalties_status').on(table.businessId, table.status),
    createdAtIdx: index('idx_penalties_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type Penalty = typeof penalties.$inferSelect;
export type NewPenalty = typeof penalties.$inferInsert;
