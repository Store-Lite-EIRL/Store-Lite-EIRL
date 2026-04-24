'use client';

import { Select, SelectOption } from '@/shared/components/ui/inputs/Select';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import {
  Calendar,
  CreditCard,
  ExternalLink,
  Hash,
  Home,
  IdCard,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Timer,
  Truck,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './RecentOrders.module.css';

interface OrderItem {
  id: string;
  orderNumber: string | null;
  productTitle: string;
  productSlug: string;
  productImage: string | null;
  amount: string;
  shippingCost: string;
  currency: string;
  paymentMethod: 'card' | 'yape' | 'plin';
  status:
    | 'pending'
    | 'paid'
    | 'not_delivered'
    | 'delivered'
    | 'completed'
    | 'failed'
    | 'disputed'
    | 'refund_requested'
    | 'refunded'
    | 'shipped'
    | 'processing';
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  shippingDepartment: string | null;
  shippingType: 'agencia' | 'domicilio' | 'recojo' | null;
  shippingAgency: string | null;
  shippingReference: string | null;
  shippingPhone: string | null;
  buyerEmail: string | null;
  metadata: any;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: OrderItem[];
  totalPages: number;
  currentPage: number;
  currentLimit: number;
  currentStatus: string;
  currentSearch: string;
}

const URBANO_STATUS_MAP: Record<string, { label: string; className: string; progress: number }> = {
  paid: { label: 'Pagado', className: 'statusPaid', progress: 20 },
  processing: { label: 'En preparación', className: 'statusProcessing', progress: 40 },
  shipped: { label: 'En camino', className: 'statusShipped', progress: 70 },
  delivered: { label: 'Entregado', className: 'statusDelivered', progress: 90 },
  completed: { label: 'Finalizado', className: 'statusCompleted', progress: 100 },
  pending: { label: 'Pendiente', className: 'statusPending', progress: 10 },
  failed: { label: 'Fallido', className: 'statusFailed', progress: 0 },
  disputed: { label: 'Disputa', className: 'statusDisputed', progress: 0 },
  refunded: { label: 'Reembolsado', className: 'statusRefunded', progress: 0 },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: 'Tarjeta de Crédito/Débito',
  yape: 'Yape',
  plin: 'Plin',
};

export function RecentOrders({
  orders,
  totalPages,
  currentPage,
  currentLimit,
  currentStatus,
  currentSearch,
}: RecentOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Disable scroll when modal is open
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
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || value === '') params.delete(key);
      else params.set(key, value);
    });
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
          <Store size={18} />
        </div>

        {type === 'recojo' || !type ? (
          <span className={styles.inlineLabel}>Recojo en Tienda</span>
        ) : type === 'agencia' ? (
          <>
            {renderDots(totalProgress)}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 70 ? styles.active : ''}`}
              data-tooltip={`DISTRIBUCIÓN: ${order.shippingAgency || 'Agencia'}`}
            >
              <Truck size={18} />
            </div>
            <span className={styles.inlineLabel}>
              {totalProgress >= 70 ? 'En Agencia' : 'En camino'}
            </span>
          </>
        ) : (
          <>
            {renderDots(Math.min(totalProgress * 2, 100))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 50 ? styles.active : ''}`}
              data-tooltip="DISTRIBUCIÓN: Sucursal"
            >
              <Truck size={18} />
            </div>
            {renderDots(Math.max(0, Math.min((totalProgress - 50) * 2, 100)))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 90 ? styles.active : ''}`}
              data-tooltip="DESTINO: Domicilio"
            >
              <Home size={18} />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <article className={styles.card}>
      <div className={styles.filtersHeader}>
        <div className={styles.searchWrapper}>
          <TextField
            type="text"
            label="Buscar por dirección o NRO..."
            value={currentSearch}
            className={styles.searchInputMD3}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') updateFilters({ search: e.target.value });
            }}
          />
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
            {Object.entries(URBANO_STATUS_MAP).map(([key, info]) => (
              <SelectOption key={key} value={key}>
                {info.label}
              </SelectOption>
            ))}
          </Select>

          <Select
            label="Límite"
            outlined
            value={currentLimit.toString()}
            className={styles.limitSelectMD3}
            onChange={(e: any) => updateFilters({ limit: e.target.value })}
          >
            <SelectOption value="10">10 por página</SelectOption>
            <SelectOption value="20">20 por página</SelectOption>
            <SelectOption value="50">50 por página</SelectOption>
          </Select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NRO Orden</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Ruta de Envío</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
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
                  <tr key={order.id}>
                    <td className={styles.orderNumberCell}>
                      <span className={styles.orderNumber}>
                        #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.productCell}>
                      <Link
                        href={`/product/${order.productSlug}`}
                        target="_blank"
                        className={styles.productTableLink}
                      >
                        {order.productTitle}
                      </Link>
                    </td>
                    <td className={styles.priceCell}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount))}
                    </td>
                    <td className={styles.trackingCell}>{renderShippingProgress(order)}</td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
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

      {/* --- Order Detail Modal --- */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <Hash size={20} />
                <h2>
                  Detalle del Pedido #
                  {selectedOrder.orderNumber || selectedOrder.id.slice(0, 8).toUpperCase()}
                </h2>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedOrder(null)}>
                <X size={24} />
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.modalStatusHeader}>
                <div
                  className={`${styles.statusBadgeLarge} ${styles[URBANO_STATUS_MAP[selectedOrder.status]?.className]}`}
                >
                  <Timer size={18} />
                  {URBANO_STATUS_MAP[selectedOrder.status]?.label}
                </div>
                <div className={styles.dateTime}>
                  <Calendar size={14} />
                  {new Date(selectedOrder.createdAt).toLocaleString('es-PE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>

              <div className={styles.modalGrid}>
                <div className={styles.modalColumn}>
                  <section className={styles.infoSection}>
                    <h3 className={styles.sectionTitle}>
                      <ShoppingBag size={16} /> Producto
                    </h3>
                    <div className={styles.productCard}>
                      <div className={styles.productImageWrapper}>
                        {selectedOrder.productImage ? (
                          <Image
                            src={selectedOrder.productImage}
                            alt={selectedOrder.productTitle}
                            width={80}
                            height={80}
                            className={styles.productImg}
                          />
                        ) : (
                          <div className={styles.productPlaceholder}>
                            <ShoppingBag size={32} />
                          </div>
                        )}
                      </div>
                      <div className={styles.productInfo}>
                        <Link
                          href={`/product/${selectedOrder.productSlug}`}
                          target="_blank"
                          className={styles.productLink}
                        >
                          {selectedOrder.productTitle} <ExternalLink size={14} />
                        </Link>
                        <p className={styles.itemPrice}>
                          Precio:{' '}
                          {new Intl.NumberFormat('es-PE', {
                            style: 'currency',
                            currency: selectedOrder.currency,
                          }).format(
                            Number(selectedOrder.amount) - Number(selectedOrder.shippingCost),
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className={styles.infoSection}>
                    <h3 className={styles.sectionTitle}>
                      <CreditCard size={16} /> Pago
                    </h3>
                    <div className={styles.paymentDetails}>
                      <div className={styles.detailRow}>
                        <span>Método:</span>
                        <span className={styles.capitalizeText}>
                          {PAYMENT_METHOD_MAP[selectedOrder.paymentMethod] ||
                            selectedOrder.paymentMethod}
                        </span>
                      </div>
                      <div className={styles.divider} />
                      <div className={styles.detailRow}>
                        <span>Subtotal:</span>
                        <span>
                          {new Intl.NumberFormat('es-PE', {
                            style: 'currency',
                            currency: selectedOrder.currency,
                          }).format(
                            Number(selectedOrder.amount) - Number(selectedOrder.shippingCost),
                          )}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Envío:</span>
                        <span>
                          {new Intl.NumberFormat('es-PE', {
                            style: 'currency',
                            currency: selectedOrder.currency,
                          }).format(Number(selectedOrder.shippingCost))}
                        </span>
                      </div>
                      <div className={`${styles.detailRow} ${styles.totalRow}`}>
                        <span>Total:</span>
                        <span>
                          {new Intl.NumberFormat('es-PE', {
                            style: 'currency',
                            currency: selectedOrder.currency,
                          }).format(Number(selectedOrder.amount))}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className={styles.modalColumn}>
                  <section className={styles.infoSection}>
                    <h3 className={styles.sectionTitle}>
                      <User size={16} /> Cliente
                    </h3>
                    <div className={styles.customerCard}>
                      <div className={styles.dataItem}>
                        <IdCard size={16} />
                        <span>DNI: {selectedOrder.metadata?.buyerDni || 'No registrado'}</span>
                      </div>
                      <div className={styles.dataItem}>
                        <Timer size={16} />
                        <span>Email: {selectedOrder.buyerEmail}</span>
                      </div>
                      <div className={styles.dataItem}>
                        <Phone size={16} />
                        <span>Tel: {selectedOrder.shippingPhone || 'Sin teléfono'}</span>
                      </div>
                    </div>
                  </section>

                  <section className={styles.infoSection}>
                    <h3 className={styles.sectionTitle}>
                      <MapPin size={16} /> Ruta de Entrega
                    </h3>
                    <div className={styles.shippingPath}>
                      <div className={styles.pathItem}>
                        <Store size={16} className={styles.pathIcon} />
                        <div>
                          <p className={styles.pathLabel}>Inicio</p>
                          <p className={styles.pathValue}>Almacén Central (Lima)</p>
                        </div>
                      </div>
                      {selectedOrder.shippingType !== 'recojo' && (
                        <div className={styles.pathItem}>
                          <Truck size={16} className={styles.pathIcon} />
                          <div>
                            <p className={styles.pathLabel}>Agencia</p>
                            <p className={styles.pathValue}>
                              {selectedOrder.shippingAgency || 'Distribución local'}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.shippingType === 'domicilio' && (
                        <div className={styles.pathItem}>
                          <Home size={16} className={styles.pathIcon} />
                          <div>
                            <p className={styles.pathLabel}>Destino</p>
                            <p className={styles.pathValue}>
                              {selectedOrder.shippingDistrict}, {selectedOrder.shippingProvince}
                            </p>
                            <p className={styles.pathSubValue}>{selectedOrder.shippingAddress}</p>
                            {selectedOrder.shippingReference && (
                              <p className={styles.refText}>
                                Ref: {selectedOrder.shippingReference}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button className={styles.primaryButton} onClick={() => setSelectedOrder(null)}>
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </article>
  );
}
