'use client';

import { Icon } from '@/shared/components/ui';
import { useState } from 'react';

export default function OrderGuide() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sections = [
    {
      title: 'Guía de Seguridad',
      icon: 'verified_user',
      content:
        '¡Atención! Tu pago fue realizado directamente al vendedor. Para asegurar tu compra, el vendedor debe subir un ticket de envío real. No confirmes el envío hasta que hayas verificado el número de seguimiento en la web oficial del courier (Olva, Shalom, etc.).',
    },
    {
      title: 'Significado del Flujo',
      icon: 'alt_route',
      content: (
        <ul style={{ paddingLeft: '1.25rem', margin: 0, listStyle: 'disc' }}>
          <li>
            <b>PEDIDO:</b> Estamos preparando tus productos.
          </li>
          <li>
            <b>VALIDANDO:</b> Revisa el ticket subido por el vendedor.
          </li>
          <li>
            <b>ENVÍO:</b> El paquete está en manos del courier.
          </li>
          <li>
            <b>CERRADO:</b> Producto recibido y satisfacción confirmada.
          </li>
        </ul>
      ),
    },
    {
      title: '¿Cómo validar con el Courier?',
      icon: 'local_shipping',
      content:
        'Copia el código de seguimiento que aparece en el ticket y búscalo en la plataforma oficial del courier elegido por el vendedor. Verifica que el destino coincida con tu dirección.',
    },
  ];

  return (
    <div className="guide-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .guide-root { display: flex; flex-direction: column; gap: 1rem; }
        .g-item { background: var(--md-sys-color-surface-container-lowest); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 24px; overflow: hidden; transition: all 0.3s ease; }
        .g-item.open { border-color: var(--md-sys-color-primary); background: var(--md-sys-color-surface-container-low); }
        .g-head { padding: 1.5rem 2rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
        .g-title { display: flex; align-items: center; gap: 1rem; font-weight: 900; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--md-sys-color-on-surface-variant); }
        .g-item.open .g-title { color: var(--md-sys-color-primary); }
        .g-content { padding: 0 2rem 2rem 4.5rem; font-size: 0.9rem; line-height: 1.6; color: var(--md-sys-color-on-surface-variant); animation: g-slide 0.3s ease-out; }
        @keyframes g-slide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />

      {sections.map((s, i) => (
        <div key={i} className={`g-item ${openIndex === i ? 'open' : ''}`}>
          <div className="g-head" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <div className="g-title">
              <Icon size={24}>{s.icon}</Icon>
              <span>{s.title}</span>
            </div>
            <Icon
              style={{
                transition: 'transform 0.3s',
                transform: openIndex === i ? 'rotate(180deg)' : 'none',
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
