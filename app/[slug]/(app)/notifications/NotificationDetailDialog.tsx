'use client';

import React from 'react';

import type { NotificationWithMeta } from '@/hooks/useNotifications';
import { Dialog } from '@/shared/components/ui/surfaces';
import { formatDateTime } from '@/shared/utils/date';
import { getCategoryIcon } from './categoryIcons';

interface Props {
  notification: NotificationWithMeta | null;
  open: boolean;
  onClose: () => void;
}

const DATA_FIELDS: Record<string, { key: string; label: string }[]> = {
  order_created: [{ key: 'orderId', label: 'ID de pedido' }],
  order_status_changed: [
    { key: 'orderId', label: 'ID de pedido' },
    { key: 'oldStatus', label: 'Estado anterior' },
    { key: 'newStatus', label: 'Nuevo estado' },
  ],
  order_shipped: [{ key: 'orderId', label: 'ID de pedido' }],
  order_finalization_requested: [{ key: 'orderId', label: 'ID de pedido' }],
  order_finalization_confirmed: [{ key: 'orderId', label: 'ID de pedido' }],
  order_finalization_rejected: [{ key: 'orderId', label: 'ID de pedido' }],
  order_auto_finalized: [{ key: 'orderId', label: 'ID de pedido' }],
  stock_low: [
    { key: 'productName', label: 'Producto' },
    { key: 'currentStock', label: 'Stock actual' },
    { key: 'minStock', label: 'Stock mínimo' },
  ],
  stock_out: [{ key: 'productId', label: 'ID de producto' }],
  plan_expiring: [{ key: 'daysRemaining', label: 'Días restantes' }],
  plan_expired: [],
  plan_upgraded: [
    { key: 'oldPlan', label: 'Plan anterior' },
    { key: 'newPlan', label: 'Nuevo plan' },
  ],
  message_new: [{ key: 'preview', label: 'Vista previa' }],
  message_unread: [{ key: 'preview', label: 'Vista previa' }],
};

export function NotificationDetailDialog({ notification, open, onClose }: Props) {
  if (!notification) return null;

  const fields = DATA_FIELDS[notification.type] ?? null;
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const hasMappedData = fields !== null && fields.some((f) => data[f.key] !== null);

  return (
    <Dialog open={open} onClose={onClose}>
      <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {getCategoryIcon(notification.category, 22)}
        <span>{notification.title}</span>
      </div>
      <div slot="content">
        <p style={{ margin: '0 0 1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {notification.message}
        </p>

        <dl
          style={{
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '0.5rem 1rem',
            fontSize: '0.9rem',
          }}
        >
          <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Fecha</dt>
          <dd style={{ margin: 0 }}>{formatDateTime(notification.createdAt)}</dd>

          <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Estado</dt>
          <dd style={{ margin: 0 }}>{notification.isRead ? 'Leído' : 'No leído'}</dd>

          {notification.isRead && notification.readAt && (
            <>
              <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Leído</dt>
              <dd style={{ margin: 0 }}>{formatDateTime(notification.readAt)}</dd>
            </>
          )}

          <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tipo</dt>
          <dd style={{ margin: 0, textTransform: 'capitalize' }}>
            {notification.category === 'almacen' ? 'Almacén' : notification.category}
          </dd>
        </dl>

        {hasMappedData && (
          <div
            style={{
              marginTop: '1rem',
              borderTop: '1px solid var(--md-sys-color-outline-variant)',
              paddingTop: '0.75rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Información adicional
            </h4>
            <dl
              style={{
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.4rem 1rem',
                fontSize: '0.9rem',
              }}
            >
              {fields.map(({ key, label }) => {
                const value = data[key];
                if (value === null || value === undefined) return null;
                return (
                  <React.Fragment key={key}>
                    <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</dt>
                    <dd style={{ margin: 0 }}>{String(value)}</dd>
                  </React.Fragment>
                );
              })}
            </dl>
          </div>
        )}

        {!fields && Object.keys(data).length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              borderTop: '1px solid var(--md-sys-color-outline-variant)',
              paddingTop: '0.75rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Datos adicionales
            </h4>
            <dl
              style={{
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.4rem 1rem',
                fontSize: '0.9rem',
              }}
            >
              {Object.entries(data).map(([key, value]) => (
                <React.Fragment key={key}>
                  <dt style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{key}</dt>
                  <dd style={{ margin: 0 }}>{String(value)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}
      </div>
      <div slot="actions">
        <md-text-button onClick={onClose}>Cerrar</md-text-button>
      </div>
    </Dialog>
  );
}
