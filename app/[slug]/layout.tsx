import { db } from '@/core/database/client';
import { businesses, productCategories } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
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

  const categoryNames = categories.map((c) => c.name);

  // We might want to fetch products here too if they are needed by global components,
  // but for now let's keep it minimal or pass empty if not strictly required globally.
  // Actually, StorageProvider usually needs them.
  
  const productsList = await db.query.products.findMany({
    where: eq(businesses.id, business.id),
    with: {
      category: true,
      media: {
        orderBy: (media, { asc }) => [asc(media.displayOrder)],
      },
    },
  });

  const storageProducts: Product[] = productsList.map((p) => ({
    id: p.id,
    name: p.title,
    category: p.category?.name || 'Sin categoría',
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

  return (
    <AppLayout>
      <BusinessProviders
        businessSlug={slug}
        country={business.country}
        initialProducts={storageProducts}
        initialCategories={categoryNames}
      >
        {children}
        {modal}
      </BusinessProviders>
    </AppLayout>
  );
}
