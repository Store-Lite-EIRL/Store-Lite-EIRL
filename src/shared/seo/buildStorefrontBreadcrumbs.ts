import { getCanonicalBusinessUrl } from '@/shared/utils/url';

// ── Types ────────────────────────────────────────────────────────────────────

interface BreadcrumbListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbListItem[];
}

export interface BusinessLike {
  name: string;
  slug: string;
}

export interface ProductLike {
  title: string;
  slug?: string | null;
  id: string;
}

// ── Builders ─────────────────────────────────────────────────────────────────

/**
 * Builds BreadcrumbList for the home page.
 * Items: [{ position: 1, name: "Inicio", item: canonicalHomeUrl }]
 */
export function buildHomeBreadcrumbs(business: BusinessLike): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: getCanonicalBusinessUrl(business.slug),
      },
    ],
  };
}

/**
 * Builds BreadcrumbList for a product page.
 * Items: Inicio → Business → Product
 */
export function buildProductBreadcrumbs(
  business: BusinessLike,
  product: ProductLike,
): BreadcrumbList {
  const productSlug = product.slug || product.id;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: getCanonicalBusinessUrl(business.slug),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: business.name,
        item: getCanonicalBusinessUrl(business.slug),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: getCanonicalBusinessUrl(business.slug, `/product/${productSlug}`),
      },
    ],
  };
}
