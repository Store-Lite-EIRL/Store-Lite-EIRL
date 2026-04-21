'use client';

import { AlertSnackbar, Icon, IconButton } from '@/shared/components/ui';
import ProductPreviewSheet from '@app/[slug]/components/ProductPreviewSheet';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { usePermissions } from '../../context/PermissionsContext';
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
}

export const ProductTable = ({
  products,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
}: ProductTableProps) => {
  const { symbol: currencySymbol } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const businessSlug = params.slug as string;

  const { can, isOwner } = usePermissions();
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const actionsMenuRef = useRef<MaterialMenuElement | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);

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
    if (menuProduct) router.push(`/${businessSlug}/product/${menuProduct.id}`);
  };

  const handleShareProduct = () => {
    closeMenu();
    if (menuProduct) {
      const url = `${window.location.origin}/${businessSlug}/product/${menuProduct.id}`;
      navigator.clipboard.writeText(url).then(() => setCopiedAlert(true));
    }
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
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 0 }}>
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
                        setPreviewProduct(product);
                        setPreviewSignal(prev => prev + 1);
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
                      <div className="mt-2 text-xs text-muted-foreground">
                        Ver vista previa
                      </div>
                    </div>
                  </td>
                  <td className="secondary-text">{product.category}</td>
                  <td className="secondary-text">{product.stock === 0 ? (
                    <span className="text-red-500">AGOTADO</span>
                  ) : product.stock}</td>
                  <td className="secondary-text">
                    {formatPrice(parsePriceValue(product.price), currencySymbol)}
                  </td>
                  <td>
                    <span
                      className={`status-chip status-${product.status.toLowerCase().replace(' ', '-')}`}
                    >
                      {product.status}
                    </span>
                  </td>
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
         culqiPublicKey={undefined} // Owners don't need to buy
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
