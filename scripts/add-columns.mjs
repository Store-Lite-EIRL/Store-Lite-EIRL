import { db } from '../src/core/database/client.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔄 Agregando columnas de logística...');
  
  try {
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS shipped_at timestamptz`);
    console.log('✅ shipped_at');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at timestamptz`);
    console.log('✅ verified_at');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS completed_at timestamptz`);
    console.log('✅ completed_at');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejected_at timestamptz`);
    console.log('✅ rejected_at');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS seller_status text`);
    console.log('✅ seller_status');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ticket_image_url text`);
    console.log('✅ ticket_image_url');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason text`);
    console.log('✅ rejection_reason');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_image text`);
    console.log('✅ rejection_image');
    
    await db.execute(sql`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tracking_token text`);
    console.log('✅ tracking_token');
    
    console.log('🎉 Todas las columnas agregadas!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  
  process.exit(0);
}

main();