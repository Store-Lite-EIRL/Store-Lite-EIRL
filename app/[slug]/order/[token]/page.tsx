import { db } from '@/core/database/client';
import { payments } from '@/core/database/schema';
import { Icon } from '@/shared/components/ui';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type FormData } from 'react';
import {
  confirmFinalization,
  rejectFinalization,
} from '../../dashboard/actions/finalizationActions';
import ActionModals from './ActionModals';
import DownloadButton from './DownloadButton';
import OrderAuthGate from './OrderAuthGate';
import OrderChatSection from './OrderChatSection';
import OrderGuide from './OrderGuide';
import OrderRealtimeHandler from './OrderRealtimeHandler';

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

  const getStep = () => {
    if (order.status === 'pending') return 0;
    if (order.status === 'not_delivered' && order.ticketImageUrl) return 1;
    if (order.status === 'delivered') return 2;
    if (order.status === 'not_delivered') return 3; // Waiting for confirmation
    if (order.status === 'completed') return 4;
    if (order.status === 'disputed') return 1; // Rejected complaint
    return 0;
  };

  const currentStep = getStep();

  const statusMap: Record<
    string,
    { label: string; icon: string; color: string; bgColor: string; desc: string; actionLabel?: string }
  > = {
    pending: {
      label: 'Preparando Pedido',
      icon: 'inventory_2',
      color: 'var(--md-sys-color-on-warning-container)',
      bgColor: 'var(--md-sys-color-warning-container)',
      desc: 'El vendedor ha recibido tu pedido y está alistando los productos para el despacho.',
    },
    not_delivered: {
      label: order.ticketImageUrl ? 'Validar Comprobante' : 'En Espera de Ticket',
      icon: order.ticketImageUrl ? 'fact_check' : 'hourglass_top',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: order.ticketImageUrl
        ? '¡Buenas noticias! El vendedor ya gestionó el despacho. Por favor, verificá el ticket adjunto.'
        : 'El despacho está en proceso. En cuanto el vendedor suba el ticket de la agencia, aparecerá aquí.',
      actionLabel: order.ticketImageUrl ? 'REVISAR TICKET' : undefined
    },
    delivered: {
      label: 'Pedido en Camino',
      icon: 'local_shipping',
      color: 'var(--md-sys-color-on-tertiary-container)',
      bgColor: 'var(--md-sys-color-tertiary-container)',
      desc: '¡Todo listo! Tu paquete ya fue entregado al courier y se encuentra en ruta hacia tu destino.',
    },
    completed: {
      label: 'Compra Finalizada',
      icon: 'verified',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: '¡Excelente! La transacción se completó exitosamente. ¡Gracias por confiar en nosotros!',
    },
    disputed: {
      label: 'Observación en Ticket',
      icon: 'report_problem',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'Has reportado un inconveniente con el comprobante. El vendedor debe corregirlo para continuar.',
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
    <OrderAuthGate token={token} businessName={order.business.name}>
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
          @keyframes m-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `,
          }}
        />

        <header className="top-bar">
          <div className="top-bar-content">
            <div className="biz-branding">
              <div className="biz-logo">
                {order.business.logoUrl ? (
                  <img src={order.business.logoUrl} alt={order.business.name} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                ) : (
                  order.business.name.charAt(0)
                )}
              </div>
              <div className="biz-info">
                <span className="biz-name">{order.business.name}</span>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>
                  Orden #{order.orderNumber || order.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div style={{ textAlign: 'right', display: 'none' }} className="desktop-only">
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>TOTAL PAGADO</p>
                  <p style={{ margin: 0, fontWeight: 950, color: 'var(--md-sys-color-primary)' }}>{order.currency} {order.amount}</p>
               </div>
               <a href="#details-modal" style={{ 
                 background: 'var(--md-sys-color-surface-container-highest)', 
                 padding: '10px', borderRadius: '14px', color: 'inherit' 
               }}>
                 <Icon>receipt_long</Icon>
               </a>
            </div>
          </div>
        </header>

        <main className="hub-container">
          <div className="left-side" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="hub-card">
              <div className="status-badge" style={{ background: currentStatus.bgColor, color: currentStatus.color }}>
                <Icon size={18}>{currentStatus.icon}</Icon>
                {currentStatus.label}
              </div>

              <h2 className="hub-title">{currentStatus.label}</h2>
              <p className="hub-desc">{currentStatus.desc}</p>

              <div className="pro-timeline">
                <div className="pro-line" />
                <div className="pro-line-fill" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
                {steps.map((s, i) => (
                  <div key={i} className={`pro-step ${i <= currentStep ? 'active' : ''}`}>
                    <div className="pro-icon-box">
                      <Icon size={24}>{s.icon}</Icon>
                    </div>
                    <span className="pro-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* ACTION: Ticket View */}
              {order.status === 'analizando' && order.ticketImageUrl && (
                <div className="despacho-card pulse-active">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                    <div style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon>description</Icon>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 950, fontSize: '0.9rem' }}>Ticket de Despacho</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Subido por el vendedor</p>
                    </div>
                  </div>
                  <a href="#ticket-view" className="ticket-preview">
                    <img src={order.ticketImageUrl} alt="Ticket" />
                    <div className="ticket-overlay">
                      <div style={{ textAlign: 'center' }}>
                        <Icon size={32}>zoom_in</Icon>
                        <p style={{ fontWeight: 900, fontSize: '0.8rem', marginTop: '4px' }}>AMPLIAR TICKET</p>
                      </div>
                    </div>
                  </a>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a href="#accept-confirm" className="btn-hub btn-hub-p" style={{ flex: 1, justifyContent: 'center' }}>
                      ACEPTAR ENVÍO
                    </a>
                    <a href="#report-form" className="btn-hub btn-hub-s" style={{ width: '60px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon>flag</Icon>
                    </a>
                  </div>
                </div>
              )}

              {/* ACTION: Finalization Confirm */}
              {order.status === 'esperando_confirmacion' && (
                <div className="despacho-card" style={{ borderStyle: 'solid', borderColor: 'var(--md-sys-color-tertiary)', background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                   <div style={{ display: 'flex', gap: '1rem', textAlign: 'left' }}>
                     <Icon size={32}>info</Icon>
                     <div>
                       <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem' }}>¿Ya recibiste tu producto?</h3>
                       <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Confirmá para liberar el pago al vendedor. Si tenés un problema, reportalo ahora.</p>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <a href="#confirm-finalize" className="btn-hub btn-hub-p" style={{ flex: 1, justifyContent: 'center', background: 'var(--md-sys-color-tertiary)', color: 'white' }}>
                      SÍ, LO RECIBÍ
                    </a>
                    <a href="#report-finalize" className="btn-hub btn-hub-s" style={{ flex: 1, justifyContent: 'center' }}>
                      TENGO UN PROBLEMA
                    </a>
                  </div>
                </div>
              )}

              {/* Default Buttons if no specific card */}
              {!['analizando', 'esperando_confirmacion'].includes(order.status) && currentStatus.actionLabel && (
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
             <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <span style={{ fontWeight: 950, letterSpacing: '0.1em', fontSize: '0.75rem' }}>COMPROBANTE DE ENVÍO</span>
                <a href="#" style={{ color: 'inherit' }}><Icon>close</Icon></a>
             </div>
             <div style={{ padding: '1rem', background: '#000', display: 'flex', justifyContent: 'center' }}>
                <img src={order.ticketImageUrl || ''} alt="Ticket" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
             </div>
             <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <DownloadButton imageUrl={order.ticketImageUrl || ''} fileName={`ticket-${order.orderNumber}.jpg`} className="btn-hub btn-hub-p" />
             </div>
          </div>
        </div>

        {/* Modal Detalles Detallado */}
        <div id="details-modal" className="modal-overlay">
           <div className="m-box" style={{ maxWidth: '500px', padding: '3rem' }}>
              <a href="#" style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'inherit' }}><Icon>close</Icon></a>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '2rem', letterSpacing: '-0.03em' }}>Detalles de Compra</h3>
              
              <div style={{ display: 'grid', gap: '2rem' }}>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--md-sys-color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)' }}>
                       <Icon>shopping_cart</Icon>
                    </div>
                    <div>
                       <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>PRODUCTO</p>
                       <p style={{ margin: 0, fontWeight: 800 }}>{order.product.title}</p>
                       <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--md-sys-color-primary)', fontWeight: 900 }}>{order.currency} {order.amount}</p>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--md-sys-color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-secondary)' }}>
                       <Icon>location_on</Icon>
                    </div>
                    <div>
                       <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>DIRECCIÓN DE ENTREGA</p>
                       <p style={{ margin: 0, fontWeight: 800 }}>{order.shippingAddress || 'Recojo en Tienda'}</p>
                       <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{order.shippingDistrict ? `${order.shippingDistrict}, ${order.shippingProvince}` : ''}</p>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--md-sys-color-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-tertiary)' }}>
                       <Icon>person</Icon>
                    </div>
                    <div>
                       <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>COMPRADOR</p>
                       <p style={{ margin: 0, fontWeight: 800 }}>{order.buyerEmail}</p>
                       <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>DNI: {order.buyerDni || 'No registrado'}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* MODAL: Confirm Finalization - CRITICAL WARNING */}
        <div id="confirm-finalize" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '500px', padding: '3rem' }}>
            <a href="#" style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'inherit' }}><Icon>close</Icon></a>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '3px solid var(--md-sys-color-error)' }}>
                <Icon size={40}>warning</Icon>
              </div>
              <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 950, color: 'var(--md-sys-color-error)' }}>¡ATENCIÓN!</h2>
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>¿Confirmás que ya tenés el producto y todo está correcto?</p>
            
            <div style={{ background: 'var(--md-sys-color-surface-container-highest)', padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
               <p style={{ margin: 0 }}>Al confirmar, el pedido se marcará como <b>Finalizado</b> y el vendedor recibirá su pago. Esta acción no se puede revertir.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <form action={async () => { 'use server'; await confirmFinalization(order.id, token); }}>
                <button type="submit" className="btn-hub btn-hub-p" style={{ width: '100%', justifyContent: 'center' }}>SÍ, TODO CORRECTO</button>
              </form>
              <a href="#report-finalize" className="btn-hub btn-hub-s" style={{ width: '100%', justifyContent: 'center' }}>NO, TENGO UN PROBLEMA</a>
            </div>
          </div>
        </div>

        {/* MODAL: Report Problem */}
        <div id="report-finalize" className="modal-overlay">
           <div className="m-box" style={{ maxWidth: '500px', padding: '3rem' }}>
              <a href="#" style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'inherit' }}><Icon>close</Icon></a>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '1rem' }}>Reportar Problema</h3>
              <p style={{ marginBottom: '2rem', opacity: 0.7 }}>Tu reporte será enviado al vendedor para su revisión.</p>

              <form action={async (formData: FormData) => { 'use server'; const reason = formData.get('reason') as string; await rejectFinalization(order.id, token, reason); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <textarea name="reason" placeholder="Describí el problema con detalle..." required style={{ width: '100%', minHeight: '150px', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface)', fontSize: '1rem' }} />
                 <button type="submit" className="btn-hub btn-hub-s" style={{ width: '100%', justifyContent: 'center' }}>ENVIAR REPORTE</button>
              </form>
           </div>
        </div>

      </div>
    </OrderAuthGate>
  );
}
