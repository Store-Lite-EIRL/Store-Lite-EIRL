'use server';

import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export async function getBusinessBySlug(slug: string) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: {
        id: true,
        name: true,
        slug: true,
        coverImageUrl: true,
        logoUrl: true,
        storeType: true,
      },
    });

    return business || null;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}
