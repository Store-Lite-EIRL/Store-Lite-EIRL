import { replaceSlugInPath, resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { products as productsTable } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { and, eq, or } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import ProductDetailContent from './components/ProductDetailContent';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;

  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) return {};

  const product = await db.query.products.findFirst({
    where: and(
      eq(productsTable.businessId, business.id),
      or(eq(productsTable.id, productId), eq(productsTable.slug, productId))
    ),
    with: {
      media: {
        orderBy: (m, { asc }) => [asc(m.displayOrder)],
        limit: 1,
      }
    }
  });

  if (!product) return {};

  const { seoEnabled } = await getBusinessEntitlements(business.id);

  if (!seoEnabled) {
    return {
      title: `${product.title} | ${business.name}`,
      robots: { index: false, follow: false },
    };
  }

  const title = product.seoTitle || `${product.title} - ${business.name} | ${business.city || ''}`;
  const description = product.seoDescription || product.description?.slice(0, 160) || `Compra ${product.title} en ${business.name}`;

  return {
    title,
    description,
    keywords: product.tags?.join(', '),
    openGraph: {
      title,
      description,
      images: product.media?.[0]?.mediaUrl ? [{ url: product.media[0].mediaUrl }] : [],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug, productId } = await params;

  const resolvedBusiness = await resolveBusinessSlug(slug);
  const businessDetail = resolvedBusiness?.business;

  if (!businessDetail) {
    notFound();
  }

  if (resolvedBusiness.matchedAlias) {
    redirect(replaceSlugInPath(`/${slug}/product/${productId}`, slug, resolvedBusiness.canonicalSlug));
  }

  const product = await db.query.products.findFirst({
    where: and(
      eq(productsTable.businessId, businessDetail.id),
      or(eq(productsTable.id, productId), eq(productsTable.slug, productId))
    ),
    with: {
      media: {
        orderBy: (m, { asc }) => [asc(m.displayOrder)],
        limit: 1,
      }
    }
  });

  if (!product) {
    notFound();
  }

  const entitlements = await getBusinessEntitlements(businessDetail.id);
  const { hasPaymentGateway, seoEnabled } = entitlements;

  const jsonLd = seoEnabled ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.media?.[0]?.mediaUrl,
    "brand": {
      "@type": "Brand",
      "name": product.brand || businessDetail.name
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency,
      "availability": product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": businessDetail.name
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailContent
        slug={resolvedBusiness.canonicalSlug}
        productId={productId}
        hasPaymentGateway={hasPaymentGateway}
        isPaymentConfigured={entitlements.isPaymentConfigured}
        culqiPublicKey={entitlements.culqiPublicKey}
      />
    </>
  );
}
