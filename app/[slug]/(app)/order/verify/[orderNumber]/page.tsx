import { db } from '@/core/database/client';
import { businesses, payments, products } from '@/core/database/schema';
import { and, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{
    slug: string;
    orderNumber: string;
  }>;
}

function maskDni(dni?: string | null): string {
  if (!dni) return 'No registrado';
  if (dni.length <= 4) return dni;
  return `****${dni.slice(-4)}`;
}

function formatCurrency(amount: string | number, currency = 'PEN'): string {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  const symbol = currency === 'USD' ? '$' : 'S/';
  return `${symbol} ${num.toFixed(2)}`;
}

export default async function OrderVerificationPage({ params }: Props) {
  const { slug, orderNumber } = await params;
  const cleanOrderNumber = orderNumber.startsWith('#') ? orderNumber.slice(1) : orderNumber;

  // ── 1. Lookup Business ──────────────────────────────────────────
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      taxId: true,
      address: true,
      logoUrl: true,
    },
  });

  if (!business) {
    notFound();
  }

  // ── 2. Lookup Payment/Order ─────────────────────────────────────
  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.businessId, business.id), eq(payments.orderNumber, cleanOrderNumber)),
    columns: {
      id: true,
      orderNumber: true,
      amount: true,
      currency: true,
      paymentMethod: true,
      status: true,
      buyerEmail: true,
      buyerDni: true,
      createdAt: true,
      trackingToken: true,
      metadata: true,
      ticketUrl: true,
      productId: true,
    },
  });

  const isValid = Boolean(payment && payment.status !== 'failed');

  const metadata = payment?.metadata as Record<string, unknown> | null;
  const rawCartItems =
    (metadata?.cartItems as {
      id?: string;
      productId?: string;
      name?: string;
      quantity?: number;
      price?: number | string;
    }[]) || [];

  const itemMap = new Map<string, number>();
  if (rawCartItems.length > 0) {
    for (const item of rawCartItems) {
      const pId = item.id || item.productId;
      if (pId) {
        itemMap.set(pId, (itemMap.get(pId) || 0) + (item.quantity || 1));
      }
    }
  } else if (payment?.productId) {
    itemMap.set(payment.productId, 1);
  }

  const productIds = Array.from(itemMap.keys());
  const dbProducts =
    productIds.length > 0
      ? await db
          .select({
            id: products.id,
            title: products.title,
            price: products.price,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];

  const productDbMap = new Map(dbProducts.map((p) => [p.id, p]));
  const cartItems = productIds.map((pId) => {
    const dbProd = productDbMap.get(pId);
    const qty = itemMap.get(pId) || 1;
    return {
      name: dbProd?.title || 'Producto',
      quantity: qty,
      price: dbProd ? Number(dbProd.price) : Number(payment?.amount || 0) / qty,
    };
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Verification Status Header */}
        <div
          style={{
            padding: '24px 20px',
            backgroundColor: isValid ? '#f0fdf4' : '#fef2f2',
            borderBottom: `1px solid ${isValid ? '#bbf7d0' : '#fecaca'}`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isValid ? '#22c55e' : '#ef4444',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}
          >
            {isValid ? '✓' : '✕'}
          </div>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: '18px',
              fontWeight: 800,
              color: isValid ? '#166534' : '#991b1b',
            }}
          >
            {isValid ? 'Comprobante Oficial Verificado' : 'Comprobante No Válido'}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: isValid ? '#15803d' : '#b91c1c',
            }}
          >
            {isValid
              ? 'Este comprobante fue emitido legítimamente por la tienda oficial.'
              : 'No se encontró un registro oficial con los datos proporcionados.'}
          </p>
        </div>

        {/* Business & Order Details */}
        {isValid && payment ? (
          <div style={{ padding: '24px' }}>
            {/* Store Information */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2
                style={{
                  margin: '0 0 4px',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                {business.name}
              </h2>
              {business.taxId && (
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  RUC: {business.taxId}
                </p>
              )}
            </div>

            {/* Order Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#64748b' }}>N° de Orden</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                  {payment.orderNumber}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#64748b' }}>Fecha de Emisión</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {payment.createdAt.toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#64748b' }}>Estado</span>
                <span
                  style={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '11px',
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {payment.status}
                </span>
              </div>
            </div>

            {/* Products List */}
            {cartItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748b',
                    margin: '0 0 10px',
                  }}
                >
                  Productos
                </h3>
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  {cartItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.quantity}x</span>{' '}
                        <span style={{ color: '#334155' }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(item.price * item.quantity, payment.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0061a4',
                color: '#ffffff',
                padding: '16px 20px',
                borderRadius: '16px',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                Total Abonado
              </span>
              <span style={{ fontWeight: 800, fontSize: '22px' }}>
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>

            {/* Customer Privacy-Preserving Info */}
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '24px',
                lineHeight: '1.6',
                backgroundColor: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '12px',
              }}
            >
              <div>
                <strong>Titular:</strong> {maskDni(payment.buyerDni)}
              </div>
              <div>
                <strong>Método:</strong> {payment.paymentMethod}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {payment.trackingToken && (
                <Link
                  href={`/${slug}/order/${payment.trackingToken}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Ver seguimiento de la orden
                </Link>
              )}
              <Link
                href={`/${slug}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Ir a la tienda
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              El código o número de orden escaneado no coincide con ninguna transacción aprobada en
              el sistema.
            </p>
            <Link
              href={`/${slug}`}
              style={{
                display: 'inline-block',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Volver a la tienda
            </Link>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Sistema de validación criptográfica de comprobantes digitales • Store Lite
      </p>
    </div>
  );
}
