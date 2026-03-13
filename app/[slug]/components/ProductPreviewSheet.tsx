'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { Button, Sheet } from '@/shared/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '../storage/context/CartContext';
import styles from './ProductPreviewSheet.module.css';

interface ProductPreviewSheetProps {
  slug: string;
  product: ProductWithRelations | null;
  openSignal: number;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
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
}: ProductPreviewSheetProps) {
  const { isInCart, toggleCartItem } = useCart();

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
  }, [product, openSignal]);

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
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.title}
              width={360}
              height={360}
              className={styles.image}
              priority
            />
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
                <p className={styles.originalPrice}>
                  {currency} {Number(product.price).toLocaleString()}
                </p>
                <p className={styles.price}>
                  {currency} {Number(product.secondPrice).toLocaleString()}
                </p>
              </>
            ) : (
              <p className={styles.price}>
                {currency} {Number(product.price).toLocaleString()}
              </p>
            )}
          </div>
          <p className={styles.description}>
            {product.description || 'Sin descripcion disponible para este producto.'}
          </p>
          <div className={styles.meta}>
            <span className={`${styles.chip} ${styles.stockChip}`}>
              Stock: <strong>{product.stock}</strong>
            </span>
            <span
              className={`${styles.chip} ${
                product.isAvailable ? styles.availableChip : styles.unavailableChip
              }`}
            >
              {product.isAvailable ? 'Disponible' : 'No disponible'}
            </span>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className={styles.tags}>
              {product.tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.shippingInfo && (
            <div className={styles.shippingInfo}>
              <strong>Envío:</strong> {product.shippingInfo}
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
                        ? 'var(--md-sys-color-error-container)'
                        : 'var(--md-sys-color-primary)',
                      '--md-filled-button-label-text-color': isProductInCart
                        ? 'var(--md-sys-color-on-error-container)'
                        : 'var(--md-sys-color-on-primary)',
                    } as React.CSSProperties
                  }
                >
                  {isProductInCart ? 'Quitar del carrito' : 'Agregar al carrito'}
                </Button>
                <Link href={`/${slug}/product/${product.id}`} className={styles.fullLink}>
                  Ver detalle completo
                </Link>
              </>
            )}
          </div>
          <p className={styles.hint}>
            Puedes revisar fotos y datos completos en la ficha del producto.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
