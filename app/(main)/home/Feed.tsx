'use client';

import type { ProductGridConfig } from '@/core/storefront';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import type { CSSProperties } from 'react';
import styles from './Feed.module.css';
import ProductItem from './components/ProductItem';

interface FeedProps {
  products?: ProductWithRelations[];
  isOwner?: boolean;
  onProductPreview?: (product: ProductWithRelations, initialIndex?: number) => void;
  hasPaymentGateway?: boolean;
  isPaymentConfigured?: boolean;
  culqiPublicKey?: string;
  onContactClick?: () => void;
  gridConfig?: ProductGridConfig;
  // Props del negocio para el checkout
  businessName?: string;
  businessRuc?: string;
  businessAddress?: string;
  businessId?: string;
  businessLogoUrl?: string;
}

function mapGapTokenToCss(gap: ProductGridConfig['gap']['mobile']): string {
  switch (gap) {
    case 'sm':
      return '0.75rem';
    case 'md':
      return '1rem';
    case 'lg':
      return '1.5rem';
    case 'xl':
      return '2rem';
    default:
      return '1rem';
  }
}

export default function Feed({
  products = [],
  isOwner = false,
  onProductPreview,
  hasPaymentGateway = false,
  isPaymentConfigured = false,
  culqiPublicKey,
  onContactClick,
  gridConfig,
  businessName,
  businessRuc,
  businessAddress,
  businessId,
  businessLogoUrl,
}: FeedProps) {
  // Pagos habilitados solo si el plan lo permite Y las credenciales están configuradas
  const paymentsEnabled = hasPaymentGateway && isPaymentConfigured && !!businessId;
  const gridStyle = gridConfig
    ? ({
        '--storefront-grid-columns-mobile': String(gridConfig.columns.mobile),
        '--storefront-grid-columns-tablet': String(gridConfig.columns.tablet),
        '--storefront-grid-columns-desktop': String(gridConfig.columns.desktop),
        '--storefront-grid-gap-mobile': mapGapTokenToCss(gridConfig.gap.mobile),
        '--storefront-grid-gap-tablet': mapGapTokenToCss(gridConfig.gap.tablet),
        '--storefront-grid-gap-desktop': mapGapTokenToCss(gridConfig.gap.desktop),
      } as CSSProperties)
    : undefined;

  return (
    <div className={styles.feedContainer}>
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay productos que coincidan con los filtros aplicados</p>
        </div>
      ) : (
        <div className={styles.gridContainer} style={gridStyle}>
          {products.map((product) => (
            <div key={product.id} className={styles.gridItem}>
              <ProductItem
                product={product}
                isOwner={isOwner}
                onPreviewOpen={(idx) => onProductPreview?.(product, idx)}
                hasPaymentGateway={paymentsEnabled}
                culqiPublicKey={culqiPublicKey}
                onContactClick={onContactClick}
                businessName={businessName}
                businessRuc={businessRuc}
                businessAddress={businessAddress}
                businessId={businessId}
                businessLogoUrl={businessLogoUrl}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
