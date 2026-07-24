import { db } from '@/core/database/client';
import { orderEvents } from '@/core/database/schema';
import { Icon } from '@/shared/components/ui';
import { desc, eq } from 'drizzle-orm';

interface Props {
  orderId: string;
}

/** Format date to short Spanish format */
function fmt(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Map event type to icon */
function eventIcon(eventType: string): string {
  if (eventType.startsWith('ORDER_PAID')) return 'payments';
  if (eventType.startsWith('ORDER_PREPARING')) return 'inventory_2';
  if (eventType.startsWith('SHIPPING_PAYMENT')) return 'receipt_long';
  if (eventType.startsWith('ORDER_READY')) return 'check_circle';
  if (eventType.startsWith('ORDER_IN_TRANSIT')) return 'local_shipping';
  if (eventType.startsWith('ORDER_DELIVERED')) return 'home';
  if (eventType.startsWith('ORDER_COMPLETED')) return 'verified';
  if (eventType.startsWith('CUSTOMER_REPORTED')) return 'report_problem';
  if (eventType.includes('DISPUTE')) return 'gavel';
  if (eventType.includes('TIMEOUT')) return 'timer_off';
  if (eventType.includes('AUTO_APPROVED')) return 'auto_awesome';
  if (eventType.includes('CREATED')) return 'shopping_cart';
  if (eventType.includes('ATTACHMENT')) return 'attachment';
  if (eventType.includes('PICKUP')) return 'qr_code';
  if (eventType.includes('CONFIRMED')) return 'thumb_up';
  return 'circle';
}

// ─── Legacy status → display mappings ───
const LEGACY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido registrado',
  paid: 'Pago confirmado',
  processing: 'Procesando pedido',
  analizando: 'Pedido en análisis',
  validando: 'Esperando confirmación de envío',
  not_delivered: 'Pedido en espera de despacho',
  aceptado: 'Vendedor aceptó el pedido',
  delivered: 'Cliente confirmó el envío',
  en_reparto: 'Pedido en reparto',
  esperando_confirmacion: 'Esperando confirmación',
  completed: 'Pedido finalizado',
  finalizado: 'Pedido finalizado',
  disputed: 'En disputa',
  failed: 'Pedido fallido',
  refund_requested: 'Reembolso solicitado',
  refunded: 'Reembolsado',
  cancelled: 'Pedido cancelado',
  expired: 'Pedido expirado',
  reported: 'Problema reportado',
};

const LEGACY_STATUS_ICONS: Record<string, string> = {
  pending: 'shopping_cart',
  paid: 'payments',
  processing: 'inventory_2',
  analizando: 'search',
  validando: 'fact_check',
  not_delivered: 'hourglass_top',
  aceptado: 'check_circle',
  delivered: 'check_circle',
  en_reparto: 'local_shipping',
  esperando_confirmacion: 'hourglass_empty',
  completed: 'verified',
  finalizado: 'verified',
  disputed: 'gavel',
  failed: 'error',
  refund_requested: 'currency_exchange',
  refunded: 'currency_exchange',
  cancelled: 'cancel',
  expired: 'timer_off',
  reported: 'report_problem',
};

function legacyLabel(toStatus: string): string {
  return LEGACY_STATUS_LABELS[toStatus] || `Estado: ${toStatus}`;
}

function legacyIcon(toStatus: string): string {
  return LEGACY_STATUS_ICONS[toStatus] || 'circle';
}

/** Timeline event label in Spanish */
function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    ORDER_CREATED: 'Pedido creado',
    ORDER_PAID: 'Pago confirmado',
    ORDER_PREPARING: 'Vendedor preparando pedido',
    SHIPPING_PAYMENT_PENDING: 'Esperando confirmación de envío',
    SHIPPING_PAYMENT_CONFIRMED: 'Costo de envío confirmado',
    ATTACHMENT_UPLOADED: 'Archivo adjunto subido',
    CUSTOMER_CONFIRMED: 'Cliente confirmó información',
    CUSTOMER_REPORTED_ISSUE: 'Cliente reportó un problema',
    DISPUTE_CREATED: 'Disputa abierta',
    PICKUP_CODE_GENERATED: 'Código de recojo generado',
    ORDER_READY_TO_SHIP: 'Listo para envío',
    ORDER_IN_TRANSIT: 'En camino',
    ORDER_DELIVERED: 'Entregado',
    ORDER_COMPLETED: 'Pedido finalizado',
    SELLER_TIMEOUT: 'Tiempo del vendedor agotado',
    AUTO_APPROVED: 'Aprobación automática',
  };
  return labels[eventType] || eventType.replace(/_/g, ' ').toLowerCase();
}

export default async function OrderV2Timeline({ orderId }: Props) {
  // Try V2 timeline events first
  let events: { id: string; eventType: string; createdAt: Date; actor?: string }[] = [];
  let useLegacy = false;

  const v2Events = await db.query.orderTimelineEvents.findMany({
    where: (ev, { eq }) => eq(ev.orderId, orderId),
    orderBy: (ev, { desc }) => [desc(ev.createdAt)],
    limit: 20,
  });

  if (v2Events.length > 0) {
    events = v2Events.map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      createdAt: ev.createdAt,
      actor: ev.actorType,
    }));
  } else {
    // Fallback: try legacy order_events table
    useLegacy = true;
    const legacyEvents = await db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.paymentId, orderId))
      .orderBy(desc(orderEvents.createdAt))
      .limit(20);

    if (legacyEvents.length > 0) {
      events = legacyEvents.map((ev) => ({
        id: ev.id,
        eventType: ev.toStatus,
        createdAt: ev.createdAt,
        actor: ev.triggeredBy ?? undefined,
      }));
    }
  }

  if (events.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--md-sys-color-surface)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: '24px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '500px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px dashed var(--md-sys-color-outline-variant)',
        }}
      >
        <Icon size={18}>timeline</Icon>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Línea de Tiempo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {events.map((ev, i) => (
          <div
            key={ev.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              opacity: i === 0 ? 1 : 0.85,
            }}
          >
            {/* Icon + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background:
                    i === 0
                      ? 'var(--md-sys-color-primary-container)'
                      : 'var(--md-sys-color-secondary-container)',
                  color:
                    i === 0
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-secondary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16}>
                  {useLegacy ? legacyIcon(ev.eventType) : eventIcon(ev.eventType)}
                </Icon>
              </div>
              {i < events.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: 24,
                    background: 'var(--md-sys-color-outline-variant)',
                    borderRadius: 1,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color:
                    i === 0
                      ? 'var(--md-sys-color-on-surface)'
                      : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {useLegacy ? legacyLabel(ev.eventType) : eventLabel(ev.eventType)}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  opacity: 0.5,
                }}
              >
                {fmt(ev.createdAt)}
                {ev.actor &&
                  ` · ${ev.actor === 'customer' ? 'Cliente' : ev.actor === 'seller' ? 'Vendedor' : 'Sistema'}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
