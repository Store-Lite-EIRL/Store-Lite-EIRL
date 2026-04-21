'use client';

import Barcode from 'react-barcode';
import StoreLogo from '../StoreLogo';
import styles from './Receipt.module.css';

export interface ReceiptItemProps {
  label: string;
  value: string | number;
  isBold?: boolean;
  isTotal?: boolean;
  icon?: string;
  subLabel?: string;
}

export interface ReceiptProps {
  businessName: string;
  businessRuc?: string;
  businessAddress?: string;
  items: ReceiptItemProps[];
  totalLabel?: string;
  totalAmount: number;
  currency?: string;
  orderNumber?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDni?: string;
  date?: Date;
  logoUrl?: string;
  notes?: string;
  onClose?: () => void;
  /** Dirección de envío o punto de recojo del comprador */
  shippingAddress?: string;
  /** Tipo de entrega: 'delivery' | 'pickup' | 'agency' */
  shippingType?: 'delivery' | 'pickup' | 'agency';
}

// ─── SVG Inline Icons (reemplazan Material Symbols para que funcionen en PNG) ─────

function VerifiedIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
    </svg>
  );
}

function InventoryIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4v2l9 5.5L4 15v2h16v-2l-9-5.5L20 4V2zm-8 8.5L4 6h16l-8 4.5z" />
    </svg>
  );
}

function TruckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

function StoreIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4v2l8 5 8-5V4zM4 13h16v7H4v-7z" />
    </svg>
  );
}

function AgencyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

// SVG inline idéntico al ícono "location_on" de Material Icons
function LocationOnIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Receipt - Modern Glassmorphism Design with Professional Barcode
 * Usa SVGs inline en lugar de Material Symbols para compatibilidad con html-to-image.
 */
export function Receipt({
  businessName,
  businessRuc,
  businessAddress,
  items,
  totalLabel = 'TOTAL',
  totalAmount,
  currency = 'S/',
  orderNumber,
  paymentMethod,
  customerName,
  customerEmail,
  customerPhone,
  customerDni,
  date = new Date(),
  logoUrl,
  notes,
  onClose,
  shippingAddress,
  shippingType = 'delivery',
}: ReceiptProps) {
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatAmount = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const orderNum = orderNumber || `ORD-${Date.now().toString(36).toUpperCase()}`;

  const shippingLabel =
    shippingType === 'pickup'
      ? 'Recojo en tienda'
      : shippingType === 'agency'
        ? 'Agencia Urbano'
        : 'Dirección de envío';

  const ShippingIcon =
    shippingType === 'pickup' ? StoreIcon : shippingType === 'agency' ? AgencyIcon : TruckIcon;

  return (
    <div className={styles.receipt}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.successBadge}>
          <VerifiedIcon size={14} />
          Pago Exitoso
        </div>

        {/* Logo: use provided logo, or default STORE LITE icon */}
        {logoUrl ? (
          <img src={logoUrl} alt={businessName} className={styles.logo} />
        ) : (
          <div className={styles.defaultLogo}>
            <InventoryIcon size={32} />
          </div>
        )}
        <div className={styles.businessInfoWrapper}>
          <h2 className={styles.businessName}>{businessName}</h2>
          {businessRuc && <p className={styles.ruc}>RUC: {businessRuc}</p>}
          {businessAddress && <p className={styles.address}>{businessAddress}</p>}
        </div>
      </div>

      {/* Meta Info Grid */}
      <div className={styles.orderInfo}>
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>N° Orden</span>
            <span className={styles.infoValue}>{orderNum}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Fecha</span>
            <span className={styles.infoValue}>{formatDate(date)} {formatTime(date)}</span>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={styles.items}>
        {items.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <span className={styles.itemLabel}>{item.label}</span>
              {item.subLabel && <span className={styles.itemSub}>{item.subLabel}</span>}
            </div>
            <span className={styles.itemValue}>
              {typeof item.value === 'number' ? formatAmount(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Highlights: Total */}
      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>{totalLabel}</span>
        <span className={styles.totalAmount}>{formatAmount(totalAmount)}</span>
      </div>

      {/* Additional Details */}
      <div className={styles.detailsList}>
        {paymentMethod && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Método de Pago</span>
            <span className={styles.detailValue}>{paymentMethod}</span>
          </div>
        )}
        {(customerDni || customerPhone) && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Cliente</span>
            <span className={styles.detailValue}>{customerDni || customerPhone}</span>
          </div>
        )}
        {customerEmail && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email</span>
            <span className={styles.detailValue}>{customerEmail}</span>
          </div>
        )}
      </div>

      {/* Shipping Address */}
      {shippingAddress && (
        <div className={styles.shippingSection}>
          <div className={styles.shippingHeader}>
            <LocationOnIcon size={14} />
            <span className={styles.shippingLabel}>{shippingLabel}</span>
          </div>
          <p className={styles.shippingAddress}>{shippingAddress}</p>
        </div>
      )}

      {/* Notes if any */}
      {notes && (
        <div className={styles.notes} style={{ padding: '0 24px 16px', fontSize: '11px', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
          {notes}
        </div>
      )}

      {/* Footer & Professional Barcode */}
      <div className={styles.footer}>
        <div className={styles.footerText}>¡Gracias por tu preferencia!</div>
        <div className={styles.footerSubtext}>Documento de control interno</div>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Barcode
            value={orderNum}
            width={1.2}
            height={40}
            fontSize={10}
            background="transparent"
            displayValue={false}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.2,
            color: '#000',
            fontSize: '9px',
            fontWeight: '800',
            letterSpacing: '0.1em'
          }}>
            <StoreLogo size={21} variant='white' />
          </div>
        </div>
      </div>
    </div>
  );
}
