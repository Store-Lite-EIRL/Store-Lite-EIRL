// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLES: import_jobs, import_rows
// =====================================================

import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { businesses } from './businesses';
import { importJobStatusEnum, importRowStatusEnum } from './enums';
import { products } from './products';

// =====================================================
// TABLE: import_jobs
// =====================================================

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    status: importJobStatusEnum('status').notNull().default('pending'),
    totalRows: integer('total_rows').notNull().default(0),
    processedRows: integer('processed_rows').notNull().default(0),
    errorRows: integer('error_rows').notNull().default(0),
    fileName: text('file_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    businessIdIdx: index('idx_import_jobs_business_id').on(table.businessId),
    statusIdx: index('idx_import_jobs_status').on(table.status),
  }),
);

// =====================================================
// TABLE: import_rows
// =====================================================

export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    rowNumber: integer('row_number').notNull(),
    status: importRowStatusEnum('status').notNull().default('pending'),
    rawData: jsonb('raw_data').default({}),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    jobIdIdx: index('idx_import_rows_job_id').on(table.jobId),
    statusIdx: index('idx_import_rows_status').on(table.status),
    jobStatusIdx: index('idx_import_rows_job_status').on(table.jobId, table.status),
  }),
);

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
export type ImportRow = typeof importRows.$inferSelect;
export type NewImportRow = typeof importRows.$inferInsert;
