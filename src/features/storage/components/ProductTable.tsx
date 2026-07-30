'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { AlertSnackbar, Icon, IconButton } from '@/shared/components/ui';
import { getBusinessPath } from '@/shared/utils/url';
import ProductPreviewSheet from '@app/[slug]/(app)/components/ProductPreviewSheet';
import { usePermissions } from '@app/[slug]/(app)/context/PermissionsContext';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import type { Product } from '../data';
import type { SortConfig } from '../hooks/useStorageProducts';
import { formatPrice, parsePriceValue } from '../utils/currency';
import { EmptyState } from './product-table/EmptyState';
import { ProductActionsMenu } from './product-table/ProductActionsMenu';
import { TableHeader } from './product-table/TableHeader';

type MaterialMenuElement = HTMLElement & {
  open: boolean;
  anchorElement?: Element | null;
};

interface ProductTableProps {
  products: Product[];
  sortConfig: SortConfig | null;
  onSort: (key: keyof Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  visibleExtraColumns?: string[];
}

/** Convierte un Product del storage al formato ProductWithRelations que espera el PreviewSheet */
function toPreviewProduct(sp: Product): ProductWithRelations {
  const media: { mediaUrl: string; displayOrder: number }[] = [];
  if (sp.image) {
    media.push({ mediaUrl: sp.image, displayOrder: 0 });
  }
  if (sp.images) {
    sp.images.forEach((url, i) => {
      const exists = media.some((m) => m.mediaUrl === url);
      if (!exists) {
        media.push({ mediaUrl: url, displayOrder: media.length + i });
      }
    });
  }

  return {
    id: sp.id,
    title: sp.name,
    description: sp.description ?? null,
    price: sp.price,
    secondPrice: sp.secondPrice ?? null,
    stock: sp.stock,
    currency: sp.currency,
    isAvailable: sp.status === 'ACTIVO',
    brand: sp.brand ?? null,
    tags: sp.tags ?? null,
    shippingInfo: sp.shippingInfo ?? null,
    saleStatus: (sp.saleStatus ?? 'NORMAL') as 'MAS_VENDIDO' | 'NUEVO_PRODUCTO' | 'NORMAL',
    slug: sp.seoTitle ?? null,
    seoTitle: sp.seoTitle ?? null,
    seoDescription: sp.seoDescription ?? null,
    stars: 0,
    externalCode: null,
    displayOrder: 0,
    metadata: sp.metadata ?? null,
    businessId: '',
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: sp.category ? { id: '', name: sp.category, businessId: '' } : null,
    media,
  } as unknown as ProductWithRelations;
}

export const ProductTable = ({
  products,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  visibleExtraColumns = [],
}: ProductTableProps) => {
  const { symbol: currencySymbol } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const businessSlug = params.slug as string;

  const { can, isOwner } = usePermissions();
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const actionsMenuRef = useRef<MaterialMenuElement | null>(null);
  const [rawPreviewProduct, setRawPreviewProduct] = useState<Product | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);

  /** Producto mapeado para el PreviewSheet — se actualiza cuando cambia rawPreviewProduct */
  const previewProduct = useMemo(
    () => (rawPreviewProduct ? toPreviewProduct(rawPreviewProduct) : null),
    [rawPreviewProduct],
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    const menu = actionsMenuRef.current;
    if (menu) {
      setMenuProduct(product);
      menu.anchorElement = event.currentTarget;
      menu.open = true;
    }
  };

  const closeMenu = () => {
    const menu = actionsMenuRef.current;
    if (menu) menu.open = false;
  };

  const handleGoToProduct = () => {
    closeMenu();
    if (menuProduct) router.push(getBusinessPath(businessSlug, `/product/${menuProduct.id}`));
  };

  const handleShareProduct = () => {
    closeMenu();
    if (menuProduct) {
      const businessPath = getBusinessPath(businessSlug, `/product/${menuProduct.id}`);
      const url = window.location.origin + businessPath;
      navigator.clipboard
        .writeText(url)
        .then(() => setCopiedAlert(true))
        .catch(() => {
          console.error('Failed to copy to clipboard');
        });
    }
  };

  const handlePreviewEdit = () => {
    if (rawPreviewProduct) onEdit(rawPreviewProduct);
  };

  const handlePreviewDelete = () => {
    if (rawPreviewProduct) onDelete(rawPreviewProduct);
  };

