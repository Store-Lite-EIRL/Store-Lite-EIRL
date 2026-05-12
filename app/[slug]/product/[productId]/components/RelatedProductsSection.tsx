'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';
import { useCart } from '../../../storage/context/CartContext';
import { formatPrice } from '../../../storage/utils/currency';
import { useProductLike } from '../../hooks/useProductLike';
import { toCartProduct } from '../../utils/cartHelpers';
import styles from './RelatedProductsSection.module.css';

interface RelatedProductItem {
  id: string;
  title: string;
  price: string;
  currency: string;
  secondPrice: string | null;
  stock: number;
  image: string;
  images: string[];
  description: string;
  categoryName: string;
  likesCount: number;
  hasLiked: boolean;
}

interface RelatedProductsSectionProps {
  slug: string;
  products: RelatedProductItem[];
}

function RelatedProductCard({ product, slug }: { product: RelatedProductItem; slug: string }) {
  const { isInCart, toggleCartItem } = useCart();
  const {
    likesCount,
    hasLiked,
    isToggling: isTogglingLike,
    toggleLike,
  } = useProductLike({
    productId: product.id,
    businessSlug: slug,
    initialLikesCount: product.likesCount,
    initialHasLiked: product.hasLiked,
  });

  const inCart = isInCart(product.id);
  const currency = product.currency === 'PEN' ? 'S/' : product.currency;

  const handleToggleCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCartItem(
        toCartProduct({
          id: product.id,
          name: product.title,
          category: product.categoryName,
          stock: product.stock,
          price: product.price,
          currency: product.currency,
          image: product.image,
          images: product.images,
          description: product.description,
        }),
      );
    },
    [product, toggleCartItem],
  );

  const handleToggleLike = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleLike();
    },
    [toggleLike],
  );

  const finalPrice = product.secondPrice
    ? formatPrice(Number(product.secondPrice), currency)
    : formatPrice(Number(product.price), currency);

  const originalPrice = product.secondPrice ? formatPrice(Number(product.price), currency) : null;

  const productLink = `/${slug}/product/${product.id}`;

  return (
    <Link href={productLink} className={styles.card}>
      <div className={styles.cardMedia}>
        {product.stock === 0 && <span className={styles.outOfStockBadge}>SIN STOCK</span>}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            className={styles.cardImage}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className={styles.cardNoImage}>
            <Icon size={32}>image</Icon>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <p className={styles.cardTitle}>{product.title}</p>
        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{finalPrice}</span>
          {originalPrice && <span className={styles.cardOriginalPrice}>{originalPrice}</span>}
          {product.stock === 0 && <span className={styles.outOfStockPriceLabel}>(agotado)</span>}
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.cartBtn}`}
          onClick={handleToggleCart}
          disabled={product.stock === 0}
          aria-label={
            product.stock === 0 ? 'Sin stock' : inCart ? 'Quitar del carrito' : 'Agregar al carrito'
          }
        >
          <Icon size={18}>{inCart ? 'remove_shopping_cart' : 'add_shopping_cart'}</Icon>
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.likeBtn}`}
          onClick={handleToggleLike}
          disabled={isTogglingLike}
          aria-label={hasLiked ? 'Quitar like' : 'Dar like'}
        >
          <Icon size={18} className={hasLiked ? styles.likeActive : styles.likeInactive}>
            {isTogglingLike ? 'hourglass_empty' : hasLiked ? 'favorite' : 'favorite_border'}
          </Icon>
          <span className={styles.likeCount}>{likesCount}</span>
        </button>
      </div>
    </Link>
  );
}

export default function RelatedProductsSection({ slug, products }: RelatedProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Productos Relacionados</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <RelatedProductCard key={product.id} product={product} slug={slug} />
        ))}
      </div>
    </section>
  );
}
