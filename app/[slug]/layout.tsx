import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { businesses, productCategories, products } from '@/core/database/schema';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import AppLayout from '../../src/shared/components/layout/AppLayout';
import { BusinessProviders } from './components/BusinessProviders';
import type { Product } from './storage/data';

interface BusinessLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BusinessLayout({ children, modal, params }: BusinessLayoutProps) {
  const { slug } = await params;

  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
    });

    if (!business) {
      return notFound();
    }

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

    const isOwner = Boolean(user?.id && business.ownerId === user.id);

    // Block public access to inactive businesses, but allow the owner to see it
    if (!business.isActive && !isOwner) {
      return notFound();
    }

    // Calcular entitlements del negocio según su plan de suscripción activo
    const entitlements = await getBusinessEntitlements(business.id);
    const navbarPlanName = entitlements.plan;

    let categoryNames: string[] | undefined;
    let storageProducts: Product[] | undefined;

    if (isOwner) {
      const [categories, productsList] = await Promise.all([
        db.query.productCategories.findMany({
          where: eq(productCategories.businessId, business.id),
          orderBy: (categories, { asc }) => [asc(categories.displayOrder)],
        }),
        db.query.products.findMany({
          where: eq(products.businessId, business.id),
          with: {
            category: true,
            media: {
              orderBy: (media, { asc }) => [asc(media.displayOrder)],
            },
          },
        }),
      ]);

      categoryNames = categories.map((c) => c.name);
      storageProducts = productsList.map((p) => ({
        id: p.id,
        name: p.title,
        category: p.category?.name || 'Sin categoria',
        stock: p.stock,
        price: String(p.price),
        status: p.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
        image: p.media?.[0]?.mediaUrl || '',
        images: p.media?.map((m) => m.mediaUrl) || [],
        description: p.description || '',
        currency: p.currency,
        brand: p.brand,
        tags: p.tags,
        shippingInfo: p.shippingInfo,
        saleStatus: p.saleStatus || 'NORMAL',
        secondPrice: p.secondPrice ? String(p.secondPrice) : null,
      }));
    }

    return (
      <AppLayout showNavbarByDefault={isOwner} navbarPlanName={navbarPlanName}>
        <BusinessProviders
          businessSlug={slug}
          country={business.country}
          entitlements={entitlements}
          initialProducts={storageProducts}
          initialCategories={categoryNames}
        >
          {children}
          {modal}
        </BusinessProviders>
      </AppLayout>
    );
  } catch (error) {
    console.error(`[BusinessLayout] Failed to load business "${slug}":`, error);
    return notFound();
  }
}
