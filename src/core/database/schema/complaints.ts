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
import { boolean, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';

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
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type ComplaintBookRecord = typeof complaintBookRecords.$inferSelect;
export type NewComplaintBookRecord = typeof complaintBookRecords.$inferInsert;
