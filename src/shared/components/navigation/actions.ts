'use server';

import { db } from '@/core/database/client';
import { resolveBusinessSlug } from '@/core/business/slug';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export async function getBusinessBySlug(slug: string) {
  try {
    const resolvedBusiness = await resolveBusinessSlug(slug);
    if (!resolvedBusiness) {
      return null;
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, resolvedBusiness.business.id),
      columns: {
        id: true,
        name: true,
        slug: true,
        coverImageUrl: true,
        logoUrl: true,
        storeType: true,
      },
      with: {
        subscriptions: {
          columns: {
            planType: true,
          },
        },
      },
    });

    return business || null;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}
