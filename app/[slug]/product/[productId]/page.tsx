import ProductDetailContent from './components/ProductDetailContent';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  return <ProductDetailContent slug={slug} productId={productId} />;
}
