'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { Button, Sheet } from '@/shared/components/ui';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toCartProduct } from '../product/utils/cartHelpers';
import { useCart } from '../storage/context/CartContext';
import { formatPrice } from '../storage/utils/currency';
import Checkout from './Checkout';
import styles from './ProductPreviewSheet.module.css';

interface ProductPreviewSheetProps {
  slug: string;
  product: ProductWithRelations | null;
  openSignal: number;
  isOwner?: boolean;
  hasPaymentGateway?: boolean;
  culqiPublicKey?: string;
  businessId?: string;
  businessName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessLogoUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  initialImageIndex?: number;
}

type SheetElement = HTMLDivElement & { show?: () => void; close?: () => void };

const SHEET_ID = 'product-preview-sheet';

export default function ProductPreviewSheet({
  slug,
  product,
  openSignal,
  isOwner = false,
  hasPaymentGateway = true,
  culqiPublicKey,
  businessId,
  businessName,
  businessAddress,
  businessCity,
  businessLogoUrl,
  onEdit,
  onDelete,
  initialImageIndex = 0,
}: ProductPreviewSheetProps) {
  const { isInCart, toggleCartItem } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleAction = (action?: () => void) => {
    if (!action) return;
    const node = document.getElementById(SHEET_ID) as SheetElement | null;
    node?.close?.();
    action();
  };

  useEffect(() => {
    if (!product) return;
    const node = document.getElementById(SHEET_ID) as SheetElement | null;
    node?.show?.();
    // Clamp el índice para que nunca quede out of bounds
    const maxIndex = Math.max(0, (product.media?.length ?? 1) - 1);
    const safeIndex = Math.min(initialImageIndex, maxIndex);
    setCurrentImageIndex(safeIndex);
    setIsPaymentModalOpen(false);
  }, [product, openSignal, initialImageIndex]);

  if (!product) {
    return <Sheet id={SHEET_ID} title="Vista previa" direction="bottom" className={styles.sheet} />;
  }

  const mainImage = product.media?.[0]?.mediaUrl || '';
  const category = product.category?.name || 'Producto';
  const currency = product.currency === 'PEN' ? 'S/' : product.currency;
  const isProductInCart = isInCart(product.id);

  // Consideramos pagos habilitados solo si el plan lo permite Y las llaves están configuradas
  const paymentsEnabled = hasPaymentGateway && !!culqiPublicKey && !!businessId;

  return (
    <>
      <Sheet
        id={SHEET_ID}
        title="Vista previa del producto"
        direction="bottom"
        className={styles.sheet}
      >
        <div className={styles.content}>
          <div className={styles.media}>
            {product.media && product.media.length > 0 ? (
              <>
                <div className={styles.carouselContainer}>
                  <button
                    className={styles.carouselButton}
                    title="Imagen anterior"
                    onClick={() =>
                      setCurrentImageIndex(
                        (prev: number) =>
                          (prev - 1 + product.media!.length) % product.media!.length,
                      )
                    }
                    disabled={product.media.length <= 1}
                  >
                    <Icon size={24}>chevron_left</Icon>
                  </button>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={
                        product.media[currentImageIndex]?.mediaUrl ??
                        product.media[0]?.mediaUrl ??
                        ''
                      }
                      alt={product.title}
                      fill
                      className={styles.image}
                      sizes="(max-width: 900px) 100vw, 400px"
                      priority
                    />
                  </div>
                  <button
                    className={styles.carouselButton}
                    title="Siguiente imagen"
                    onClick={() =>
                      setCurrentImageIndex((prev: number) => (prev + 1) % product.media!.length)
                    }
                    disabled={product.media.length <= 1}
                  >
                    <Icon size={24}>chevron_right</Icon>
                  </button>
                  {product.media.length > 1 && (
                    <div className={styles.dots}>
                      {product.media.map((_, i) => (
                        <div
                          key={i}
                          className={`${styles.dot} ${
                            i === currentImageIndex ? styles.activeDot : ''
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {businessName && (
                  <div className={styles.storeBadge}>
                    {businessLogoUrl ? (
                      <img src={businessLogoUrl} alt={businessName} className={styles.storeLogo} />
                    ) : (
                      <Icon size={18}>store</Icon>
                    )}
                    <span>{businessName}</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noImage}>Sin imagen</div>
            )}
          </div>

          <div className={styles.details}>
            <p className={styles.category}>
              {product.brand ? `${product.brand.toUpperCase()} | ` : ''}
              {category}
            </p>
            <h3 className={styles.title}>{product.title}</h3>

            <div className={styles.priceContainer}>
              {product.secondPrice ? (
                <>
                  <p className={styles.price}>
                    {formatPrice(Number(product.secondPrice), currency)}
                  </p>
                  <p className={styles.originalPrice}>
                    {formatPrice(Number(product.price), currency)}
                  </p>
                </>
              ) : (
                <p className={styles.price}>{formatPrice(Number(product.price), currency)}</p>
              )}
            </div>
            <div className={styles.descriptionContainer}>
              <p className={styles.description}>
                {product.description && product.description.length > 120
                  ? `${product.description.slice(0, 120)}...`
                  : product.description || 'Sin descripción disponible.'}
              </p>
              {product.description && product.description.length > 120 && (
                <Link href={`/${slug}/product/${product.id}`} className={styles.inlineLink}>
                  Ver detalle completo
                </Link>
              )}
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className={styles.tags}>
                {product.tags.map((tag, i) => (
                  <span key={i} className={styles.tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.metaRow}>
              <span className={styles.priceTag}>
                {formatPrice(Number(product.secondPrice || product.price), currency)}
              </span>
              <div className={styles.statusBundle}>
                <span
                  className={`${styles.statusChip} ${
                    product.stock > 0 ? styles.available : styles.unavailable
                  }`}
                >
                  {product.stock > 0 ? 'Disponible' : 'Sin Stock'}
                </span>
                {product.stock === 0 ? (
                  <span className={styles.stockLabel}> (AGOTADO) </span>
                ) : (
                  <span className={styles.stockLabel}> ({product.stock} disp.) </span>
                )}
              </div>
            </div>

            {product.shippingInfo && (
              <div className={styles.shippingCard}>
                <div className={styles.shippingHeader}>
                  <Icon size={18}>local_shipping</Icon>
                  <span className={styles.shippingLabel}>Envío</span>
                </div>
                <p className={styles.shippingText}>{product.shippingInfo}</p>
              </div>
            )}

            <div className={styles.actions}>
              {isOwner ? (
                <>
                  <Button
                    onClick={() => handleAction(onEdit)}
                    variant="filled"
                    style={
                      {
                        '--md-filled-button-container-color': 'var(--md-sys-color-primary)',
                      } as React.CSSProperties
                    }
                  >
                    Editar Producto
                  </Button>
                  <Button
                    onClick={() => handleAction(onDelete)}
                    variant="outlined"
                    style={
                      {
                        '--md-outlined-button-outline-color': 'var(--md-sys-color-error)',
                        '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)',
                      } as React.CSSProperties
                    }
                  >
                    Eliminar Producto
                  </Button>
                </>
              ) : (
                <>
                  <div className={styles.actionsRow}>
                    {product.stock > 0 ? (
                      <>
                        <Button
                          onClick={() =>
                            toggleCartItem(
                              toCartProduct({
                                id: product.id,
                                name: product.title,
                                category,
                                stock: product.stock,
                                price: String(product.price),
                                currency: product.currency,
                                status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
                                image: mainImage,
                                images: product.media?.map((item) => item.mediaUrl) || [],
                                description: product.description || '',
                              }),
                            )
                          }
                          aria-label={isProductInCart ? 'Quitar del carrito' : 'Agregar al carrito'}
                          style={
                            {
                              '--md-filled-button-container-color': isProductInCart
                                ? 'var(--md-sys-color-secondary-container)'
                                : 'var(--md-sys-color-surface-container-highest)',
                              '--md-filled-button-label-text-color': isProductInCart
                                ? 'var(--md-sys-color-on-secondary-container)'
                                : 'var(--md-sys-color-on-surface-variant)',
                            } as React.CSSProperties
                          }
                        >
                          <Icon>
                            {isProductInCart ? 'remove_shopping_cart' : 'add_shopping_cart'}
                          </Icon>
                        </Button>

                        {paymentsEnabled && (
                          <Button
                            variant="filled"
                            onClick={() => setIsPaymentModalOpen(true)}
                            style={
                              {
                                flex: 1,
                                '--md-filled-button-container-color': 'var(--md-sys-color-primary)',
                              } as React.CSSProperties
                            }
                          >
                            Comprar ahora
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        disabled
                        aria-label="Sin stock"
                        style={
                          {
                            flex: 1,
                            '--md-filled-button-container-color':
                              'var(--md-sys-color-surface-variant)',
                            '--md-filled-button-label-text-color':
                              'var(--md-sys-color-on-surface-variant)',
                          } as React.CSSProperties
                        }
                      >
                        Agotado
                      </Button>
                    )}
                    <Link href={`/${slug}/product/${product.id}`} className={styles.fullLink}>
                      {paymentsEnabled ? 'Ver más' : 'Ver más'}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Sheet>

      {isPaymentModalOpen && product && businessId && (
        <Checkout
          totalAmount={Number(product.secondPrice || product.price)}
          cartItems={[
            {
              id: product.id,
              name: product.title,
              price: String(product.price),
              secondPrice: product.secondPrice ? String(product.secondPrice) : null,
              currency: product.currency,
              image: mainImage,
              quantity: 1,
              category: category,
              stock: product.stock,
              status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
              description: product.description || '',
            },
          ]}
          culqiPublicKey={culqiPublicKey}
          onSuccess={() => setIsPaymentModalOpen(false)}
          onCancel={() => setIsPaymentModalOpen(false)}
          businessId={businessId}
          businessName={businessName}
          businessAddress={businessAddress}
          businessCity={businessCity}
          businessLogoUrl={businessLogoUrl}
        />
      )}
    </>
  );
}
