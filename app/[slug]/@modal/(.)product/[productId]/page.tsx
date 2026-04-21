import { resolveBusinessSlug } from '@/core/business/slug';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import ProductModal from '../../../components/ProductModal';
import ProductDetailContent from '../../../product/[productId]/components/ProductDetailContent';

export default async function ProductInterceptPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;
  
  let entitlements = null;
  if (business) {
    entitlements = await getBusinessEntitlements(business.id);
  }

  return (
    <ProductModal fullPageHref={`/${slug}/product/${productId}`}>
      <ProductDetailContent 
        slug={slug} 
        productId={productId} 
        isModal 
        hasPaymentGateway={entitlements?.hasPaymentGateway}
        isPaymentConfigured={entitlements?.isPaymentConfigured}
        culqiPublicKey={entitlements?.culqiPublicKey}
      />
    </ProductModal>
  );
}
