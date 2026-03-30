import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductDetailContent from './components/ProductDetailContent';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const businessDetail = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!businessDetail) {
    notFound();
  }

  const { hasPaymentGateway } = await getBusinessEntitlements(businessDetail.id);

  return (
    <ProductDetailContent
      slug={slug}
      productId={productId}
      hasPaymentGateway={hasPaymentGateway}
    />
  );
}
