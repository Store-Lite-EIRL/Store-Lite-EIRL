'use client';

import { AlertSnackbar, Icon } from '@/shared/components/ui';
import { Button, IconButton } from '@/shared/components/ui/buttons';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import Checkout from '../../../[slug]/components/Checkout';
import { DeleteProductDialog } from '../../../[slug]/storage/components/DeleteProductDialog';
import { CreateProductSheet } from '../../../[slug]/storage/components/createProduct/CreateProductSheet';
import type { Product } from '../../../[slug]/storage/data';
import styles from './ProductItem.module.css';

export interface ProductViewData {
  id: string;
  title: string;
  stock: number;
  isAvailable: boolean;
  brand?: string | null;
  tags?: string[] | null;
  shippingInfo?: string | null;
  saleStatus?: string | null;
  secondPrice?: string | null;
  stars?: number | null;
}

interface ProductItemViewProps {
  product: ProductViewData;
  isOwner: boolean;
  isSaving: boolean;
  isToggling: boolean;
  isEditOpen: boolean;
  isDeleteOpen: boolean;
  isProductInCart: boolean;
  currentImgIndex: number;
  allImages: string[];
  mainImage: string | null;
  categoryName: string | null;
  currencySymbol: string;
  originalPrice: number | null;
  discount: number | null;
  price: number;
  storageProduct: Product;
  alert: {
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  };
  onEditOpen: () => void;
  onDeleteOpen: () => void;
  onDeleteClose: () => void;
  onEditClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
  onSaveProduct: (
    optimisticProduct: Product,
    payload: unknown,
    media: unknown[],
    isEdit: boolean,
  ) => Promise<void>;
  onToggleStatus: () => void;
  onImageIndexChange: (index: number) => void;
  onSavingChange: (isSaving: boolean) => void;
  onAlertClose: () => void;
  onAddToCart: () => void;
  onOpenPreview?: (index: number) => void;
  onLike: () => void;
  isLiking: boolean;
  isPaymentModalOpen: boolean;
  onPaymentModalClose: () => void;
  onBuyNow: () => void;
  hasPaymentGateway?: boolean;
}

