import { count } from 'drizzle-orm';
import { db } from './src/core/database/client';
import { productLikes, products } from './src/core/database/schema';

async function diagnose() {
  console.log('--- Product Likes Diagnosis ---');

  const likesCount = await db.select({ value: count() }).from(productLikes);
  console.log(`Total records in product_likes: ${likesCount[0].value}`);

  const allLikes = await db.select().from(productLikes).limit(10);
  console.log('Sample likes:', JSON.stringify(allLikes, null, 2));

  const topProducts = await db.select().from(products).orderBy(products.stars).limit(5);
  console.log(
    'Top products by stars:',
    topProducts.map((p) => ({ id: p.id, title: p.title, stars: p.stars })),
  );
}

diagnose().catch(console.error);
