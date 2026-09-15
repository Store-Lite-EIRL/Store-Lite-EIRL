export interface ServerTicketItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ServerTicketData {
  businessName: string;
  businessRuc?: string | null;
  businessAddress?: string | null;
  businessLogoUrl?: string | null;
  orderNumber: string;
  date: Date;
  items: ServerTicketItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  customerDni?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingType?: string | null;
  shippingAddress?: string | null;
  qrCodeDataUrl?: string | null;
}

export function calculateTicketHeight(data: ServerTicketData): number {
  let height = 520;
  height += data.items.length * 36;
  if (data.customerDni || data.customerPhone || data.customerEmail) height += 40;
  if (data.shippingAddress) height += 60;
  if (data.qrCodeDataUrl) height += 130;
  return Math.max(680, height);
}

export function ServerTicket({ data }: { data: ServerTicketData }) {
  const currencySymbol = data.currency === 'USD' ? '$' : 'S/';
  const formattedTotal = `${currencySymbol} ${data.totalAmount.toFixed(2)}`;

  const day = String(data.date.getDate()).padStart(2, '0');
  const month = String(data.date.getMonth() + 1).padStart(2, '0');
  const year = data.date.getFullYear();
  const hours = String(data.date.getHours()).padStart(2, '0');
  const minutes = String(data.date.getMinutes()).padStart(2, '0');
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '24px',
        fontFamily: 'sans-serif',
        color: '#1c1b1f',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        {/* Success Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '4px 14px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          PAGO EXITOSO (VERIFICADO)
        </div>

        {/* Business Info */}
        <div
          style={{
            display: 'flex',
            fontSize: '20px',
            fontWeight: 800,
            color: '#1c1b1f',
            marginBottom: '4px',
            textAlign: 'center',
          }}
        >
          {data.businessName}
        </div>

        {data.businessRuc && (
          <div style={{ display: 'flex', fontSize: '11px', color: '#49454f', marginBottom: '2px' }}>
            RUC: {data.businessRuc}
          </div>
        )}
        {data.businessAddress && (
          <div style={{ display: 'flex', fontSize: '11px', color: '#49454f', textAlign: 'center' }}>
            {data.businessAddress}
          </div>
        )}
      </div>

      {/* Order Info Card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#f4f4f5',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
            }}
          >
            N° Orden
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
            {data.orderNumber}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
            }}
          >
            Fecha
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{formattedDate}</span>
        </div>
      </div>

      {/* Items Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid #e4e4e7',
          paddingTop: '12px',
          marginBottom: '16px',
        }}
      >
        {data.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', flex: 1, paddingRight: '8px' }}>
              <span style={{ fontWeight: 600 }}>{item.quantity}x</span>
              <span style={{ marginLeft: '6px', color: '#27272a' }}>{item.name}</span>
            </div>
            <div style={{ display: 'flex', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {currencySymbol} {(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Total Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#0061a4',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          TOTAL PAGADO
        </span>
        <span style={{ fontSize: '28px', fontWeight: 800, marginTop: '2px' }}>
          {formattedTotal}
        </span>
      </div>

      {/* Details List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '11px',
          color: '#52525b',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Método de pago:</span>
          <span style={{ fontWeight: 600, color: '#18181b' }}>{data.paymentMethod}</span>
        </div>
        {(data.customerDni || data.customerPhone) && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cliente:</span>
            <span style={{ fontWeight: 600, color: '#18181b' }}>
              {[data.customerDni ? `DNI: ${data.customerDni}` : null, data.customerPhone]
                .filter(Boolean)
                .join(' • ')}
            </span>
          </div>
        )}
        {data.customerEmail && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Email:</span>
            <span style={{ fontWeight: 600, color: '#18181b' }}>{data.customerEmail}</span>
          </div>
        )}
      </div>

      {/* Shipping Info if available */}
      {data.shippingAddress && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '11px',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: '#1d4ed8',
              marginBottom: '2px',
              textTransform: 'uppercase',
              fontSize: '9px',
            }}
          >
            {data.shippingType === 'pickup' ? 'Recojo en tienda' : 'Dirección de Entrega'}
          </span>
          <span style={{ color: '#1e3a8a', lineHeight: '1.3' }}>{data.shippingAddress}</span>
        </div>
      )}

      {/* QR Verification & Footer */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: '1px dashed #d4d4d8',
          paddingTop: '14px',
          textAlign: 'center',
        }}
      >
        {data.qrCodeDataUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qrCodeDataUrl}
              alt="QR Verificación"
              width={96}
              height={96}
              style={{ width: '96px', height: '96px' }}
            />
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#3f3f46', marginTop: '6px' }}>
              Escaneá para verificar autenticidad en línea
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#3f3f46' }}>
            ¡Gracias por tu compra!
          </span>
        )}
        <span style={{ fontSize: '9px', color: '#a1a1aa', marginTop: '4px' }}>
          Documento digital de control interno • Store Lite
        </span>
      </div>
    </div>
  );
}