  const handlePublicMetadataChange = (productId: string, publicKeys: string[]) => {
    setRawPreviewProduct((current) => {
      if (!current || current.id !== productId) return current;
      return {
        ...current,
        metadata: {
          ...(current.metadata ?? {}),
          _public: publicKeys,
        },
      };
    });
    router.refresh();
  };

  return (
    <>
      <div className="table-wrapper">
        <table className="storage-table">
          <thead>
            <tr>
              <TableHeader
                label="Producto"
                sortKey="name"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="Categoría"
                sortKey="category"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader label="Stock" sortKey="stock" sortConfig={sortConfig} onSort={onSort} />
              <TableHeader label="Precio" sortKey="price" sortConfig={sortConfig} onSort={onSort} />
              <TableHeader
                label="Estado"
                sortKey="status"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              {visibleExtraColumns.map((col) => (
                <th key={col} className="extra-col">
                  <span style={{ textTransform: 'capitalize' }}>{col}</span>
                  <span className="extra-col-chip">extra</span>
                </th>
              ))}
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + visibleExtraColumns.length}
                  style={{ textAlign: 'center', padding: 0 }}
                >
                  <EmptyState />
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div
                      className="product-info"
                      style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                      onClick={() => {
                        setRawPreviewProduct(product);
                        setPreviewSignal((prev) => prev + 1);
                      }}
                    >
                      <div className="product-img-container">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="product-img"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="product-img placeholder"
                          style={{
                            display: product.image ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--md-sys-color-surface-container-high)',
                            borderRadius: 8,
                            flexShrink: 0,
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          <Icon style={{ fontSize: 22, opacity: 0.4 }}>image_not_supported</Icon>
                        </div>
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="secondary-text">{product.category}</td>
                  <td className="secondary-text">
                    {product.stock === 0 ? (
                      <span className="text-red-500">AGOTADO</span>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        minHeight: '1.8rem',
                        paddingLeft: '3.2rem',
                        gap: 8,
                      }}
                    >
                      {product.secondPrice && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4,
                            lineHeight: '1.4',
                          }}
                        >
                          -
                          {Math.round(
                            ((parsePriceValue(product.price) -
                              parsePriceValue(product.secondPrice)) /
                              parsePriceValue(product.price)) *
                              100,
                          )}
                          %
                        </span>
                      )}
                      <strong style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                        {formatPrice(
                          parsePriceValue(product.secondPrice ?? product.price),
                          currencySymbol,
                        )}
                      </strong>
                      {product.secondPrice && (
                        <span
                          className="secondary-text"
                          style={{ textDecoration: 'line-through', fontSize: '0.8rem' }}
                        >
                          {formatPrice(parsePriceValue(product.price), currencySymbol)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-chip status-${product.status.toLowerCase().replace(' ', '-')}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  {visibleExtraColumns.map((col) => (
                    <td key={col} className="extra-col-value">
                      {product.metadata?.[col] !== undefined && product.metadata?.[col] !== null
                        ? String(product.metadata[col])
                        : '—'}
                    </td>
                  ))}
                  <td>
                    <div className="actions-cell">
                      {(isOwner || can('products.edit')) && (
                        <IconButton aria-label="Editar" onClick={() => onEdit(product)}>
                          <Icon style={{ fontSize: '18px' }}>edit</Icon>
                        </IconButton>
                      )}
                      {(isOwner || can('products.delete')) && (
                        <IconButton aria-label="Eliminar" onClick={() => onDelete(product)}>
                          <Icon style={{ fontSize: '18px' }}>delete</Icon>
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="Más opciones"
                        onClick={(e) => handleMenuClick(e, product)}
                      >
                        <Icon style={{ fontSize: '18px' }}>more_vert</Icon>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductActionsMenu
        id="product-actions-menu"
        menuRef={actionsMenuRef}
        onView={handleGoToProduct}
        onShare={handleShareProduct}
      />

      <ProductPreviewSheet
        slug={businessSlug}
        product={previewProduct}
        openSignal={previewSignal}
        isOwner={isOwner}
        hasPaymentGateway={true}
        culqiPublicKey={undefined}
        visibleExtraColumns={visibleExtraColumns}
        onPublicMetadataChange={handlePublicMetadataChange}
        onEdit={handlePreviewEdit}
        onDelete={handlePreviewDelete}
      />

      <AlertSnackbar
        open={copiedAlert}
        description="Enlace copiado al portapapeles"
        color="primary"
        icon="content_copy"
        onClose={() => setCopiedAlert(false)}
      />
    </>
  );
};
