// =====================================================
// SCRIPT: Apply Migration 0014 (Finalization Flow)
// =====================================================
// Description: Standalone script to apply the finalization flow migration
// Usage: node scripts/apply-migration-0014.js
// =====================================================

require('dotenv').config();
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL or POSTGRES_URL environment variable is not set.');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function applyMigration() {
  console.log('🚀 Starting migration 0014: Finalization Flow...');

  try {
    // 1. Add new values to notification_type enum
    console.log('1️⃣ Adding values to notification_type enum...');
    await sql`ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_requested' BEFORE 'system'`;
    await sql`ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_confirmed' BEFORE 'system'`;
    await sql`ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_rejected' BEFORE 'system'`;
    await sql`ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_auto_finalized' BEFORE 'system'`;
    console.log('✅ notification_type enum updated.');

    // 2. Add new value to payment_status enum
    console.log('2️⃣ Adding esperando_confirmacion to payment_status enum...');
    await sql`ALTER TYPE "public"."payment_status" ADD VALUE IF NOT EXISTS 'esperando_confirmacion'`;
    console.log('✅ payment_status enum updated.');

    // 3. Add new columns to payments table
    console.log('3️⃣ Adding new columns to payments table...');
    await sql`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_requested_at" timestamp with time zone`;
    await sql`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_confirmed_at" timestamp with time zone`;
    await sql`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_deadline" timestamp with time zone`;
    console.log('✅ payments table columns added.');

    // 4. Add new indexes
    console.log('4️⃣ Creating new indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "idx_payments_finalization_requested_at" ON "payments" USING btree ("finalization_requested_at" DESC NULLS LAST)`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_payments_finalization_deadline" ON "payments" USING btree ("finalization_deadline")`;
    console.log('✅ Indexes created.');

    console.log('🎉 Migration 0014 applied successfully!');
  } catch (error) {
    console.error('❌ ERROR applying migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed.');
  }
}

applyMigration();
