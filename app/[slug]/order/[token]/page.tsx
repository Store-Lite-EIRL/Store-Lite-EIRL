import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, businessTeamMembers, payments } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { Icon } from '@/shared/components/ui';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ActionModals from './ActionModals';
import ConfirmationFlow from './ConfirmationFlow';
import DownloadButton from './DownloadButton';
import LogoutButton from './LogoutButton';
import OrderAuthGate from './OrderAuthGate';
import OrderChatSection from './OrderChatSection';
import OrderGuide from './OrderGuide';
import OrderRealtimeHandler from './OrderRealtimeHandler';
import OrderV2Timeline from './OrderV2Timeline';
import ReportFlow from './ReportFlow';
import ReportV2Flow from './ReportV2Flow';

interface OrderTrackingPageProps {
  params: Promise<{
    slug: string;
    token: string;
  }>;
}

export async function generateMetadata({ params }: OrderTrackingPageProps): Promise<Metadata> {
  const { token } = await params;
  const order = await db.query.payments.findFirst({
    where: eq(payments.trackingToken, token),
    with: { business: true },
  });
  if (!order || !order.business) return { title: 'Orden no encontrada' };
  return {
    title: `Seguimiento: ${order.business.name}`,
    description: `Portal de seguimiento para el cliente de ${order.business.name}`,
  };
}

