import ProductModal from '../../../components/ProductModal';
import ProductDetailContent from '../../../product/[productId]/components/ProductDetailContent';

export default async function ProductInterceptPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  return (
    <ProductModal fullPageHref={`/${slug}/product/${productId}`}>
      <ProductDetailContent slug={slug} productId={productId} isModal />
    </ProductModal>
  );
}
