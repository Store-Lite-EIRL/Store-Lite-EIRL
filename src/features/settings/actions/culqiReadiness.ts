'use server';

import { eq, inArray } from 'drizzle-orm';

import { db } from '@/core/database/client';
import { businessSettings, businesses, productMedia, products } from '@/core/database/schema';
import type { ReadinessResult } from '@/features/settings/lib/culqiReadiness';
import { evaluateCulqiReadiness } from '@/features/settings/lib/culqiReadiness';

export async function checkCulqiReadiness(businessId: string): Promise<ReadinessResult> {
  const [businessData, settingsData, availableProducts] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: {
        id: true,
        email: true,
        address: true,
        socialLinks: true,
      },
    }),
    db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: {
        preferences: true,
      },
    }),
    db.query.products.findMany({
      where: eq(products.businessId, businessId),
      columns: {
        id: true,
        isAvailable: true,
        description: true,
        price: true,
      },
    }),
  ]);

  const onlyAvailable = availableProducts.filter((p) => p.isAvailable);
  const availableIds = onlyAvailable.map((p) => p.id);

  // Media is scoped to this business's available products only
  // (avoid scanning every store's media rows).
  const mediaData =
    availableIds.length > 0
      ? await db.query.productMedia.findMany({
          where: inArray(productMedia.productId, availableIds),
          columns: { productId: true },
        })
      : [];

  return evaluateCulqiReadiness({
    business: businessData,
    settings: settingsData
      ? { preferences: (settingsData.preferences as Record<string, unknown>) ?? null }
      : null,
    products: onlyAvailable,
    media: mediaData,
  });
}
