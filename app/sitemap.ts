import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { eq } from 'drizzle-orm';
import { MetadataRoute } from 'next';

// Disable static generation — sitemap is generated on-demand
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.nextPublicAppUrl;

  // 1. Fetch all active businesses
  const allActiveBusinesses = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      updatedAt: businesses.updatedAt,
    })
    .from(businesses)
    .where(eq(businesses.isActive, true));

  // 2. Filter using centralized entitlements logic (SEO Enabled)
  const seoEnabledBusinesses = new Map<string, (typeof allActiveBusinesses)[number]>();

  await Promise.all(
    allActiveBusinesses.map(async (b) => {
      const { seoEnabled } = await getBusinessEntitlements(b.id);
      if (seoEnabled) {
        seoEnabledBusinesses.set(b.id, b);
      }
    }),
  );

  const businessUrls: MetadataRoute.Sitemap = Array.from(seoEnabledBusinesses.values()).map(
    (b) => ({
      url: `${baseUrl}/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  );

  const seoBusinessIds = Array.from(seoEnabledBusinesses.keys());

  // 3. Handle case with no SEO businesses
  if (seoBusinessIds.length === 0) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }

  // 4. Fetch products for SEO-enabled businesses
  const allProducts = await db.query.products.findMany({
    where: (p, { and, eq, inArray }) =>
      and(eq(p.isAvailable, true), inArray(p.businessId, seoBusinessIds)),
    with: {
      business: {
        columns: {
          slug: true,
        },
      },
    },
  });

  const productUrls: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: `${baseUrl}/${p.business.slug}/product/${p.slug || p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...businessUrls,
    ...productUrls,
  ];
}
