'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { Button, Sheet } from '@/shared/components/ui';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '../storage/context/CartContext';
import { formatPrice } from '../storage/utils/currency';
import styles from './ProductPreviewSheet.module.css';

interface ProductPreviewSheetProps {
  slug: string;
  product: ProductWithRelations | null;
  openSignal: number;
  isOwner?: boolean;
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
  onEdit,
  onDelete,
  initialImageIndex = 0,
}: ProductPreviewSheetProps) {
  const { isInCart, toggleCartItem } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    setCurrentImageIndex(initialImageIndex);
  }, [product, openSignal, initialImageIndex]);

  if (!product) {
    return <Sheet id={SHEET_ID} title="Vista previa" direction="bottom" className={styles.sheet} />;
  }

  const mainImage = product.media?.[0]?.mediaUrl || '';
  const category = product.category?.name || 'Producto';
  const currency = product.currency === 'PEN' ? 'S/' : product.currency;
  const isProductInCart = isInCart(product.id);

  return (
    <Sheet
      id={SHEET_ID}
      title="Vista previa del producto"
      direction="bottom"
      className={styles.sheet}
    >
      <div className={styles.content}>
        <div className={styles.media}>
          {product.media && product.media.length > 0 ? (
            <div className={styles.carouselContainer}>
              <button
                className={styles.carouselButton}
                title="Imagen anterior"
                onClick={() =>
                  setCurrentImageIndex(
                    (prev: number) => (prev - 1 + product.media!.length) % product.media!.length,
                  )
                }
                disabled={product.media.length <= 1}
              >
                <Icon size={24}>chevron_left</Icon>
              </button>
              <div className={styles.imageWrapper}>
                <Image
                  src={product.media[currentImageIndex].mediaUrl}
                  alt={product.title}
                  width={400}
                  height={400}
                  className={styles.image}
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
                      className={`${styles.dot} ${i === currentImageIndex ? styles.activeDot : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
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
              <p className={styles.price}>
                {formatPrice(Number(product.price), currency)}
              </p>
            )}
          </div>
          <div className={styles.descriptionContainer}>
            <p className={styles.description}>
              {product.description && product.description.length > 120
                ? `${product.description.slice(0, 120)}...`
                : (product.description || 'Sin descripción disponible.')}
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
              <span className={`${styles.statusChip} ${product.stock > 0 ? styles.available : styles.unavailable}`}>
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
            <div className={styles.quickShipping}>
              <Icon size={18}>local_shipping</Icon>
              {product.shippingInfo}
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
                {product.stock > 0 ? (
                  <Button
                    onClick={() =>
                      toggleCartItem({
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
                      })
                    }
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
                    {isProductInCart ? 'Quitar del carrito' : 'Agregar al carrito'}
                  </Button>
                ) : (
                  <Button 
                    disabled
                    style={{
                      '--md-filled-button-container-color': 'var(--md-sys-color-surface-variant)',
                      '--md-filled-button-label-text-color': 'var(--md-sys-color-on-surface-variant)',
                    } as React.CSSProperties}
                  >
                    SIN STOCK
                  </Button>
                )}
                <Link href={`/${slug}/product/${product.id}`} className={styles.fullLink}>
                  Ver detalle completo
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
