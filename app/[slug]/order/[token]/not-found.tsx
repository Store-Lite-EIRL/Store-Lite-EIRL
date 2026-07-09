'use client';

import { Icon } from '@/shared/components/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useInsertionEffect, useState } from 'react';

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Inject keyframes and utility styles that can't be done via inline styles */
function useNotFoundStyles() {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes nf-pulse {
        0%, 100% { transform: scale(1); opacity: 0.08; }
        50% { transform: scale(1.15); opacity: 0.15; }
      }
      .nf-btn-primary:active { transform: scale(0.97) !important; }
      .nf-btn-secondary:active { transform: scale(0.97) !important; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

export default function OrderNotFound() {
  const params = useParams();
  const slug = params?.slug as string;
  const mounted = useMounted();
  useNotFoundStyles();

  return (
    <div
      className="not-found-root"
      style={{
        minHeight: '100dvh',
        background: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
        fontFamily: 'var(--mio-theme-text-font-family), sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* ── Main Card ── */}
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--md-sys-color-surface-container-low)',
          borderRadius: '40px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          position: 'relative',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition:
            'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Icon ── */}
        <div
          style={{
            position: 'relative',
          }}
        >
          {/* Glow behind icon */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--md-sys-color-error) 0%, transparent 70%)',
              opacity: 0.08,
              animation: mounted ? 'nf-pulse 3s ease-in-out infinite' : 'none',
            }}
          />
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '28px',
              background:
                'linear-gradient(135deg, var(--md-sys-color-error-container), var(--md-sys-color-error))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow:
                '0 12px 32px color-mix(in srgb, var(--md-sys-color-error) 25%, transparent)',
              position: 'relative',
            }}
          >
            <Icon size={44}>search_off</Icon>
          </div>
        </div>

        {/* ── Text ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 950,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Orden no encontrada
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--md-sys-color-on-surface-variant)',
              maxWidth: '340px',
              textWrap: 'pretty',
            }}
          >
            No pudimos encontrar la orden que estás buscando. El enlace podría ser incorrecto, la
            orden pudo haber expirado o fue realizada en otra tienda.
          </p>
        </div>

        {/* ── Tips ── */}
        <div
          style={{
            width: '100%',
            background: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.65rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.5,
            }}
          >
            Consejos rápidos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: 'search', text: 'Revisá que el enlace sea correcto' },
              { icon: 'store', text: 'Las órdenes expiran después de 30 días' },
              { icon: 'support_agent', text: 'Contactá al vendedor si necesitas ayuda' },
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: 'var(--md-sys-color-surface-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  <Icon size={16}>{tip.icon}</Icon>
                </div>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, var(--md-sys-color-outline-variant), transparent)',
          }}
        />

        {/* ── Buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {slug && (
            <Link
              href={`/${slug}`}
              className="nf-btn nf-btn-primary"
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                padding: '1.125rem 2rem',
                borderRadius: '100px',
                fontWeight: 950,
                textTransform: 'uppercase',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '0.8rem',
                boxShadow:
                  '0 8px 24px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 12px 32px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 8px 24px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent)';
              }}
            >
              <Icon size={18}>store</Icon>
              Ir a la tienda
            </Link>
          )}
          <Link
            href="/"
            className="nf-btn nf-btn-secondary"
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
              padding: '1rem 2rem',
              borderRadius: '100px',
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '0.12em',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.75rem',
              border: '1px solid var(--md-sys-color-outline-variant)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
              e.currentTarget.style.borderColor = 'var(--md-sys-color-outline)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
            }}
          >
            <Icon size={16}>home</Icon>
            Ir al inicio
          </Link>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.3,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--md-sys-color-primary)',
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Store Lite — Tu compra segura
          </p>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--md-sys-color-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
