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
import ReportFlow from './ReportFlow';

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
    if (order.status === 'pending') return 0;
    if (order.status === 'validando') return 1;
    if (order.status === 'delivered') return 2;
    if (order.status === 'en_reparto') return 3; // Pedido llegó, customer debe confirmar recepción
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
              {order.status === 'en_reparto' && (
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

        {/* Modal Detalles Detallado */}
        <div id="details-modal" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '500px', padding: '3rem' }}>
            <a
              href="#"
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'inherit' }}
            >
              <Icon>close</Icon>
            </a>
            <h3
              style={{
                fontSize: '1.75rem',
                fontWeight: 950,
                marginBottom: '2rem',
                letterSpacing: '-0.03em',
              }}
            >
              Detalles de Compra
            </h3>

            <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'var(--md-sys-color-primary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  <Icon>shopping_cart</Icon>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>
                    PRODUCTO
                  </p>
                  <p style={{ margin: 0, fontWeight: 800 }}>{order.product.title}</p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'var(--md-sys-color-primary)',
                      fontWeight: 900,
                    }}
                  >
                    {order.currency} {order.amount}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'var(--md-sys-color-secondary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--md-sys-color-secondary)',
                  }}
                >
                  <Icon>location_on</Icon>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>
                    DIRECCIÓN DE ENTREGA
                  </p>
                  <p style={{ margin: 0, fontWeight: 800 }}>
                    {order.shippingAddress || 'Recojo en Tienda'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                    {order.shippingDistrict
                      ? `${order.shippingDistrict}, ${order.shippingProvince}`
                      : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'var(--md-sys-color-tertiary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--md-sys-color-tertiary)',
                  }}
                >
                  <Icon>person</Icon>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>
                    COMPRADOR
                  </p>
                  <p style={{ margin: 0, fontWeight: 800 }}>{order.buyerEmail}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                    DNI: {order.buyerDni || 'No registrado'}
                  </p>
                </div>
              </div>
            </div>
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
      </div>
    </OrderAuthGate>
  );
}