export function ProductItemView({
  product,
  isOwner,
  isSaving,
  isToggling,
  isEditOpen,
  isDeleteOpen,
  isProductInCart,
  currentImgIndex,
  allImages,
  mainImage,
  categoryName,
  currencySymbol,
  originalPrice,
  discount,
  price,
  storageProduct,
  alert,
  onEditOpen,
  onDeleteOpen,
  onDeleteClose,
  onEditClose,
  onConfirmDelete,
  onSaveProduct,
  onToggleStatus,
  onImageIndexChange,
  onSavingChange,
  onAlertClose,
  onAddToCart,
  onOpenPreview,
  onLike,
  isLiking,
  isPaymentModalOpen,
  onPaymentModalClose,
  onBuyNow,
  hasPaymentGateway = true,
}: ProductItemViewProps) {
  const [copied, setCopied] = useState(false);
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slugPart = slug ? `/${slug}` : '';
  const productUrl = `${slugPart}/product/${product.id}`;
  const shouldUsePreview = Boolean(onOpenPreview);

  const productFeatures = product.tags || [];

  const statusText = product.isAvailable ? 'Activo' : 'Inactivo';
  const statusButtonContent = isToggling ? '...' : statusText;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${productUrl}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  };

  const handleOpenPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenPreview?.(currentImgIndex);
  };

  const renderImageSection = () => {
    return (
      <div className={styles.imageContainer} data-purpose="image-container">
        {/* Visual Content (Lowest Z-Index) */}
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.title}
            width={240}
            height={240}
            className={`${styles.image} ${isSaving ? styles.imageUpdating : ''}`}
            sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <span className={styles.noImage}>
            <Icon>image_not_supported</Icon>
          </span>
        )}

        {/* Clickable Overlay Wrapper (Link or Button, fills container, mid Z-Index) */}
        {shouldUsePreview ? (
          <button
            type="button"
            className={styles.clickableOverlay}
            onClick={handleOpenPreview}
            aria-label="Ver vista previa"
          />
        ) : (
          <Link href={productUrl} className={styles.clickableOverlay} aria-label="Ver producto" />
        )}

        {/* Labels & Badges (Above Overlay) */}
        <div className={styles.topBadges}>
          {product.saleStatus === 'MAS_VENDIDO' && (
            <span className={styles.topSellerBadge}>MÁS VENDIDO</span>
          )}
          {product.saleStatus === 'NUEVO_PRODUCTO' && (
            <span className={styles.newArrivalBadge}>NUEVO PRODUCTO</span>
          )}
        </div>

        {/* Top Right Actions (Above Overlay) */}
        {!isOwner && (
          <div className={styles.imageActions}>
            <IconButton
              variant="filled"
              aria-label="Dar like"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike();
              }}
              disabled={isLiking}
              style={
                {
                  '--md-icon-button-container-color': 'rgba(255, 255, 255, 0.9)',
                  '--md-icon-button-icon-color': 'var(--md-sys-color-primary)',
                } as React.CSSProperties
              }
            >
              <Icon size={24}>{isLiking ? 'hourglass_empty' : 'star'}</Icon>
            </IconButton>
          </div>
        )}

        {isOwner && (
          <div className={styles.imageActions}>
            <IconButton
              variant="standard"
              className={`${styles.wishlistBtn} ${styles.editBtn}`}
              aria-label="Editar producto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditOpen();
              }}
              disabled={isSaving}
            >
              <Icon>edit</Icon>
            </IconButton>
            <IconButton
              variant="standard"
              className={`${styles.wishlistBtn} ${styles.deleteBtn}`}
              aria-label="Eliminar producto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteOpen();
              }}
              disabled={isSaving}
            >
              <Icon>delete</Icon>
            </IconButton>
          </div>
        )}

        {/* Navigation Zones (Above Overlay, Below Actions) */}
        {allImages.length > 1 && (
          <div className={styles.carouselNavOverlay}>
            <div
              className={styles.navZone}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = (currentImgIndex - 1 + allImages.length) % allImages.length;
                onImageIndexChange(nextIdx);
              }}
              aria-label="Imagen anterior"
            />
            <div
              className={styles.navZone}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = (currentImgIndex + 1) % allImages.length;
                onImageIndexChange(nextIdx);
              }}
              aria-label="Siguiente imagen"
            />
          </div>
        )}

        {/* Segmented Progress (At the Top) */}
        {allImages.length > 1 && (
          <div className={styles.segmentedProgress}>
            {allImages.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.segment} ${idx === currentImgIndex ? styles.segmentActive : ''}`}
              />
            ))}
          </div>
        )}

        {/* Progress Overlay (Highest Z-Index) */}
        {isSaving && (
          <div className={styles.loaderOverlay}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    );
  };

  const renderFooterActions = () => {
    if (isOwner) {
      return (
        <Button
          className={styles.statusBtn}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
          disabled={isToggling}
          style={
            {
              '--md-filled-button-container-color': product.isAvailable
                ? 'var(--md-sys-color-tertiary)'
                : 'var(--md-sys-color-error)',
            } as React.CSSProperties
          }
        >
          {statusButtonContent}
        </Button>
      );
    }

    return (
      <>
        <Button
          className={styles.buyBtn}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation();
            onBuyNow();
          }}
          style={
            {
              '--md-filled-button-container-color': 'var(--md-sys-color-tertiary)',
            } as React.CSSProperties
          }
        >
          {hasPaymentGateway ? 'Comprar' : 'Contactar'}
        </Button>
        <Button
          className={styles.cartBtn}
          variant="filled"
          aria-label={isProductInCart ? 'Quitar del carrito' : 'Agregar al carrito'}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          style={
            {
              '--md-filled-button-container-color': isProductInCart
                ? 'var(--md-sys-color-secondary-container)'
                : 'var(--md-sys-color-primary)',
              '--md-filled-button-label-text-color': isProductInCart
                ? 'var(--md-sys-color-on-secondary-container)'
                : 'var(--md-sys-color-on-primary)',
            } as React.CSSProperties
          }
        >
          <Icon>{isProductInCart ? 'remove_shopping_cart' : 'shopping_cart'}</Icon>
        </Button>
        <button
          type="button"
          className={styles.shareBtn}
          title="Copiar enlace"
          onClick={handleShare}
        >
          <Icon suppressHydrationWarning>{copied ? 'check' : 'share'}</Icon>
        </button>
      </>
    );
  };

  return (
    <article className={styles.card} data-purpose="product-card" suppressHydrationWarning>
      <div className={styles.imageLink}>{renderImageSection()}</div>

      <div className={styles.info} onClick={handleOpenPreview}>
        <div className={styles.headerRow}>
          <span className={styles.category}>
            {product.brand ? `${product.brand.toUpperCase()} | ` : ''}
            {categoryName || 'GENERAL'}
          </span>
          <div className={styles.divider} />
          <div className={styles.rating}>
            <Icon size={21}>star</Icon>
            <span>{product.stars || 0}</span>
          </div>
        </div>

        <h2 className={styles.title} data-purpose="product-title">
          {product.title}
        </h2>

        <div className={styles.features}>
          {productFeatures.map((f, i) => (
            <React.Fragment key={`${f}-${i}`}>
              <span>{f}</span>
              {i < productFeatures.length - 1 && <div className={styles.featureDot} />}
            </React.Fragment>
          ))}
        </div>

        <div className={styles.stockInfo}>
          <div className={styles.stockDot} />
          <span>{product.isAvailable ? 'En Stock' : 'Agotado'}</span>
        </div>

        {product.shippingInfo && (
          <div className={styles.shippingInfo}>
            <Icon>local_shipping</Icon>
            <span>{product.shippingInfo}</span>
          </div>
        )}
      </div>

      <div className={styles.pricingFooter}>
        <div className={styles.priceContainer} onClick={handleOpenPreview}>
          <div className={styles.priceWrapper}>
            {originalPrice && (
              <div
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}
              >
                <span className={styles.originalPrice}>
                  {currencySymbol}
                  {originalPrice.toLocaleString()}
                </span>
                {discount && <span className={styles.discountBadge}>-{discount}%</span>}
              </div>
            )}
            <span className={styles.currentPrice}>
              {currencySymbol}&nbsp;{price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.actionsRow}>{renderFooterActions()}</div>
      </div>

      {isOwner && (
        <>
          <DeleteProductDialog
            open={isDeleteOpen}
            product={storageProduct}
            onClose={onDeleteClose}
            onConfirm={onConfirmDelete}
          />
          <CreateProductSheet
            open={isEditOpen}
            onClose={onEditClose}
            onSave={onSaveProduct}
            initialProduct={storageProduct}
            onSavingChange={onSavingChange}
          />
        </>
      )}
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={onAlertClose}
      />
      {!isOwner && isPaymentModalOpen && (
        <Checkout
          totalAmount={price}
          cartItems={[{ ...storageProduct, quantity: 1 }]}
          onSuccess={() => onPaymentModalClose()}
          onCancel={() => onPaymentModalClose()}
        />
      )}
    </article>
  );
}
