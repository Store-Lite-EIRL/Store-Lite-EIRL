'use client';

import { useProductItemController } from '@/features/products/hooks/useProductItemController';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { ProductItemView } from './ProductItemView';

interface ProductItemProps {
  product: ProductWithRelations;
  isOwner?: boolean;
  onPreviewOpen?: (index: number) => void;
  hasPaymentGateway?: boolean;
  culqiPublicKey?: string;
  onContactClick?: () => void;
  // Props del negocio para el checkout
  businessName?: string;
  businessRuc?: string;
  businessAddress?: string;
  businessId?: string;
  businessLogoUrl?: string;
}

export default function ProductItem({
  product,
  isOwner = false,
  onPreviewOpen,
  hasPaymentGateway = true,
  culqiPublicKey,
  onContactClick,
  businessName,
  businessRuc,
  businessAddress,
  businessId,
  businessLogoUrl,
}: ProductItemProps) {
  const controller = useProductItemController(product, isOwner, hasPaymentGateway, onContactClick);

  return (
    <ProductItemView
      product={{
        // ... (rest is same)
        id: product.id,
        title: product.title,
        stock: product.stock,
        isAvailable: product.isAvailable,
        brand: product.brand,
        tags: product.tags,
        shippingInfo: product.shippingInfo,
        saleStatus: product.saleStatus,
        secondPrice: product.secondPrice ? String(product.secondPrice) : null,
        stars: product.stars,
      }}
      isOwner={isOwner}
      isSaving={controller.isSaving}
      isToggling={controller.isToggling}
      isEditOpen={controller.isEditOpen}
      isDeleteOpen={controller.isDeleteOpen}
      currentImgIndex={controller.currentImgIndex}
      allImages={controller.allImages}
      mainImage={controller.mainImage}
      categoryName={controller.categoryName}
      currencySymbol={controller.currencySymbol}
      originalPrice={controller.originalPrice}
      discount={controller.discount}
      price={controller.price}
      storageProduct={controller.storageProduct}
      alert={controller.alert}
      onEditOpen={() => controller.setIsEditOpen(true)}
      onDeleteOpen={() => controller.setIsDeleteOpen(true)}
      onDeleteClose={() => controller.setIsDeleteOpen(false)}
      onEditClose={() => controller.setIsEditOpen(false)}
      onConfirmDelete={controller.handleConfirmDelete}
      onSaveProduct={controller.handleSaveProduct}
      onToggleStatus={controller.handleToggleStatus}
      onImageIndexChange={controller.setCurrentImgIndex}
      onSavingChange={controller.setIsSaving}
      onAlertClose={() => controller.setAlert((prev) => ({ ...prev, open: false }))}
      onAddToCart={controller.handleAddToCart}
      isProductInCart={controller.isProductInCart}
      onOpenPreview={(index) => onPreviewOpen?.(index)}
      onLike={controller.handleLike}
      isLiking={controller.isLiking}
      isPaymentModalOpen={controller.isPaymentModalOpen}
      onPaymentModalClose={controller.handlePaymentModalClose}
      onBuyNow={controller.handleBuyNow}
      hasPaymentGateway={hasPaymentGateway}
      culqiPublicKey={culqiPublicKey}
      businessName={businessName}
      businessRuc={businessRuc}
      businessAddress={businessAddress}
      businessId={businessId}
      businessLogoUrl={businessLogoUrl}
    />
  );
}
