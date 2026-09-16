// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLES: deactivation_notices, appeals
// =====================================================
// Auto-deactivation system for DS 011-2011-PCM compliance.
// Written notification (DeactivationNotice) and appeal workflow (Appeal).
// =====================================================

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { appealStatusEnum, deactivationReasonEnum } from './enums';
import { profiles } from './profiles';

// =====================================================
// TABLE: deactivation_notices
// =====================================================
// Written notification record for DS 011-2011-PCM compliance.
// Created when auto-deactivation is triggered. Contains all
// evidence for the deactivation decision.
// =====================================================

export const deactivationNotices = pgTable(
  'deactivation_notices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),

    // Trigger details
    reason: deactivationReasonEnum('reason').notNull(),
    complaintCount: integer('complaint_count').default(0),
    incompleteOrderRate: integer('incomplete_order_rate'), // percentage * 100 (e.g., 4000 = 40.00%)

    // Evidence references (JSON for flexibility)
    evidence: jsonb('evidence')
      .$type<{
        complaintIds: string[];
        orderIds: string[];
        scoreBreakdown?: Record<string, number>;
      }>()
      .default(sql`'{}'`),

    // DS 011 compliance
    // Written notification sent via email
    notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
    notificationMethod: text('notification_method'), // 'email', 'certified_mail', etc.
    notificationReference: text('notification_reference'), // tracking number for certified mail

    // Grace period (72 hours from notification)
    gracePeriodEndsAt: timestamp('grace_period_ends_at', { withTimezone: true }).notNull(),

    // Appeal window (10 business days from notification)
    appealDeadline: timestamp('appeal_deadline', { withTimezone: true }).notNull(),

    // Status
    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: text('resolved_by'), // 'auto' | 'appeal_approved' | 'admin_override'

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_deactivation_notices_business_id').on(table.businessId),
    reasonIdx: index('idx_deactivation_notices_reason').on(table.reason),
    gracePeriodEndsAtIdx: index('idx_deactivation_notices_grace_ends_at').on(
      table.gracePeriodEndsAt,
    ),
    appealDeadlineIdx: index('idx_deactivation_notices_appeal_deadline').on(table.appealDeadline),
    isResolvedIdx: index('idx_deactivation_notices_is_resolved').on(table.isResolved),
    createdAtIdx: index('idx_deactivation_notices_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: appeals
// =====================================================
// Seller appeal against auto-deactivation.
// 10 business day SLA for admin review per DS 011.
// =====================================================

export const appeals = pgTable(
  'appeals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    deactivationNoticeId: uuid('deactivation_notice_id')
      .notNull()
      .references(() => deactivationNotices.id, { onDelete: 'cascade' }),

    // Seller submission
    sellerStatement: text('seller_statement').notNull(),
    sellerEvidence: jsonb('seller_evidence')
      .$type<{
        documents: string[]; // URLs to uploaded evidence
        arguments: string[];
      }>()
      .default(sql`'{}'`),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),

    // Admin review
    status: appealStatusEnum('status').notNull().default('pending'),
    adminReviewerId: uuid('admin_reviewer_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    adminNotes: text('admin_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // SLA tracking (10 business days)
    slaDeadline: timestamp('sla_deadline', { withTimezone: true }).notNull(),
    slaBreached: boolean('sla_breached').notNull().default(false),

    // Resolution
    resolution: text('resolution'), // 'reactivated' | 'upheld'
    reactivatedAt: timestamp('reactivated_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_appeals_business_id').on(table.businessId),
    deactivationNoticeIdIdx: index('idx_appeals_deactivation_notice_id').on(
      table.deactivationNoticeId,
    ),
    statusIdx: index('idx_appeals_status').on(table.status),
    slaDeadlineIdx: index('idx_appeals_sla_deadline').on(table.slaDeadline),
    submittedAtIdx: index('idx_appeals_submitted_at').on(table.submittedAt.desc()),
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type DeactivationNotice = typeof deactivationNotices.$inferSelect;
export type NewDeactivationNotice = typeof deactivationNotices.$inferInsert;

export type Appeal = typeof appeals.$inferSelect;
export type NewAppeal = typeof appeals.$inferInsert;
