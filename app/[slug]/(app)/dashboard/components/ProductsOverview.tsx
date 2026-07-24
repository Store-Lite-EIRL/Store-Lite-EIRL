import { getBusinessPath } from '@/shared/utils/url';
import Link from 'next/link';
import styles from './ProductsOverview.module.css';

interface ProductItem {
  id: string;
  title: string;
  price: string;
  currency: string;
  isAvailable: boolean;
  stock: number;
  saleStatus: 'MAS_VENDIDO' | 'NUEVO_PRODUCTO' | 'NORMAL';
  likes: number;
  categoryName: string | null;
}

interface ProductsOverviewProps {
  products: ProductItem[];
  slug: string;
}

const SALE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  MAS_VENDIDO: { label: 'Más Vendido', className: 'badgeBestSeller' },
  NUEVO_PRODUCTO: { label: 'Nuevo', className: 'badgeNew' },
  NORMAL: { label: '', className: '' },
};

export function ProductsOverview({ products, slug }: ProductsOverviewProps) {
  if (products.length === 0) {
    return (
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Últimos productos</h2>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📦</span>
          <p className={styles.emptyText}>Aún no tenés productos cargados.</p>
          <Link href={getBusinessPath(slug, '/storage')} className={styles.emptyLink}>
            Agregar primer producto →
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Últimos productos</h2>
        <Link href={getBusinessPath(slug, '/storage')} className={styles.viewAll}>
          Ver todos
        </Link>
      </div>

      <ul className={styles.list} role="list">
        {products.map((product) => {
          const statusInfo = SALE_STATUS_LABELS[product.saleStatus];
          const formattedPrice = new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: product.currency,
            minimumFractionDigits: 2,
          }).format(Number(product.price));

          return (
            <li key={product.id} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{product.title}</span>
                  {product.categoryName && (
                    <span className={styles.itemCategory}>{product.categoryName}</span>
                  )}
                </div>

                <div className={styles.itemRight}>
                  <span className={styles.itemPrice}>{formattedPrice}</span>
                  <div className={styles.itemBadges}>
                    {statusInfo.label && (
                      <span
                        className={`${styles.badge} ${styles[statusInfo.className as keyof typeof styles]}`}
                      >
                        {statusInfo.label}
                      </span>
                    )}
                    {product.stock === 0 ? (
                      <span className={`${styles.badge} ${styles.badgeOutOfStock} text-red-500`}>
                        AGOTADO
                      </span>
                    ) : !product.isAvailable ? (
                      <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>Sin stock</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeAvailable}`}>Disponible</span>
                    )}
                  </div>
                </div>
              </div>

              {product.likes > 0 && (
                <div className={styles.likes}>
                  <span role="img" aria-label="likes">
                    ❤️
                  </span>
                  <span>{product.likes}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
