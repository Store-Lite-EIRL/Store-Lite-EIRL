'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import styles from './Feed.module.css';
import ProductItem from './components/ProductItem';

interface FeedProps {
  products?: ProductWithRelations[];
  isOwner?: boolean;
  onProductPreview?: (product: ProductWithRelations, initialIndex?: number) => void;
  hasPaymentGateway?: boolean;
  onContactClick?: () => void;
}

export default function Feed({ 
  products = [], 
  isOwner = false, 
  onProductPreview,
  hasPaymentGateway = true,
  onContactClick
}: FeedProps) {
  return (
    <div className={styles.feedContainer}>
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay productos que coincidan con los filtros aplicados</p>
        </div>
      ) : (
        <div className={styles.gridContainer}>
          {products.map((product) => (
            <div key={product.id} className={styles.gridItem}>
              <ProductItem
                product={product}
                isOwner={isOwner}
                onPreviewOpen={(idx) => onProductPreview?.(product, idx)}
                hasPaymentGateway={hasPaymentGateway}
                onContactClick={onContactClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
