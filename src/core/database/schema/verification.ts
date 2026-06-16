// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLE: verification_otps (Twilio WhatsApp OTP)
// =====================================================
// NOTA: code_hash almacena HMAC-SHA256 del código OTP
// NUNCA se almacena el código en texto plano.
// =====================================================

import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// =====================================================
// TABLE: verification_otps
// =====================================================

export const verificationOtps = pgTable(
  'verification_otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(), // phone number or email
    codeHash: text('code_hash').notNull(), // HMAC-SHA256 del OTP (nunca texto plano)
    type: text('type', { enum: ['phone', 'email'] }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index('verification_otps_identifier_idx').on(table.identifier),
    expiresAtIdx: index('verification_otps_expires_at_idx').on(table.expiresAt),
  }),
);

export type VerificationOtp = typeof verificationOtps.$inferSelect;
export type NewVerificationOtp = typeof verificationOtps.$inferInsert;
