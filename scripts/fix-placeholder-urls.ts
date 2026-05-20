// =====================================================
// FIX: Replace api.placeholder.com with via.placeholder.com
// =====================================================
// Description: api.placeholder.com no es un dominio válido.
// Las URLs de productos en la DB apuntan a ese dominio y
// causan SSL errors cuando Next.js Image Optimization
// intenta fetchearlas (ERR_SSL_TLSV1_UNRECOGNIZED_NAME).
// =====================================================
// Ejecutar: npx tsx scripts/fix-placeholder-urls.ts
// =====================================================

import { sql } from 'drizzle-orm';
import './src/core/database/client';

async function main() {
  console.log('🔍 Buscando URLs con api.placeholder.com...');

  try {
    // Usamos un client de drizzle client global expuesto
    const { db } = await import('./src/core/database/client');
    const { productMedia } = await import('./src/core/database/schema');
    const { ilike } = await import('drizzle-orm');

    // Contar cuántas filas afectadas
    const affected = await db
      .select({ count: sql`count(*)` })
      .from(productMedia)
      .where(ilike(productMedia.mediaUrl, '%api.placeholder.com%'));

    const count = Number(affected[0]?.count ?? 0);
    console.log(`📊 ${count} registros encontrados con api.placeholder.com`);

    if (count === 0) {
      console.log('✅ No hay nada que fixear.');
      process.exit(0);
    }

    // Reemplazar api.placeholder.com por via.placeholder.com
    const result = await db.execute(
      sql`UPDATE product_media
          SET media_url = REPLACE(media_url, 'https://api.placeholder.com', 'https://via.placeholder.com')
          WHERE media_url LIKE '%api.placeholder.com%'`,
    );

    console.log(`✅ ${count} URLs actualizadas a via.placeholder.com`);
    console.log('🎉 Listo — ya no deberías ver el SSL error.');
  } catch (e) {
    console.error('❌ Error:', e instanceof Error ? e.message : e);
  }

  process.exit(0);
}

main();
