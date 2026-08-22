import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { getCanonicalBusinessUrl } from '@/shared/utils/url';
import { eq } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

// Static marketing/legal routes — always crawlable regardless of DB state.
function staticSitemap(baseUrl: string): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/devoluciones`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/libro-reclamaciones`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}

function fallbackSitemap(baseUrl: string): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...staticSitemap(baseUrl),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.nextPublicAppUrl;

  // 1. Fetch all active businesses
  let allActiveBusinesses: { id: string; slug: string; updatedAt: Date }[];

  try {
    allActiveBusinesses = await db
      .select({
        id: businesses.id,
        slug: businesses.slug,
        updatedAt: businesses.updatedAt,
      })
      .from(businesses)
      .where(eq(businesses.isActive, true));
  } catch {
    // DB unavailable (CI, local dev without DB, etc.) — minimal sitemap
    return fallbackSitemap(baseUrl);
  }

  // 2. Filter using centralized entitlements logic (SEO Enabled)
  const seoEnabledBusinesses = new Map<string, (typeof allActiveBusinesses)[number]>();

  try {
    await Promise.all(
      allActiveBusinesses.map(async (b) => {
        const { seoEnabled } = await getBusinessEntitlements(b.id);
        if (seoEnabled) {
          seoEnabledBusinesses.set(b.id, b);
        }
      }),
    );
  } catch {
    return fallbackSitemap(baseUrl);
  }

  const businessUrls: MetadataRoute.Sitemap = Array.from(seoEnabledBusinesses.values()).map(
    (b) => ({
      url: getCanonicalBusinessUrl(b.slug),
      lastModified: b.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  );

  const seoBusinessIds = Array.from(seoEnabledBusinesses.keys());

  // 3. Handle case with no SEO businesses
  if (seoBusinessIds.length === 0) {
    return fallbackSitemap(baseUrl);
  }

  // 4. Fetch products for SEO-enabled businesses
  let allProducts: {
    slug: string | null;
    id: string;
    updatedAt: Date;
    business: { slug: string };
  }[];

  try {
    allProducts = await db.query.products.findMany({
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
  } catch {
    return fallbackSitemap(baseUrl);
  }

  const productUrls: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: getCanonicalBusinessUrl(p.business.slug, `/product/${p.slug || p.id}`),
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
    ...staticSitemap(baseUrl),
    ...businessUrls,
    ...productUrls,
  ];
}
