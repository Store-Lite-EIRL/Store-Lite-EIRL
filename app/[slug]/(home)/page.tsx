'use server';

import { env } from '@/config/env';
import { replaceSlugInPath, resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { businessSettings, productCategories } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { getStorefrontLayoutFromPreferences, getStorefrontThemeFromPreferences, hasCustomStorefrontTheme } from '@/core/storefront';
import { getMemberPermissions } from '@/lib/permissions';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import BusinessPageContent from '../BusinessPageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) {
    return {
      title: 'Business Not Found',
    };
  }

  const { seoEnabled } = await getBusinessEntitlements(business.id);

  if (!seoEnabled) {
    return {
      title: `${business.name} | Store Lite`,
      description: business.description || `Welcome to ${business.name}`,
      robots: { index: false, follow: false },
    };
  }

  const title =
    business.seoTitle || `${business.name} — Tienda en ${business.city || 'Perú'} | Store Lite`;
  const description =
    business.seoDescription ||
    business.description ||
    `Bienvenido a ${business.name}, tu tienda de confianza.`;

  return {
    title,
    description,
    keywords: business.seoKeywords?.join(', '),
    other: {
      ...(business.geoRegion && { 'geo.region': business.geoRegion }),
      ...(business.geoPlacename && { 'geo.placename': business.geoPlacename }),
      ...(business.city && !business.geoPlacename && { 'geo.placename': business.city }),
      ...(business.latitude &&
        business.longitude && {
          'geo.position': `${business.latitude};${business.longitude}`,
          ICBM: `${business.latitude}, ${business.longitude}`,
        }),
    },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  const resolvedBusiness = await resolveBusinessSlug(slug);
  const business = resolvedBusiness?.business;

  if (!business) {
    return notFound();
  }

  if (resolvedBusiness.matchedAlias) {
    redirect(replaceSlugInPath(`/${slug}`, slug, resolvedBusiness.canonicalSlug));
  }

  const categories = await db.query.productCategories.findMany({
    where: eq(productCategories.businessId, business.id),
    orderBy: (categories, { asc }) => [asc(categories.displayOrder)],
  });
  const settings = await db.query.businessSettings.findFirst({
    where: eq(businessSettings.businessId, business.id),
    columns: {
      preferences: true,
    },
  });

  const cookieStore = await cookies();

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  // Acceso basado en dueño o equipo
  const { isOwner, permissions } = await getMemberPermissions(business.id, user?.id);

  // Consideramos staff a quien tenga acceso de gestión (Dueño o Miembro con algún permiso)
  const isStaff = isOwner || permissions.length > 0;

  const entitlements = await getBusinessEntitlements(business.id);
  const { hasPaymentGateway, chatEnabled, seoEnabled, canCustomizeStorefront } = entitlements;

  const jsonLd = seoEnabled
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: business.name,
        description: business.seoDescription || business.description,
        url: `${env.nextPublicAppUrl}/${business.slug}`,
        logo: business.logoUrl,
        image: business.coverImageUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.city,
          addressCountry: business.country || 'PE',
        },
        geo:
          business.latitude && business.longitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: business.latitude,
                longitude: business.longitude,
              }
            : undefined,
        telephone: business.whatsappNumber,
      }
    : null;

  const allProducts = await db.query.products.findMany({
    where: (p, { and, eq }) => {
      const basicFilter = eq(p.businessId, business.id);
      // El staff (dueño+equipo) ve todos los productos para poder gestionarlos
      return isStaff ? basicFilter : and(basicFilter, eq(p.isAvailable, true));
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    with: {
      media: {
        orderBy: (m, { asc }) => [asc(m.displayOrder)],
      },
      category: true,
    },
  });

  const savedStorefrontTheme = hasCustomStorefrontTheme(settings?.preferences)
    ? getStorefrontThemeFromPreferences(settings?.preferences)
    : undefined;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BusinessPageContent
        business={business}
        isOwner={isOwner}
        isStaff={isStaff}
        isLoggedIn={isLoggedIn}
        categories={categories}
        products={allProducts}
        hasPaymentGateway={hasPaymentGateway}
        isPaymentConfigured={entitlements.isPaymentConfigured}
        culqiPublicKey={entitlements.culqiPublicKey}
        chatEnabled={chatEnabled}
        storefrontLayout={getStorefrontLayoutFromPreferences(settings?.preferences)}
        storefrontTheme={canCustomizeStorefront ? savedStorefrontTheme : undefined}
        previewCardTheme={savedStorefrontTheme}
        businessName={business.name}
        businessRuc={business.taxId ?? undefined}
        businessAddress={business.address ?? undefined}
      />
    </>
  );
}
