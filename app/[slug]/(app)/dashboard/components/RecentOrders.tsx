'use client';

import type { OrderItem } from '@/lib/types/orderStatus';
import { DB_STATUS_FILTERS, URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Select, SelectOption } from '@/shared/components/ui/inputs/Select';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { getBusinessPath } from '@/shared/utils/url';
import { Eye, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import OrderModal from './OrderModal';
import styles from './RecentOrders.module.css';

interface RecentOrdersProps {
  orders: OrderItem[];
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
  currentDate: string;
  businessSlug: string;
}

export function RecentOrders({
  orders,
  totalPages,
  currentPage,
  currentStatus,
  currentSearch,
  currentDate,
  businessSlug,
}: RecentOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState(currentSearch);

  useEffect(() => {
    setLocalSearch(currentSearch);
  }, [currentSearch]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedOrder]);

  const updateFilters = (updates: Record<string, string | null>) => {
    setIsFilterLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!('page' in updates)) {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 500);
  };

  const handlePageChange = (newPage: number) => {
    setIsFilterLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 500);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const renderDots = (segmentProgress: number) => {
    const thresholds = [25, 50, 75, 100];
    return (
      <div className={styles.dotsWrapper} data-tooltip={`Progreso: ${segmentProgress}%`}>
        {thresholds.map((threshold, idx) => {
          const prevThreshold = idx === 0 ? 0 : thresholds[idx - 1];
          const isActive = segmentProgress >= threshold;
          const isGlowing = segmentProgress > prevThreshold && segmentProgress < threshold;
          return (
            <div
              key={idx}
              className={`${styles.dot} ${isActive ? styles.activeDot : ''} ${isGlowing ? styles.glowingDot : ''}`}
            />
          );
        })}
      </div>
    );
  };

  const renderShippingProgress = (order: OrderItem) => {
    const statusInfo = URBANO_STATUS_MAP[order.status] || { progress: 0 };
    const totalProgress = statusInfo.progress;
    const type = order.shippingType?.toLowerCase();

    return (
      <div className={styles.trackingContainer} onClick={() => setSelectedOrder(order)}>
        <div
          className={`${styles.iconWrapper} ${styles.active}`}
          data-tooltip="ORIGEN: Almacén Central"
        >
          <Image src="/store-icon.svg" alt="Store" width={18} height={18} />
        </div>
        {type === 'recojo' || !type ? (
          <span className={styles.inlineLabel}>Recojo en Tienda</span>
        ) : type === 'agencia' ? (
          <>
            {renderDots(totalProgress)}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 60 ? styles.active : ''}`}
              data-tooltip={`DISTRIBUCIÓN: ${order.shippingAgency || 'Agencia'}`}
            >
              <Image src="/truck-icon.svg" alt="Truck" width={18} height={18} />
            </div>
            <span className={styles.inlineLabel}>
              {totalProgress >= 60 ? 'En Agencia' : 'En camino'}
            </span>
          </>
        ) : (
          <>
            {renderDots(Math.min(totalProgress * 2, 100))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 50 ? styles.active : ''}`}
              data-tooltip="DISTRIBUCIÓN: Sucursal"
            >
              <Image src="/truck-icon.svg" alt="Truck" width={18} height={18} />
            </div>
            {renderDots(Math.max(0, Math.min((totalProgress - 50) * 2, 100)))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 90 ? styles.active : ''}`}
              data-tooltip="DESTINO: Domicilio"
            >
              <Image src="/home-icon.svg" alt="Home" width={18} height={18} />
            </div>
          </>
        )}
      </div>
    );
  };

  const handleOrderUpdate = (updatedOrder: OrderItem) => {
    setSelectedOrder(updatedOrder);
    router.refresh();
  };

  return (
    <article className={styles.card}>
      <div className={styles.filtersHeader}>
        <div className={`${styles.searchWrapper} ${styles.searchWithButton}`}>
          <div className={styles.searchContainer}>
            <TextField
              type="text"
              label="Buscar por NRO de orden..."
              value={localSearch}
              className={styles.searchInputMD3}
              onChange={(e: any) => {
                const value = e.target.value;
                setLocalSearch(value);
                if (value === '') {
                  updateFilters({ search: null });
                }
              }}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') updateFilters({ search: localSearch });
              }}
            />
            {localSearch.length >= 12 && (
              <button
                className={styles.searchButtonInside}
                onClick={() => updateFilters({ search: localSearch })}
              >
                <Search size={18} />
              </button>
            )}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <Select
            label="Estado"
            outlined
            value={currentStatus || 'all'}
            className={styles.statusSelectMD3}
            onChange={(e: any) => updateFilters({ status: e.target.value })}
          >
            <SelectOption value="all">Todos los estados</SelectOption>
            {DB_STATUS_FILTERS.map((key) => {
              const info = URBANO_STATUS_MAP[key];
              if (!info) return null;
              return (
                <SelectOption key={key} value={key}>
                  {info.label}
                </SelectOption>
              );
            })}
          </Select>
          <Select
            label="Fecha"
            outlined
            value={currentDate || 'all'}
            className={styles.dateSelectMD3}
            onChange={(e: any) => updateFilters({ date: e.target.value })}
          >
            <SelectOption value="all">Todo</SelectOption>
            <SelectOption value="today">Hoy</SelectOption>
            <SelectOption value="yesterday">Ayer</SelectOption>
            <SelectOption value="week">Esta semana</SelectOption>
          </Select>
        </div>
      </div>
      <div className={`${styles.tableWrapper} ${styles.tableWrapperRelative}`}>
        {isFilterLoading && (
          <div className={styles.loaderOverlay}>
            <Loader2 size={36} className={styles.loaderSpin} />
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NRO Orden</th>
              <th>Producto</th>
              <th className={styles.hideOnMobile}>Precio</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className={styles.viewMoreCol}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && !isFilterLoading ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No se encontraron pedidos.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusInfo = URBANO_STATUS_MAP[order.status] || {
                  label: order.status,
                  className: '',
                  progress: 0,
                };
                return (
                  <tr key={order.id} className={styles.tableRow}>
                    <td className={styles.orderNumberCell}>
                      <span className={styles.orderNumber}>
                        {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.productCell}>
                      <Link
                        href={getBusinessPath(businessSlug, `/product/${order.productId}`)}
                        target="_blank"
                        className={styles.productTableLink}
                      >
                        {order.productTitle}
                      </Link>
                    </td>
                    <td className={`${styles.priceCell} ${styles.hideOnMobile}`}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount))}
                    </td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                        {statusInfo.lucideIcon && (
                          <statusInfo.lucideIcon size={14} className={styles.statusIcon} />
                        )}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(order.createdAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </td>
                    <td className={styles.viewMoreCell}>
                      <button
                        className={styles.viewMoreButton}
                        onClick={() => setSelectedOrder(order)}
                        title="Ver detalles del pedido"
                      >
                        <Eye size={16} />
                        <span className={styles.viewMoreLabel}>Ver</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className={styles.pageButton}
          >
            Anterior
          </button>
          <div className={styles.pageInfo}>
            Página <span>{currentPage}</span> de {totalPages}
          </div>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className={styles.pageButton}
          >
            Siguiente
          </button>
        </div>
      )}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          businessSlug={businessSlug}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </article>
  );
}
