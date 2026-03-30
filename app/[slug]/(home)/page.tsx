import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, productCategories } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { createServerClient } from '@supabase/ssr';
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
  const isOwnerByAuth = Boolean(user?.id && business.ownerId === user.id);
  const isOwner = isOwnerByAuth;

  const entitlements = await getBusinessEntitlements(business.id);
  const { hasPaymentGateway, chatEnabled } = entitlements;

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
      isLoggedIn={isLoggedIn}
      categories={categories}
      products={allProducts}
      hasPaymentGateway={hasPaymentGateway}
      chatEnabled={chatEnabled}
    />
  );
}