/** Format a Date or ISO string to a readable Spanish format */
function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { token, slug } = await params;

  // 🐛 DEBUG: server-side logging to trace redirect to /auth
  console.log('[OrderTrackingPage:RENDER]', {
    token,
    slug,
    timestamp: new Date().toISOString(),
  });

  if (!token || token.length < 5) notFound();

  let order;
  try {
    order = await db.query.payments.findFirst({
      where: eq(payments.trackingToken, token),
      with: { product: true, business: true },
    });
  } catch (error) {
    notFound();
  }

  if (!order || !order.business || order.business.slug.toLowerCase() !== slug.toLowerCase()) {
    notFound();
  }

  // 🔒 SECURITY: Block sellers and team members from accessing customer order pages.
  // Even if they somehow obtain the trackingToken, they cannot self-confirm.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[OrderTrackingPage:SUPABASE]', {
    hasUser: !!user,
    userId: user?.id ?? null,
    timestamp: new Date().toISOString(),
  });

  if (user) {
    // Check if user is the owner
    const sellerBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.ownerId, user.id),
      columns: { id: true },
    });

    // Check if user is a team member of this business
    const teamMembership = sellerBusiness
      ? null // Already found as owner, skip team check
      : await db.query.businessTeamMembers.findFirst({
          where: and(
            eq(businessTeamMembers.userId, user.id),
            eq(businessTeamMembers.businessId, order.businessId),
          ),
          columns: { id: true },
        });

    if ((sellerBusiness && sellerBusiness.id === order.businessId) || teamMembership) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--md-sys-color-surface)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'var(--md-sys-color-error-container)',
              borderRadius: '32px',
              padding: '3rem 2rem',
              textAlign: 'center',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                background: 'var(--md-sys-color-error)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: 32,
              }}
            >
              🚫
            </div>
            <h2
              style={{
                margin: '0 0 1rem',
                fontSize: '1.5rem',
                fontWeight: 950,
                color: 'var(--md-sys-color-on-error-container)',
              }}
            >
              Acceso No Permitido
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                lineHeight: 1.5,
                color: 'var(--md-sys-color-on-error-container)',
                opacity: 0.8,
              }}
            >
              Esta página es exclusiva para el <b>comprador</b>. Como vendedor, no puedes acceder al
              portal de seguimiento de tu propia orden.
            </p>
          </div>
        </div>
      );
    }
  }

  const getStep = () => {
    // V2 step mapping (compressed to 5-step display)
    const V2_STEP: Record<string, number> = {
      CREATED: 0, PAID: 1, PREPARING_ORDER: 1,
      WAITING_CUSTOMER_CONFIRMATION: 1, READY_TO_SHIP: 2,
      IN_TRANSIT: 2, DELIVERED: 3, COMPLETED: 4,
      ISSUE_REPORTED: 1, DISPUTE: 1,
      SELLER_TIMEOUT: 4, CANCELLED: 0,
    };
    if (order.status in V2_STEP) return V2_STEP[order.status];
    // Legacy steps
    if (order.status === 'pending') return 0;
    if (order.status === 'validando') return 1;
    if (order.status === 'delivered') return 2;
    if ((order.status as string) === 'en_reparto') return 3;
    if (order.status === 'disputed') return order.ticketImageUrl ? 1 : 0;
    if (order.status === 'completed') return 4;
    if (order.status === 'not_delivered') return order.ticketImageUrl ? 1 : 0;
    return 0;
  };

  const currentStep = getStep();

  const statusMap: Record<
    string,
    {
      label: string;
      icon: string;
      color: string;
      bgColor: string;
      desc: string;
      actionLabel?: string;
    }
  > = {
    pending: {
      label: 'Preparando Pedido',
      icon: 'inventory_2',
      color: 'var(--md-sys-color-on-warning-container)',
      bgColor: 'var(--md-sys-color-warning-container)',
      desc: 'El vendedor ha recibido tu pedido y está alistando los productos para el despacho.',
    },
    validando: {
      label: '¡Ticket Listo! Verificalo',
      icon: 'fact_check',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: 'El vendedor subió el comprobante de envío. Revisá los datos del courier y confirmá si todo está correcto.',
    },
    not_delivered: {
      label: 'En Espera de Despacho',
      icon: 'hourglass_top',
      color: 'var(--md-sys-color-on-surface-variant)',
      bgColor: 'var(--md-sys-color-surface-variant)',
      desc: 'El despacho está en proceso. En cuanto el vendedor suba el ticket de la agencia, aparecerá aquí.',
    },
    delivered: {
      label: 'Pedido en Camino',
      icon: 'local_shipping',
      color: 'var(--md-sys-color-on-tertiary-container)',
      bgColor: 'var(--md-sys-color-tertiary-container)',
      desc: '¡Todo listo! Tu paquete ya fue entregado al courier y se encuentra en ruta hacia tu destino.',
    },
    en_reparto: {
      label: '¡Tu Pedido Llegó!',
      icon: 'home',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: 'El vendedor notificó que el producto ya llegó. Confirmá que lo recibiste correctamente.',
    },
    completed: {
      label: 'Compra Finalizada',
      icon: 'verified',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: '¡Excelente! La transacción se completó exitosamente. ¡Gracias por confiar en nosotros!',
    },
    disputed: {
      label: 'Ticket Rechazado',
      icon: 'report_problem',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'Reportaste un inconveniente con el comprobante. El vendedor debe corregirlo y subir uno nuevo.',
    },
    // ── V2 Statuses ──
    CREATED: {
      label: 'Pedido Creado',
      icon: 'shopping_cart',
      color: 'var(--md-sys-color-on-surface-variant)',
      bgColor: 'var(--md-sys-color-surface-variant)',
      desc: 'El pedido fue registrado y está pendiente de pago.',
    },
    PAID: {
      label: 'Pago Confirmado',
      icon: 'payments',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: 'El pago fue procesado correctamente. El vendedor está preparando tu pedido.',
    },
    PREPARING_ORDER: {
      label: 'Preparando Pedido',
      icon: 'inventory_2',
      color: 'var(--md-sys-color-on-tertiary-container)',
      bgColor: 'var(--md-sys-color-tertiary-container)',
      desc: 'El vendedor está alistando los productos para el despacho.',
    },
    WAITING_CUSTOMER_CONFIRMATION: {
      label: 'Esperando Confirmación',
      icon: 'fact_check',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: 'El vendedor subió el comprobante de envío. Revisá los datos y confirmá si todo está correcto.',
    },
    READY_TO_SHIP: {
      label: 'Listo para Envío',
      icon: 'check_circle',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: 'Todo listo. El paquete será entregado al courier próximamente.',
    },
    IN_TRANSIT: {
      label: 'En Camino',
      icon: 'local_shipping',
      color: 'var(--md-sys-color-on-tertiary-container)',
      bgColor: 'var(--md-sys-color-tertiary-container)',
      desc: 'Tu paquete fue entregado al courier y está en ruta hacia tu destino.',
    },
    DELIVERED: {
      label: 'Entregado',
      icon: 'home',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: 'El pedido llegó a su destino. Por favor confirmá que lo recibiste correctamente.',
    },
    COMPLETED: {
      label: 'Compra Finalizada',
      icon: 'verified',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: '¡Excelente! La transacción se completó exitosamente.',
    },
    ISSUE_REPORTED: {
      label: 'Problema Reportado',
      icon: 'report_problem',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'Reportaste un problema. El vendedor fue notificado. Si no se resuelve, se abrirá una disputa.',
    },
    DISPUTE: {
      label: 'En Disputa',
      icon: 'gavel',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'El caso está siendo revisado por nuestro equipo de soporte.',
    },
    SELLER_TIMEOUT: {
      label: 'Tiempo Agotado',
      icon: 'timer_off',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'El vendedor no respondió a tiempo. El pedido fue cerrado automáticamente.',
    },
    CANCELLED: {
      label: 'Pedido Cancelado',
      icon: 'cancel',
      color: 'var(--md-sys-color-on-surface-variant)',
      bgColor: 'var(--md-sys-color-surface-variant)',
      desc: 'Este pedido fue cancelado.',
    },
  };

  const currentStatus = statusMap[order.status] || {
    label: order.status.toUpperCase(),
    icon: 'info',
    color: 'var(--md-sys-color-on-surface-variant)',
    bgColor: 'var(--md-sys-color-surface-variant)',
    desc: 'Estado en actualización.',
  };

  const steps = [
    { label: 'Recibido', icon: 'payments' },
    { label: 'Validación', icon: 'fact_check' },
    { label: 'Envío', icon: 'local_shipping' },
    { label: 'Confirmación', icon: 'package_2' },
    { label: 'Finalizado', icon: 'verified' },
  ];

  console.log('[OrderTrackingPage:RENDER_UI]', {
    status: order.status,
    step: currentStep,
    timestamp: new Date().toISOString(),
  });

  return (
    <OrderAuthGate
      token={token}
      businessName={order.business.name}
      orderNumber={order.orderNumber || ''}
    >
      <div className="order-root">
        <OrderRealtimeHandler orderId={order.id} />
        <ActionModals paymentId={order.id} trackingToken={token} orderNumber={order.orderNumber} />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .order-root { min-height: 100vh; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-family: var(--mio-theme-text-font-family), sans-serif; }
          
          /* Header Moderno */
          .top-bar { 
            position: sticky; top: 0; z-index: 1000; 
            background: rgba(var(--md-sys-color-surface-rgb), 0.8);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            padding: 0.75rem 1.5rem;
          }
          .top-bar-content { 
            max-width: 1400px; margin: 0 auto; 
            display: flex; align-items: center; justify-content: space-between; 
          }
          .biz-branding { display: flex; align-items: center; gap: 12px; }
          .biz-logo { 
            width: 40px; height: 40px; border-radius: 12px; 
            background: var(--md-sys-color-primary); 
            display: flex; align-items: center; justify-content: center; color: white;
            font-weight: 950; font-size: 1.25rem;
            box-shadow: 0 4px 12px rgba(var(--md-sys-color-primary-rgb), 0.2);
          }
          .biz-name { font-weight: 950; font-size: 1.1rem; letter-spacing: -0.02em; }
          
          /* Hub Layout */
          .hub-container { 
            max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem;
            display: grid; grid-template-columns: 1fr; gap: 2rem;
          }
          @media (min-width: 1024px) { 
            .hub-container { grid-template-columns: 1fr 400px; align-items: start; } 
          }

          /* Central Hub Card */
          .hub-card { 
            background: var(--md-sys-color-surface-container-low);
            border: 1px solid var(--md-sys-color-outline-variant);
            border-radius: 40px;
            padding: 3rem;
            position: relative;
            overflow: hidden;
            display: flex; flex-direction: column; align-items: center; text-align: center;
          }
          
          .status-badge {
            padding: 0.5rem 1.5rem; border-radius: 100px;
            font-weight: 950; font-size: 0.75rem; text-transform: uppercase;
            letter-spacing: 0.1em; margin-bottom: 2rem;
            display: flex; align-items: center; gap: 8px;
          }

          .hub-title { font-size: 2.5rem; font-weight: 950; margin-bottom: 1rem; letter-spacing: -0.04em; line-height: 1.1; }
          .hub-desc { font-size: 1.1rem; opacity: 0.7; max-width: 500px; line-height: 1.5; margin-bottom: 3rem; }

          /* Timeline Pro */
          .pro-timeline { 
            display: flex; justify-content: space-between; width: 100%; max-width: 600px; 
            margin-bottom: 4rem; position: relative; padding: 0 10px;
          }
          .pro-line { position: absolute; top: 24px; left: 40px; right: 40px; height: 4px; background: var(--md-sys-color-outline-variant); border-radius: 2px; }
          .pro-line-fill { position: absolute; top: 24px; left: 40px; height: 4px; background: var(--md-sys-color-primary); border-radius: 2px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
          .pro-step { z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 12px; }
          .pro-icon-box { 
            width: 48px; height: 48px; border-radius: 16px; 
            background: var(--md-sys-color-surface-container-highest);
            border: 2px solid var(--md-sys-color-outline-variant);
            display: flex; align-items: center; justify-content: center;
            transition: all 0.4s ease;
          }
          .pro-step.active .pro-icon-box { 
            background: var(--md-sys-color-primary); border-color: var(--md-sys-color-primary); color: white;
            box-shadow: 0 10px 20px rgba(var(--md-sys-color-primary-rgb), 0.3);
            transform: scale(1.1) translateY(-4px);
          }
          .pro-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-on-surface-variant); }
          .pro-step.active .pro-label { color: var(--md-sys-color-on-surface); font-weight: 950; }

          /* Despacho Card */
          .despacho-card {
            background: var(--md-sys-color-surface);
            border: 2px dashed var(--md-sys-color-outline);
            border-radius: 32px;
            padding: 2rem;
            width: 100%; max-width: 500px;
            display: flex; flex-direction: column; gap: 1.5rem;
            margin-bottom: 2rem;
            transition: all 0.3s ease;
          }
          .despacho-card:hover { border-color: var(--md-sys-color-primary); transform: translateY(-4px); }
          .ticket-preview { 
            width: 100%; height: 200px; border-radius: 20px; 
            background: var(--md-sys-color-surface-container-high); 
            overflow: hidden; cursor: pointer; position: relative;
          }
          .ticket-preview img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
          .ticket-preview:hover img { transform: scale(1.05); }
          .ticket-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.3s; }
          .ticket-preview:hover .ticket-overlay { opacity: 1; }

          /* Sidebar Chat */
          .sticky-chat { height: calc(100vh - 120px); position: sticky; top: 100px; }
          @media (max-width: 1023px) { .sticky-chat { height: 500px; position: static; } }

          /* Action Buttons */
          .btn-hub { 
            border: none; padding: 1.25rem 2.5rem; border-radius: 100px; 
            font-weight: 950; text-transform: uppercase; cursor: pointer; 
            letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex; align-items: center; gap: 12px;
          }
          .btn-hub-p { background: var(--md-sys-color-primary); color: white; box-shadow: 0 10px 30px rgba(var(--md-sys-color-primary-rgb), 0.3); }
          .btn-hub-p:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(var(--md-sys-color-primary-rgb), 0.4); }
          .btn-hub-s { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }

          /* Pulse Animation for Critical States */
          @keyframes critical-pulse {
            0% { box-shadow: 0 0 0 0 rgba(var(--md-sys-color-primary-rgb), 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(var(--md-sys-color-primary-rgb), 0); }
            100% { box-shadow: 0 0 0 0 rgba(var(--md-sys-color-primary-rgb), 0); }
          }
          .pulse-active { animation: critical-pulse 2s infinite; }

          .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; align-items: center; justify-content: center; padding: 1rem; }
          .modal-overlay:target { display: flex; }
          .m-box { background: var(--md-sys-color-surface); border-radius: 40px; width: 100%; max-width: 700px; overflow: hidden; position: relative; animation: m-up 0.3s ease; border: 1px solid var(--md-sys-color-outline-variant); }
          .modal-box { background: var(--md-sys-color-surface-container-highest); border-radius: 32px; width: 100%; max-width: 480px; padding: 2.5rem 2rem; position: relative; animation: m-up 0.3s ease; border: 1px solid var(--md-sys-color-outline-variant); }
          @keyframes m-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          
          /* ActionModals buttons */
          .btn-action { border: none; padding: 1rem 2rem; border-radius: 100px; font-weight: 950; text-transform: uppercase; cursor: pointer; letter-spacing: 0.08em; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; }
          .btn-action.btn-confirm { background: var(--md-sys-color-primary); color: white; box-shadow: 0 8px 24px rgba(var(--md-sys-color-primary-rgb), 0.3); }
          .btn-action.btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(var(--md-sys-color-primary-rgb), 0.4); }
          .btn-action.btn-report { background: var(--md-sys-color-error); color: white; box-shadow: 0 8px 24px rgba(var(--md-sys-color-error-rgb), 0.3); }
          .btn-action.btn-report:hover { transform: translateY(-2px); }
          .btn-action.btn-outline { background: var(--md-sys-color-surface-container); color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline); }
          .btn-action.btn-outline:hover { background: var(--md-sys-color-surface-container-high); }
        `,
          }}
        />

        <header className="top-bar">
          <div className="top-bar-content">
            <div className="biz-branding">
              <div className="biz-logo">
                {order.business.logoUrl ? (
                  <img
                    src={order.business.logoUrl}
                    alt={order.business.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 'inherit',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  order.business.name.charAt(0)
                )}
              </div>
              <div className="biz-info">
                <span className="biz-name">{order.business.name}</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '10px',
                    fontWeight: 900,
                    opacity: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Orden #{order.orderNumber || order.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="desktop-only">
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>
                  TOTAL PAGADO
                </p>
                <p style={{ margin: 0, fontWeight: 950, color: 'var(--md-sys-color-primary)' }}>
                  {order.currency} {order.amount}
                </p>
              </div>
              <a
                href="#details-modal"
                style={{
                  background: 'var(--md-sys-color-surface-container-highest)',
                  padding: '10px',
                  borderRadius: '14px',
                  color: 'inherit',
                }}
              >
                <Icon>receipt_long</Icon>
              </a>
              <LogoutButton token={token} businessSlug={slug} />
            </div>
          </div>
        </header>

        <main className="hub-container">
          <div
            className="left-side"
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div className="hub-card">
              <div
                className="status-badge"
                style={{ background: currentStatus.bgColor, color: currentStatus.color }}
              >
                <Icon size={18}>{currentStatus.icon}</Icon>
                {currentStatus.label}
              </div>

              <h2 className="hub-title">{currentStatus.label}</h2>
              <p className="hub-desc">{currentStatus.desc}</p>

              <div className="pro-timeline">
                <div className="pro-line" />
                <div
                  className="pro-line-fill"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((s, i) => (
                  <div key={i} className={`pro-step ${i <= currentStep ? 'active' : ''}`}>
                    <div className="pro-icon-box">
                      <Icon size={24}>{s.icon}</Icon>
                    </div>
                    <span className="pro-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* ── V2: Seller note ── */}
              {env.orderFlowV2 && order.sellerNote && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={20}>notes</Icon>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem', opacity: 0.6 }}>
                      NOTA DEL VENDEDOR
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{order.sellerNote}</p>
                  </div>
                </div>
              )}

              {/* ── V2: Timeline events ── */}
              {env.orderFlowV2 && <OrderV2Timeline orderId={order.id} />}

              {/* ── V2: Issue report button (for reportable V2 statuses) ── */}
              {env.orderFlowV2 &&
                ['WAITING_CUSTOMER_CONFIRMATION', 'READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED'].includes(
                  order.status,
                ) && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      background: 'var(--md-sys-color-error-container)',
                      borderRadius: '24px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <Icon size={24}>report_problem</Icon>
                      <div>
                        <p style={{ margin: 0, fontWeight: 950, fontSize: '0.9rem' }}>
                          ¿Tenés un problema con tu pedido?
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                          Reportalo y nos pondremos en contacto para resolverlo.
                        </p>
                      </div>
                    </div>
                    <a
                      href="#report-v2"
                      className="btn-hub btn-hub-s"
                      style={{
                        justifyContent: 'center',
                        background: 'var(--md-sys-color-error)',
                        color: 'white',
                      }}
                    >
                      <Icon>flag</Icon>
                      REPORTAR PROBLEMA
                    </a>
                  </div>
                )}

              {/* COMPLETED: Order dates receipt */}
              {order.status === 'completed' && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'var(--md-sys-color-surface)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    marginTop: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px dashed var(--md-sys-color-outline-variant)',
                    }}
                  >
                    <Icon size={18}>receipt_long</Icon>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 950,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--md-sys-color-on-surface-variant)',
                      }}
                    >
                      Comprobante de Transacción
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          opacity: 0.6,
                        }}
                      >
                        Fecha del Pedido
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: 'var(--md-sys-color-on-surface)',
                        }}
                      >
                        {order.createdAt ? formatDate(order.createdAt) : '—'}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          opacity: 0.6,
                        }}
                      >
                        Fecha de Finalización
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: 'var(--md-sys-color-tertiary)',
                        }}
                      >
                        {order.completedAt ? formatDate(order.completedAt) : '—'}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px dashed var(--md-sys-color-outline-variant)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon size={14} style={{ color: 'var(--md-sys-color-primary)' }}>
                      verified
                    </Icon>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--md-sys-color-on-surface-variant)',
                        opacity: 0.7,
                      }}
                    >
                      N° Orden: {order.orderNumber || '—'} · Pagado: {order.currency} {order.amount}
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION: Ticket Verification (when seller uploads, status = 'validando') */}
              {order.status === 'validando' && order.ticketImageUrl && (
                <div className="despacho-card pulse-active">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--md-sys-color-primary-container)',
                        color: 'var(--md-sys-color-on-primary-container)',
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon>description</Icon>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 950, fontSize: '0.9rem' }}>
                        Comprobante de Envío
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>
                        Subido por el vendedor — revisá y confirmá
                      </p>
                    </div>
                  </div>
                  <a href="#ticket-view" className="ticket-preview">
                    <img src={order.ticketImageUrl} alt="Ticket" />
                    <div className="ticket-overlay">
                      <div style={{ textAlign: 'center' }}>
                        <Icon size={32}>zoom_in</Icon>
                        <p style={{ fontWeight: 900, fontSize: '0.8rem', marginTop: '4px' }}>
                          AMPLIAR TICKET
                        </p>
                      </div>
                    </div>
                  </a>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a
                      href="#accept-confirm"
                      className="btn-hub btn-hub-p"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Icon>check_circle</Icon>
                      CONFIRMAR ENVÍO
                    </a>
                    <a
                      href="#report-form"
                      className="btn-hub btn-hub-s"
                      style={{
                        width: '60px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon>flag</Icon>
                    </a>
                  </div>
                </div>
              )}

              {/* ACTION: Disputed - Ticket was rejected, waiting for seller to re-upload */}
              {order.status === 'disputed' && (
                <div
                  className="despacho-card"
                  style={{
                    borderStyle: 'solid',
                    borderColor: 'var(--md-sys-color-error)',
                    background: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', textAlign: 'left' }}>
                    <Icon size={32}>report_problem</Icon>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem' }}>
                        Ticket Rechazado
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                        El vendedor fue notificado y debe subir un nuevo comprobante.
                      </p>
                    </div>
                  </div>
                  {order.ticketImageUrl && (
                    <>
                      <a href="#ticket-view" className="ticket-preview" style={{ height: 150 }}>
                        <img
                          src={order.ticketImageUrl}
                          alt="Ticket rechazado"
                          style={{ filter: 'grayscale(1) brightness(0.7)' }}
                        />
                        <div className="ticket-overlay" style={{ opacity: 1 }}>
                          <div style={{ textAlign: 'center' }}>
                            <Icon size={24}>cancel</Icon>
                            <p style={{ fontWeight: 900, fontSize: '0.75rem', marginTop: '4px' }}>
                              TICKET RECHAZADO
                            </p>
                          </div>
                        </div>
                      </a>
                      <a
                        href="#ticket-view"
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          opacity: 0.8,
                          textAlign: 'center',
                        }}
                      >
                        Ver ticket original
                      </a>
                    </>
                  )}
                </div>
              )}

              {/* ACTION: Finalization Confirm (delivery received) */}
              {(order.status as string) === 'en_reparto' && (
                <div
                  className="despacho-card pulse-active"
                  style={{
                    borderStyle: 'solid',
                    borderColor: 'var(--md-sys-color-secondary)',
                    background: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-on-secondary-container)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', textAlign: 'left' }}>
                    <Icon size={32}>home</Icon>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem' }}>
                        ¿Recibiste tu pedido?
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                        Confirmá que el producto llegó en buen estado. Si hay algún problema,
                        reportalo ahora.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <a
                      href="#confirm-finalize"
                      className="btn-hub btn-hub-p"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: 'var(--md-sys-color-secondary)',
                        color: 'white',
                      }}
                    >
                      <Icon>check_circle</Icon>
                      SÍ, LO RECIBÍ
                    </a>
                    <a
                      href="#report-finalize"
                      className="btn-hub btn-hub-s"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Icon>flag</Icon>
                      TENGO UN PROBLEMA
                    </a>
                  </div>
                </div>
              )}

              {/* Default Buttons if no specific card */}
              {!['validando', 'disputed', 'delivered', 'completed'].includes(order.status) &&
                currentStatus.actionLabel && (
                  <button className="btn-hub btn-hub-p pulse-active">
                    {currentStatus.actionLabel}
                    <Icon>arrow_forward</Icon>
                  </button>
                )}
            </div>

            <OrderGuide />
          </div>

          <div className="sticky-chat">
            <OrderChatSection
              businessName={order.business.name}
              businessId={order.business.id}
              paymentId={order.id}
              buyerEmail={order.buyerEmail}
              buyerName={null}
              buyerDni={order.buyerDni!}
              trackingToken={token}
            />
          </div>
        </main>

        {/* Reutilización de Modales con Style Clean */}
        <div id="ticket-view" className="modal-overlay">
          <div className="m-box">
            <div
              style={{
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <span style={{ fontWeight: 950, letterSpacing: '0.1em', fontSize: '0.75rem' }}>
                COMPROBANTE DE ENVÍO
              </span>
              <a href="#" style={{ color: 'inherit' }}>
                <Icon>close</Icon>
              </a>
            </div>
            <div
              style={{
                padding: '1rem',
                background: '#000',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {order.ticketImageUrl ? (
                <img
                  src={order.ticketImageUrl}
                  alt="Ticket"
                  style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>
                  <Icon>image_not_supported</Icon>
                  <p>No hay comprobante disponible</p>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              {order.ticketImageUrl && (
                <DownloadButton
                  imageUrl={order.ticketImageUrl}
                  fileName={`ticket-${order.orderNumber}.jpg`}
                  className="btn-hub btn-hub-p"
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Detalles de Compra */}
        <div id="details-modal" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '520px', padding: '2.5rem' }}>
            <a
              href="#"
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                color: 'inherit',
                zIndex: 10,
              }}
            >
              <Icon>close</Icon>
            </a>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 950,
                  margin: '0 0 0.25rem',
                  letterSpacing: '-0.03em',
                }}
              >
                Detalles de Compra
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  opacity: 0.5,
                  letterSpacing: '0.05em',
                }}
              >
                N° Orden: {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* ── Producto ── */}
              <div className="detail-row">
                <div
                  className="detail-icon"
                  style={{
                    background: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  <Icon>shopping_cart</Icon>
                </div>
                <div className="detail-body">
                  <span className="detail-label">PRODUCTO</span>
                  <span className="detail-value">{order.product.title}</span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <span className="detail-price">
                      {order.currency} {order.amount}
                    </span>
                    {order.shippingCost && Number(order.shippingCost) > 0 && (
                      <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                        + Envío: {order.currency} {order.shippingCost}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Estado y Fechas ── */}
              <div className="detail-row">
                <div
                  className="detail-icon"
                  style={{
                    background: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-secondary)',
                  }}
                >
                  <Icon>schedule</Icon>
                </div>
                <div className="detail-body">
                  <span className="detail-label">ESTADO Y FECHAS</span>
                  <div className="detail-grid">
                    <div>
                      <span className="detail-sub">Estado</span>
                      <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                        {currentStatus.label}
                      </span>
                    </div>
                    <div>
                      <span className="detail-sub">Comprado</span>
                      <span className="detail-value" style={{ fontSize: '0.8rem' }}>
                        {order.createdAt ? formatDate(order.createdAt) : '—'}
                      </span>
                    </div>
                    {order.completedAt && (
                      <div>
                        <span className="detail-sub">Finalizado</span>
                        <span className="detail-value" style={{ fontSize: '0.8rem' }}>
                          {formatDate(order.completedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Pago ── */}
              <div className="detail-row">
                <div
                  className="detail-icon"
                  style={{
                    background: 'var(--md-sys-color-tertiary-container)',
                    color: 'var(--md-sys-color-tertiary)',
                  }}
                >
                  <Icon>credit_card</Icon>
                </div>
                <div className="detail-body">
                  <span className="detail-label">PAGO</span>
                  <div className="detail-grid">
                    <div>
                      <span className="detail-sub">Método</span>
                      <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                        {order.paymentMethod === 'card'
                          ? 'Tarjeta'
                          : order.paymentMethod === 'yape'
                            ? 'Yape'
                            : order.paymentMethod === 'plin'
                              ? 'Plin'
                              : order.paymentMethod || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="detail-sub">Total</span>
                      <span
                        className="detail-value"
                        style={{ fontWeight: 950, color: 'var(--md-sys-color-primary)' }}
                      >
                        {order.currency} {Number(order.amount) + Number(order.shippingCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Envío ── */}
              <div className="detail-row">
                <div
                  className="detail-icon"
                  style={{
                    background: 'var(--md-sys-color-surface-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <Icon>local_shipping</Icon>
                </div>
                <div className="detail-body">
                  <span className="detail-label">ENVÍO</span>
                  <div className="detail-grid">
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-sub">Dirección</span>
                      <span className="detail-value">
                        {order.shippingAddress || 'Recojo en Tienda'}
                      </span>
                      {order.shippingDistrict && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>
                          {order.shippingDistrict}
                          {order.shippingProvince ? `, ${order.shippingProvince}` : ''}
                          {order.shippingDepartment ? `, ${order.shippingDepartment}` : ''}
                        </span>
                      )}
                    </div>
                    {order.shippingAgency && (
                      <div>
                        <span className="detail-sub">Agencia</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                          {order.shippingAgency}
                        </span>
                      </div>
                    )}
                    {order.shippingReference && (
                      <div>
                        <span className="detail-sub">Referencia</span>
                        <span className="detail-value">{order.shippingReference}</span>
                      </div>
                    )}
                    {/* ── V2: Courier / Tracking / Pickup (when available) ── */}
                    {env.orderFlowV2 && order.courierName && (
                      <div>
                        <span className="detail-sub">Courier</span>
                        <span className="detail-value">{order.courierName}</span>
                      </div>
                    )}
                    {env.orderFlowV2 && order.trackingNumber && (
                      <div>
                        <span className="detail-sub">N° Tracking</span>
                        <span className="detail-value" style={{ fontSize: '0.8rem' }}>
                          {order.trackingNumber}
                        </span>
                      </div>
                    )}
                    {env.orderFlowV2 && order.pickupCode && (
                      <div>
                        <span className="detail-sub">Código Recojo</span>
                        <span className="detail-value" style={{ fontWeight: 950 }}>
                          {order.pickupCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Contacto ── */}
              <div className="detail-row">
                <div
                  className="detail-icon"
                  style={{
                    background: 'var(--md-sys-color-surface-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <Icon>contact_mail</Icon>
                </div>
                <div className="detail-body">
                  <span className="detail-label">CONTACTO</span>
                  <div className="detail-grid">
                    <div>
                      <span className="detail-sub">Email</span>
                      <span className="detail-value" style={{ fontSize: '0.8rem' }}>
                        {order.buyerEmail}
                      </span>
                    </div>
                    {order.buyerPhone && (
                      <div>
                        <span className="detail-sub">Teléfono</span>
                        <span className="detail-value">{order.buyerPhone}</span>
                      </div>
                    )}
                    {order.buyerDni && (
                      <div>
                        <span className="detail-sub">DNI</span>
                        <span className="detail-value">{order.buyerDni}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Verificación ── */}
              {(() => {
                const metadata = order.metadata as Record<string, unknown> | null;
                const customerAuth = metadata?.customerAuth as Record<string, unknown> | null;
                const googleName = customerAuth?.name as string | undefined;
                const googleEmail = customerAuth?.email as string | undefined;
                const googlePicture = customerAuth?.picture as string | undefined;
                const isVerified = !!customerAuth;

                return (
                  <div className="detail-row">
                    <div
                      className="detail-icon"
                      style={{
                        background: isVerified
                          ? 'var(--md-sys-color-primary-container)'
                          : 'var(--md-sys-color-surface-variant)',
                        color: isVerified
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-on-surface-variant)',
                      }}
                    >
                      <Icon>{isVerified ? 'verified' : 'help_outline'}</Icon>
                    </div>
                    <div className="detail-body">
                      <span className="detail-label">VERIFICACIÓN</span>
                      {isVerified ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {googlePicture && (
                            <img
                              src={googlePicture}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div>
                            <span
                              className="detail-value"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Icon size={14} style={{ color: 'var(--md-sys-color-primary)' }}>
                                verified
                              </Icon>
                              Verificado con Google
                            </span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>
                              {googleName || googleEmail || 'Cuenta verificada'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="detail-value" style={{ opacity: 0.5 }}>
                            Sin verificar
                          </span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.4, display: 'block' }}>
                            No se usó autenticación con Google
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <style>{`
              .detail-row { display: flex; gap: 1rem; align-items: flex-start; }
              .detail-icon {
                width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
              }
              .detail-body { flex: 1; min-width: 0; }
              .detail-label {
                display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em;
                opacity: 0.5; margin-bottom: 4px; text-transform: uppercase;
              }
              .detail-value {
                display: block; font-weight: 800; font-size: 0.9rem;
                color: var(--md-sys-color-on-surface);
              }
              .detail-sub {
                display: block; font-size: 0.65rem; font-weight: 700;
                opacity: 0.5; margin-bottom: 1px;
              }
              .detail-price {
                font-weight: 950; font-size: 1rem;
                color: var(--md-sys-color-primary);
              }
              .detail-grid {
                display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem;
              }
              @media (max-width: 480px) {
                .detail-grid { grid-template-columns: 1fr; }
              }
            `}</style>
          </div>
        </div>

        {/* MODAL: Confirm Finalization - with spinner & success screen */}
        <ConfirmationFlow
          paymentId={order.id}
          trackingToken={token}
          businessName={order.business?.name || 'Store Lite'}
        />

        {/* MODAL: Report Problem — with spinner & success screen */}
        <ReportFlow paymentId={order.id} trackingToken={token} />

        {/* MODAL: V2 Issue Report — warning + typed reasons + OrderService submit */}
        {env.orderFlowV2 && (
          <ReportV2Flow paymentId={order.id} trackingToken={token} />
        )}
      </div>
    </OrderAuthGate>
  );
}
