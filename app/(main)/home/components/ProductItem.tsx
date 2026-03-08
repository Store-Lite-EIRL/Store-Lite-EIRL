'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { ProductItemView } from './ProductItemView';
import { useProductItemController } from './useProductItemController';

interface ProductItemProps {
  product: ProductWithRelations;
  isOwner?: boolean;
  onPreviewOpen?: () => void;
}

export default function ProductItem({ product, isOwner = false, onPreviewOpen }: ProductItemProps) {
  const controller = useProductItemController(product, isOwner);

  return (
    <ProductItemView
      product={{
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
      onOpenPreview={onPreviewOpen}
      onLike={controller.handleLike}
      isLiking={controller.isLiking}
      isPaymentModalOpen={controller.isPaymentModalOpen}
      onPaymentModalClose={controller.handlePaymentModalClose}
      onBuyNow={controller.handleBuyNow}
      businessSlug={controller.businessSlug}
    />
  );
}
