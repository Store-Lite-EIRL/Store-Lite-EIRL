import { db } from '@/core/database/client';
import { businesses, productCategories, products } from '@/core/database/schema';
import { getCanonicalBusinessUrl } from '@/shared/utils/url';
import { and, eq } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

export const revalidate = 3600;

interface SitemapParams {
  params: Promise<{ slug: string }>;
}

export default async function sitemap({ params }: SitemapParams): Promise<MetadataRoute.Sitemap> {
  const { slug } = await params;

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.slug, slug), eq(businesses.isActive, true)),
    columns: { id: true, slug: true, updatedAt: true },
  });

  if (!business) {
    return [];
  }

  const [allProducts, allCategories] = await Promise.all([
    db.query.products.findMany({
      where: and(eq(products.businessId, business.id), eq(products.isAvailable, true)),
      columns: { id: true, slug: true, updatedAt: true },
    }),
    db.query.productCategories.findMany({
      where: eq(productCategories.businessId, business.id),
      columns: { slug: true, updatedAt: true },
    }),
  ]);

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: getCanonicalBusinessUrl(business.slug),
    lastModified: business.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  };

  const productEntries: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: getCanonicalBusinessUrl(business.slug, `/product/${p.slug || p.id}`),
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const categoryEntries: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: getCanonicalBusinessUrl(business.slug, `/category/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [homeEntry, ...productEntries, ...categoryEntries];
}
