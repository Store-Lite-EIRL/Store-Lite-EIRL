'use client';

import { Icon } from '@/shared/components/ui';
import { useState } from 'react';

interface OrderGuideProps {
  shippingType?: string | null;
}

export default function OrderGuide({ shippingType }: OrderGuideProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const isPickup = shippingType?.toLowerCase() === 'recojo';

  const deliverySections = [
    {
      title: 'Tu Compra está Protegida',
      icon: 'shield_check',
      content:
        'En Store Lite, la seguridad es nuestra prioridad. Tu pago se mantiene en un estado de validación hasta que el vendedor suba un comprobante real de envío. No confirmés la recepción hasta tener el producto en tus manos y verificar que todo esté en orden.',
    },
    {
      title: 'Cómo leer el Ticket de Envío',
      icon: 'receipt_long',
      content:
        'Cuando el vendedor suba el ticket (Olva, Shalom, etc.), revisá que el Número de Seguimiento sea legible y que el destino coincida con tu ciudad. Podés usar ese código en la web oficial del courier para rastrear el paquete en tiempo real.',
    },
    {
      title: 'Garantía de Satisfacción',
      icon: 'workspace_premium',
      content: (
        <div>
          <p style={{ margin: '0 0 1rem 0' }}>
            Si el producto llega dañado o no coincide con lo comprado:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, listStyle: 'disc' }}>
            <li>
              <b>No confirmés la entrega</b> en esta página.
            </li>
            <li>
              Usá el botón <b>&#39;Reportar Problema&#39;</b> inmediatamente.
            </li>
            <li>Chateá con el vendedor usando el panel lateral para resolverlo rápido.</li>
          </ul>
        </div>
      ),
    },
  ];

  const pickupSections = [
    {
      title: 'Tu Compra está Protegida',
      icon: 'shield_check',
      content:
        'En Store Lite, tu pago se mantiene en estado de validación hasta que el vendedor marque el pedido como listo para recojo y recibas el producto. Cuando pases por la tienda, revisá el producto antes de retirarte. No confirmes la recepción hasta tenerlo en tus manos y verificar que todo esté en orden.',
    },
    {
      title: 'Cómo Recoger en Tienda',
      icon: 'storefront',
      content:
        'Cuando el vendedor marque el pedido como listo, vas a ver un código de recojo en esta página. Andá a la tienda con tu DNI y mostrale el código al vendedor. Él va a verificar tus datos y entregarte el producto. Revisá que el producto esté en buen estado antes de retirarte.',
    },
    {
      title: 'Garantía de Satisfacción',
      icon: 'workspace_premium',
      content: (
        <div>
          <p style={{ margin: '0 0 1rem 0' }}>
            Si el producto está dañado o no coincide con lo comprado:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, listStyle: 'disc' }}>
            <li>
              <b>No confirmes la recepción</b> en esta página.
            </li>
            <li>
              Usá el botón <b>&#39;Reportar Problema&#39;</b> inmediatamente.
            </li>
            <li>Chateá con el vendedor usando el panel lateral para resolverlo rápido.</li>
          </ul>
        </div>
      ),
    },
  ];

  const sections = isPickup ? pickupSections : deliverySections;

  return (
    <div className="guide-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .guide-root { display: flex; flex-direction: column; gap: 1rem; }
        .g-item { 
          background: var(--md-sys-color-surface-container-low); 
          border: 1px solid var(--md-sys-color-outline-variant); 
          border-radius: 32px; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .g-item.open { border-color: var(--md-sys-color-primary); background: var(--md-sys-color-surface-container); box-shadow: var(--md-sys-elevation-level1); }
        .g-head { padding: 1.5rem 2rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
        .g-title { display: flex; align-items: center; gap: 1.25rem; font-weight: 950; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--md-sys-color-on-surface); }
        .g-item.open .g-title { color: var(--md-sys-color-primary); }
        .g-icon-box { 
          width: 40px; height: 40px; border-radius: 12px; 
          background: var(--md-sys-color-surface-container-highest); 
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
        }
        .g-item.open .g-icon-box { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-primary); }
        .g-content { padding: 0 2rem 2.5rem 5.75rem; font-size: 0.95rem; line-height: 1.6; color: var(--md-sys-color-on-surface-variant); animation: g-slide 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes g-slide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />

      <div
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          marginBottom: '0.5rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, letterSpacing: '-0.02em' }}>
          Guía de Seguridad
        </h3>
      </div>

      {sections.map((s, i) => (
        <div key={i} className={`g-item ${openIndex === i ? 'open' : ''}`}>
          <div className="g-head" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <div className="g-title">
              <div className="g-icon-box">
                <Icon size={24}>{s.icon}</Icon>
              </div>
              <span>{s.title}</span>
            </div>
            <Icon
              style={{
                transition: 'transform 0.3s',
                transform: openIndex === i ? 'rotate(180deg)' : 'none',
                opacity: 0.5,
              }}
            >
              expand_more
            </Icon>
          </div>
          {openIndex === i && <div className="g-content">{s.content}</div>}
        </div>
      ))}
    </div>
  );
}
