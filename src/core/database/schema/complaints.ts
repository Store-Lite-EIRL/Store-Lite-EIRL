// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLE: complaint_book_records
// =====================================================
// Peruvian Libro de Reclamaciones (DS 011-2011-PCM).
// Each record is a complaint or claim filed by a consumer
// against a business. Stores all required fields per the
// Anexo I format for virtual complaint books.
// =====================================================

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { complaintScoreTierEnum } from './enums';
import { payments } from './orders';

// =====================================================
// TABLE: complaint_book_records
// =====================================================

export const complaintBookRecords = pgTable(
  'complaint_book_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Business reference ──
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),

    // ── Ticket identification ──
    // Format: LR-{year}-{businessIdShort}-{seq}
    ticketNumber: text('ticket_number').notNull().unique(),

    // ── Consumer identity ──
    consumerLastName: text('consumer_last_name').notNull(),
    consumerFirstName: text('consumer_first_name').notNull(),
    // 'dni' | 'ce'
    consumerDocType: text('consumer_doc_type', { enum: ['dni', 'ce'] }).notNull(),
    consumerDocId: text('consumer_doc_id').notNull(),
    consumerAddress: text('consumer_address').notNull(),
    consumerPhone: text('consumer_phone').notNull(),
    consumerEmail: text('consumer_email').notNull(),
    minorAge: boolean('minor_age').notNull().default(false),
    guardianName: text('guardian_name'),

    // ── Claim details ──
    // 'queja' | 'reclamo'
    claimType: text('claim_type', { enum: ['queja', 'reclamo'] })
      .notNull()
      .default('reclamo'),
    contractDescription: text('contract_description').notNull(),
    claimedAmount: numeric('claimed_amount', { precision: 10, scale: 2 }),
    claimDescription: text('claim_description').notNull(),
    consumerRequest: text('consumer_request').notNull(),

    // ── SLA / Status ──
    // 15 business days from creation
    slaDeadline: timestamp('sla_deadline', { withTimezone: true }).notNull(),
    status: text('status', {
      enum: ['pending', 'acknowledged', 'responded'],
    })
      .notNull()
      .default('pending'),
    adminResponse: text('admin_response'),
    adminRespondedAt: timestamp('admin_responded_at', { withTimezone: true }),

    // ── Auto-Deactivation Scoring (DS 011-2011-PCM) ──
    // Score 0-100 based on weighted factors
    score: integer('score').default(0),
    // Tier: 'verified' (>=60), 'under_review' (30-59), 'rejected' (<30)
    scoreTier: complaintScoreTierEnum('score_tier').default('rejected'),
    // Weight breakdown for audit trail
    scoreBreakdown: jsonb('score_breakdown')
      .$type<{
        linkedToOrder: boolean;
        buyerKycVerified: boolean;
        culqiChargeback: boolean;
        slaExpired: boolean;
        patternSimilar: boolean;
      }>()
      .default(sql`'{}'`),
    // Whether this complaint counts toward deactivation threshold
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    // ── Linked Order (for scoring) ──
    linkedOrderId: uuid('linked_order_id').references(() => payments.id, { onDelete: 'set null' }),

    // ── Email confirmation ──
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),

    // ── Retention (2 years minimum by law) ──
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete

    // ── Timestamps ──
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_cbr_business_id').on(table.businessId),
    ticketNumberIdx: index('idx_cbr_ticket_number').on(table.ticketNumber),
    statusIdx: index('idx_cbr_status').on(table.businessId, table.status),
    createdAtIdx: index('idx_cbr_created_at').on(table.createdAt.desc()),
    activeRecordsIdx: index('idx_cbr_active')
      .on(table.businessId, table.status)
      .where(sql`deleted_at IS NULL`),
    // Auto-deactivation scoring indexes
    scoreTierIdx: index('idx_cbr_score_tier').on(table.businessId, table.scoreTier),
    isVerifiedIdx: index('idx_cbr_is_verified')
      .on(table.businessId, table.isVerified)
      .where(sql`${table.isVerified} = true`),
    linkedOrderIdIdx: index('idx_cbr_linked_order_id').on(table.linkedOrderId),
    verifiedAtIdx: index('idx_cbr_verified_at').on(table.verifiedAt.desc()),
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type ComplaintBookRecord = typeof complaintBookRecords.$inferSelect;
export type NewComplaintBookRecord = typeof complaintBookRecords.$inferInsert;
