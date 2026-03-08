import { db } from '@/core/database/client';
import { businesses, productCategories } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import BusinessPageContent from '../BusinessPageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) {
    return {
      title: 'Business Not Found',
    };
  }

  return {
    title: `${business.name} | Store Lite`,
    description: business.description || `Welcome to ${business.name}`,
  };
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) {
    return notFound();
  }

  const categories = await db.query.productCategories.findMany({
    where: eq(productCategories.businessId, business.id),
    orderBy: (categories, { asc }) => [asc(categories.displayOrder)],
  });

  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get('selected_business_slug')?.value;
  const isOwner = selectedSlug === slug;

  const allProducts = await db.query.products.findMany({
    where: (p, { and, eq }) => {
      const basicFilter = eq(p.businessId, business.id);
      return isOwner ? basicFilter : and(basicFilter, eq(p.isAvailable, true));
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    with: {
      media: {
        orderBy: (m, { asc }) => [asc(m.displayOrder)],
      },
      category: true,
    },
  });

  return (
    <BusinessPageContent
      business={business}
      isOwner={isOwner}
      categories={categories}
      products={allProducts}
    />
  );
}
