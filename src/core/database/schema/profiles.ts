// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLE: profiles
// =====================================================

import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// =====================================================
// TABLE: profiles
// =====================================================

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // Removed .references(() => authUsers.id) to fix drizzle-kit hangs
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    avatarUrl: text('avatar_url'),
    providerId: text('provider_id'), // 'google', 'github', etc.
    age: integer('age'),
    address: text('address'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // ageCheck: check('age_check', sql`${table.age} >= 13 AND ${table.age} <= 120`),
    emailIdx: index('idx_profiles_email').on(table.email),
    fullNameIdx: index('idx_profiles_full_name').on(table.fullName),
  }),
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
