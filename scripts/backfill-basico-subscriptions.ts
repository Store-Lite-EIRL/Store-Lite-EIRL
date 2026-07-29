// =====================================================
// BACKFILL: Insert basico subscriptions for existing businesses
// =====================================================
// Description: Existing businesses created before the auto-subscription
// feature have no row in business_subscriptions. This script finds
// all such businesses and inserts a basico (free tier) subscription
// for each one.
// =====================================================
// Ejecutar: npx tsx scripts/backfill-basico-subscriptions.ts
// =====================================================

import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔍 Buscando negocios sin suscripción...');

  try {
    const { db } = await import('./src/core/database/client');

    // Count businesses without a subscription row
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM businesses b
      LEFT JOIN business_subscriptions bs ON b.id = bs.business_id
      WHERE bs.business_id IS NULL
    `);

    const count = Number(countResult.rows?.[0]?.count ?? 0);

    if (count === 0) {
      console.log('✅ No businesses needed backfill');
      process.exit(0);
    }

    // Insert basico subscription for each business without one
    await db.execute(sql`
      INSERT INTO business_subscriptions (business_id, plan_type, plan_status, plan_start_date, plan_end_date, cancel_at_period_end)
      SELECT b.id, 'basico', 'active', NOW(), NULL, FALSE
      FROM businesses b
      LEFT JOIN business_subscriptions bs ON b.id = bs.business_id
      WHERE bs.business_id IS NULL
      ON CONFLICT (business_id) DO NOTHING
    `);

    console.log(`✅ Inserted ${count} basico subscriptions`);
    console.log('🎉 Backfill complete.');
  } catch (e) {
    console.error('❌ Error:', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  process.exit(0);
}

main();
