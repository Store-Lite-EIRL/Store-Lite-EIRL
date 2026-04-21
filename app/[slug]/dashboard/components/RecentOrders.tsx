import styles from './RecentOrders.module.css';

interface OrderItem {
  id: string;
  productTitle: string;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'not_delivered' | 'delivered' | 'completed' | 'failed' | 'disputed' | 'refund_requested' | 'refunded' | 'shipped' | 'processing';
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: OrderItem[];
}

const URBANO_STATUS_MAP: Record<string, { label: string; className: string }> = {
  paid: { label: 'Por enviar', className: 'statusPaid' },
  processing: { label: 'En preparación', className: 'statusProcessing' },
  shipped: { label: 'En transcurso', className: 'statusShipped' },
  delivered: { label: 'Llegado', className: 'statusDelivered' },
  completed: { label: 'Finalizado', className: 'statusCompleted' },
  pending: { label: 'Pendiente pago', className: 'statusPending' },
  failed: { label: 'Fallido', className: 'statusFailed' },
  disputed: { label: 'Disputado', className: 'statusDisputed' },
  refunded: { label: 'Reembolsado', className: 'statusRefunded' },
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <article className={styles.card}>
        <div className={styles.empty}>
          <p className={styles.emptyText}>No hay pedidos registrados recientemente.</p>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Dirección de Envío</th>
              <th>Estado (Urbano)</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusInfo = URBANO_STATUS_MAP[order.status] || { label: order.status, className: '' };
              const formattedPrice = new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: order.currency,
              }).format(Number(order.amount));

              const fullAddress = [
                order.shippingDistrict,
                order.shippingProvince,
                order.shippingAddress
              ].filter(Boolean).join(' - ');

              return (
                <tr key={order.id}>
                  <td className={styles.productCell}>
                    <span className={styles.productTitle}>{order.productTitle}</span>
                  </td>
                  <td className={styles.priceCell}>{formattedPrice}</td>
                  <td className={styles.addressCell}>
                    <span className={styles.addressText}>{fullAddress || 'Recojo en tienda / No especificado'}</span>
                  </td>
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
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
