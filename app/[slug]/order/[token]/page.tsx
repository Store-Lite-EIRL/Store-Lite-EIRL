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
    if (order.status === 'pendiente') return 0;
    if (order.status === 'analizando' && order.ticketImageUrl) return 1;
    if (order.status === 'aceptado') return 2;
    if (order.status === 'esperando_confirmacion') return 3; // Almost done, waiting for customer
    if (order.status === 'finalizado') return 3;
    if (order.status === 'rechazado') return 1;
    return 0;
  };

  const currentStep = getStep();

  const statusMap: Record<
    string,
    { label: string; icon: string; color: string; bgColor: string; desc: string }
  > = {
    pendiente: {
      label: 'Pago Recibido',
      icon: 'payments',
      color: 'var(--md-sys-color-on-warning-container)',
      bgColor: 'var(--md-sys-color-warning-container)',
      desc: 'Tu pago directo ha sido recibido. El vendedor está preparando tu paquete.',
    },
    analizando: {
      label: order.ticketImageUrl ? 'Validar Envío' : 'Esperando Despacho',
      icon: order.ticketImageUrl ? 'fact_check' : 'hourglass_top',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: order.ticketImageUrl
        ? 'El vendedor subió el ticket. Revisa el nro. de seguimiento antes de aceptar.'
        : 'El vendedor está gestionando el despacho. El ticket aparecerá aquí pronto.',
    },
    aceptado: {
      label: 'En Camino',
      icon: 'local_shipping',
      color: 'var(--md-sys-color-on-tertiary-container)',
      bgColor: 'var(--md-sys-color-tertiary-container)',
      desc: '¡Confirmado! Tu paquete ya se encuentra rumbo a tu dirección.',
    },
    // NUEVO: Estado para finalización solicitada por el vendedor
    esperando_confirmacion: {
      label: 'Esperando Confirmación',
      icon: 'hourglass_empty',
      color: 'var(--md-sys-color-on-primary-container)',
      bgColor: 'var(--md-sys-color-primary-container)',
      desc: 'El vendedor ha marcado este pedido como finalizado. ¡Revisá que tengas el producto en tus manos!',
    },
    finalizado: {
      label: 'Entregado',
      icon: 'verified',
      color: 'var(--md-sys-color-on-secondary-container)',
      bgColor: 'var(--md-sys-color-secondary-container)',
      desc: '¡Compra finalizada con éxito!',
    },
    rechazado: {
      label: 'Observación',
      icon: 'report_problem',
      color: 'var(--md-sys-color-on-error-container)',
      bgColor: 'var(--md-sys-color-error-container)',
      desc: 'Has reportado un problema con el ticket. Esperando corrección del vendedor.',
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
    { label: 'PEDIDO', icon: 'shopping_cart' },
    { label: 'VALIDANDO', icon: 'fact_check' },
    { label: 'ENVÍO', icon: 'local_shipping' },
    { label: 'CERRADO', icon: 'verified' },
  ];

  return (
    <OrderAuthGate token={token} businessName={order.business.name}>
      <div className="order-root">
        <OrderRealtimeHandler orderId={order.id} />
        <ActionModals paymentId={order.id} trackingToken={token} orderNumber={order.orderNumber} />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .order-root { min-height: 100vh; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-family: var(--mio-theme-text-font-family), sans-serif; overflow-x: hidden; }
          .top-rectangle { position: sticky; top: 0; z-index: 100; padding: 0.5rem; background: var(--md-sys-color-surface); }
          
          .header-bar { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: var(--md-sys-color-surface-container-high); 
            border: 1px solid var(--md-sys-color-outline-variant); 
            border-radius: 20px; 
            padding: 0.75rem 1rem; 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            box-shadow: var(--md-sys-elevation-level1);
            width: 100%;
            box-sizing: border-box;
          }

          .header-client-info {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-right: 1rem;
            border-right: 1px solid var(--md-sys-color-outline-variant);
            min-width: 0; /* Permite que el texto se trunque si es necesario */
          }

          .header-order-info {
            display: flex;
            gap: 8px;
            flex: 1;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .header-order-info::-webkit-scrollbar { display: none; }

          .btn-details {
            background: var(--md-sys-color-secondary-container);
            color: var(--md-sys-color-on-secondary-container);
            padding: 8px 16px;
            border-radius: 100px;
            font-weight: 900;
            text-decoration: none;
            font-size: 0.7rem;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          @media (max-width: 768px) {
            .header-bar { gap: 0.5rem; padding: 0.5rem; }
            .header-client-info { border-right: none; padding-right: 0.5rem; }
            .header-client-info .client-name { display: none; }
            .header-order-info { gap: 4px; }
            .info-pill-text { display: none; }
            .btn-details span { display: none; }
            .btn-details { padding: 8px; }
          }

          .main-content { max-width: 1200px; margin: 0 auto; padding: 1rem; display: grid; grid-template-columns: 1fr; gap: 2rem; }
          @media (min-width: 1024px) { .main-content { grid-template-columns: 7fr 5fr; } }
          
          .interaction-card { position: relative; background: var(--md-sys-color-surface-container-low); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 32px; padding: 2rem; overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center; min-height: 480px; justify-content: center; }
          @media (min-width: 768px) { .interaction-card { padding: 3rem; border-radius: 40px; } }

          .bg-blur { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(15px) brightness(0.8); opacity: 0.3; z-index: 0; transform: scale(1.05); }
          .card-fg { position: relative; z-index: 1; width: 100%; }

          .timeline { display: flex; justify-content: space-between; width: 100%; max-width: 500px; margin: 0 auto 3rem; position: relative; }
          .t-line { position: absolute; top: 20px; left: 0; right: 0; height: 3px; background: var(--md-sys-color-outline-variant); z-index: 0; }
          .t-line-active { position: absolute; top: 20px; left: 0; height: 3px; background: var(--md-sys-color-primary); z-index: 1; transition: width 0.8s ease; }
          .step { z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; }
          .s-circle { width: 42px; height: 42px; border-radius: 50%; background: var(--md-sys-color-surface-container-highest); border: 2px solid var(--md-sys-color-outline-variant); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
          @media (min-width: 768px) { .s-circle { width: 52px; height: 52px; border-width: 3px; } }
          .s-circle.active { background: var(--md-sys-color-primary); border-color: var(--md-sys-color-primary); color: white; box-shadow: 0 0 15px rgba(var(--md-sys-color-primary-rgb), 0.4); }
          .s-label { font-size: 8px; font-weight: 900; color: var(--md-sys-color-on-surface-variant); text-transform: uppercase; }
          @media (min-width: 768px) { .s-label { font-size: 10px; } }

          .btn-group { display: flex; flex-direction: column; gap: 1rem; width: 100%; margin-top: 2.5rem; }
          @media (min-width: 640px) { .btn-group { flex-direction: row; justify-content: center; } }
          .btn-main { border: none; padding: 1rem 2rem; border-radius: 100px; font-weight: 900; text-transform: uppercase; cursor: pointer; letter-spacing: 0.1em; transition: all 0.2s ease; }
          .btn-p { background: var(--md-sys-color-primary); color: white; }
          .btn-e { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
          
          .chat-sidebar { height: calc(100vh - 140px); position: sticky; top: 100px; }
          @media (max-width: 1023px) { .chat-sidebar { height: 500px; position: static; } }

          .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; align-items: center; justify-content: center; padding: 1rem; }
          .modal-overlay:target { display: flex; }
          .m-box { background: white; border-radius: 28px; width: 100%; max-width: 700px; overflow: hidden; position: relative; animation: m-up 0.3s ease; }
        `,
          }}
        />

        <header className="top-rectangle">
          <div className="header-bar">
            <div className="header-client-info">
              <div
                style={{
                  background: 'var(--md-sys-color-secondary)',
                  color: 'white',
                  padding: '6px',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <Icon size={20}>person</Icon>
              </div>
              <div className="client-name">
                <h1
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                >
                  {order.buyerEmail.split('@')[0]}
                </h1>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, opacity: 0.6 }}>
                  DNI: {order.buyerDni || '---'}
                </p>
              </div>
            </div>

            <div className="header-order-info">
              <div
                style={{
                  background: 'var(--md-sys-color-surface-container-highest)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: 'var(--md-sys-color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon size={14}>shopping_bag</Icon>
                <span className="info-pill-text">ORDEN</span>
                <span style={{ opacity: 0.7 }}>#{order.orderNumber || order.id.slice(0, 6)}</span>
              </div>
              <div
                style={{
                  background: 'var(--md-sys-color-primary-container)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: 'var(--md-sys-color-on-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon size={14}>payments</Icon>
                <span>
                  {order.currency} {order.amount}
                </span>
              </div>
            </div>

            <a href="#details-modal" className="btn-details">
              <Icon size={16}>receipt_long</Icon>
              <span>DETALLES</span>
            </a>
          </div>
        </header>

        <main className="main-content">
          <div
            className="left-col"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div className="interaction-card">
              {order.ticketImageUrl && (
                <div
                  className="bg-blur"
                  style={{ backgroundImage: `url(${order.ticketImageUrl})` }}
                />
              )}
              <div className="card-fg">
                <div className="timeline">
                  <div className="t-line" />
                  <div
                    className="t-line-active"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                  {steps.map((s, i) => (
                    <div key={i} className="step">
                      <div className={`s-circle ${i <= currentStep ? 'active' : ''}`}>
                        <Icon size={currentStep >= i ? 20 : 16}>{s.icon}</Icon>
                      </div>
                      <span className={`s-label ${i <= currentStep ? 'active' : ''}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background: currentStatus.bgColor,
                    color: currentStatus.color,
                    width: 72,
                    height: 72,
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  }}
                >
                  <Icon size={36}>{currentStatus.icon}</Icon>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 950, margin: '0 0 1rem 0' }}>
                  {currentStatus.label}
                </h2>
                <p
                  style={{
                    maxWidth: '440px',
                    margin: '0 auto',
                    fontSize: '0.95rem',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    lineHeight: 1.5,
                  }}
                >
                  {currentStatus.desc}
                </p>

                {/* BANNER: Finalization Requested by Seller */}
                {order.status === 'esperando_confirmacion' && (
                  <div
                    style={{
                      background: 'var(--md-sys-color-tertiary-container)',
                      color: 'var(--md-sys-color-on-tertiary-container)',
                      padding: '1.5rem',
                      borderRadius: '20px',
                      maxWidth: '500px',
                      margin: '1.5rem auto',
                      textAlign: 'left',
                      border: '1px solid var(--md-sys-color-tertiary)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <Icon size={24}>warning</Icon>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                        ¡Atención! Finalización Solicitada
                      </h3>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', lineHeight: 1.4 }}>
                      El vendedor ha marcado este pedido como finalizado.
                      <strong>
                        ¡Solo confirmés si ya tenés el producto en tus manos y todo está correcto!
                      </strong>
                    </p>
                    {order.finalizationDeadline && (
                      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                        Tenés hasta el{' '}
                        <strong>
                          {new Date(order.finalizationDeadline).toLocaleDateString('es-PE')}
                        </strong>{' '}
                        para responder.
                      </p>
                    )}
                  </div>
                )}

                {/* BUTTONS: Finalization Flow for Customer */}
                {order.status === 'esperando_confirmacion' && (
                  <div className="btn-group">
                    <a href="#confirm-finalize" className="btn-main btn-p">
                      SÍ, YA TENGO EL PRODUCTO
                    </a>
                    <a href="#report-finalize" className="btn-main btn-e">
                      NO, TENGO UN PROBLEMA
                    </a>
                  </div>
                )}

                {order.status === 'analizando' && order.ticketImageUrl && (
                  <div className="btn-group">
                    <a href="#accept-confirm" className="btn-main btn-p">
                      Aceptar Envío
                    </a>
                    <a href="#report-form" className="btn-main btn-e">
                      Reportar
                    </a>
                  </div>
                )}

                {order.ticketImageUrl && (
                  <a
                    href="#ticket-view"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      marginTop: '2rem',
                      textDecoration: 'none',
                      color: 'var(--md-sys-color-primary)',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                    }}
                  >
                    <Icon size={20}>visibility</Icon> VER TICKET DE COURIER
                  </a>
                )}
              </div>
            </div>

            <OrderGuide />
          </div>

          <div className="chat-sidebar">
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

        <div id="ticket-view" className="modal-overlay">
          <div className="m-box">
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 900, fontSize: '0.75rem' }}>COMPROBANTE OFICIAL</span>
              <a href="#" style={{ color: 'inherit' }}>
                <Icon>close</Icon>
              </a>
            </div>
            <div className="img-prev">
              <img src={order.ticketImageUrl || ''} alt="Ticket" />
            </div>
            <div style={{ padding: '1rem', textAlign: 'center', background: '#f9f9f9' }}>
              <DownloadButton
                imageUrl={order.ticketImageUrl || ''}
                fileName={`ticket-${order.orderNumber}.jpg`}
                className="btn-main btn-p"
              />
            </div>
          </div>
        </div>

        <div id="details-modal" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '400px', padding: '2rem' }}>
            <a
              href="#"
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'inherit' }}
            >
              <Icon>close</Icon>
            </a>
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.25rem' }}>
              Detalles del Pedido
            </h3>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>COMPRADOR</span>
                <p style={{ margin: 0, fontWeight: 700 }}>{order.buyerEmail}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>DNI: {order.buyerDni || '---'}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.5 }}>ENTREGA</span>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {order.shippingAddress || 'Recojo en tienda'}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  {order.shippingDistrict
                    ? `${order.shippingDistrict}, ${order.shippingProvince}`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Confirm Finalization - CRITICAL WARNING */}
        <div id="confirm-finalize" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '500px', padding: '2.5rem' }}>
            <a
              href="#"
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'inherit' }}
            >
              <Icon>close</Icon>
            </a>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  border: '3px solid var(--md-sys-color-error)',
                  animation: 'pulse 2s infinite',
                }}
              >
                <Icon size={40}>warning</Icon>
              </div>
              <h2
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '1.5rem',
                  fontWeight: 950,
                  color: 'var(--md-sys-color-error)',
                }}
              >
                ¡ADVERTENCIA CRÍTICA!
              </h2>
            </div>

            <div
              style={{
                background: 'var(--md-sys-color-tertiary-container)',
                color: 'var(--md-sys-color-on-tertiary-container)',
                padding: '1.25rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                border: '1px solid var(--md-sys-color-tertiary)',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '0.9rem' }}>
                <Icon size={16}>error</Icon> LEE CUIDADOSAMENTE ANTES DE CONFIRMAR
              </p>
              <ul
                style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: 1.6 }}
              >
                <li>Confirmás que el producto llegó correctamente a tus manos</li>
                <li>Confirmás que el producto está en perfectas condiciones</li>
                <li>
                  <strong>Esta acción NO se puede deshacer</strong>
                </li>
                <li>
                  Una vez confirmado, el vendedor recibirá su pago y el pedido se dará por
                  FINALIZADO
                </li>
              </ul>
            </div>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                margin: '0 0 1.5rem',
              }}
            >
              ¿Realmente ya tenés el producto y todo está bien?
            </p>

            <div className="btn-group">
              <form
                action={async () => {
                  'use server';
                  await confirmFinalization(order.id, token);
                }}
              >
                <button
                  type="submit"
                  className="btn-main btn-p"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  SÍ, YA TENGO EL PRODUCTO Y TODO BIEN
                </button>
              </form>
              <a
                href="#report-finalize"
                className="btn-main btn-e"
                style={{ width: '100%', textAlign: 'center' }}
              >
                NO, TENGO UN PROBLEMA
              </a>
            </div>
          </div>
        </div>

        {/* MODAL: Report Problem in Finalization */}
        <div id="report-finalize" className="modal-overlay">
          <div className="m-box" style={{ maxWidth: '500px', padding: '2.5rem' }}>
            <a
              href="#"
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'inherit' }}
            >
              <Icon>close</Icon>
            </a>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <Icon size={40}>report_problem</Icon>
              </div>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 950 }}>
                Reportar Problema con el Pedido
              </h2>
            </div>

            <div
              style={{
                background: 'var(--md-sys-color-surface-container-low)',
                padding: '1.25rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
                El vendedor ha marcado este pedido como finalizado.
                <strong>Si tenés un problema, reportalo AHORA</strong> antes de que se finalice
                automáticamente.
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Tenés hasta el{' '}
                <strong>
                  {order.finalizationDeadline
                    ? new Date(order.finalizationDeadline).toLocaleDateString('es-PE')
                    : '---'}
                </strong>{' '}
                para responder.
              </p>
            </div>

            <form
              action={async (formData: FormData) => {
                'use server';
                const reason = formData.get('reason') as string;
                await rejectFinalization(order.id, token, reason);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <textarea
                name="reason"
                placeholder="Describí el problema (ej: el producto llegó roto, no llegó, es diferente al describido...)"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  background: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
              <button type="submit" className="btn-main btn-e" style={{ cursor: 'pointer' }}>
                ENVIAR REPORTE
              </button>
            </form>
            <a
              href="#"
              style={{
                textAlign: 'center',
                display: 'block',
                marginTop: '1rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: '0.8rem',
              }}
            >
              Cancelar
            </a>
          </div>
        </div>
      </div>
    </OrderAuthGate>
  );
}
