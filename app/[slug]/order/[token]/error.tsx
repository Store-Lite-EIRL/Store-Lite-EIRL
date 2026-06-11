'use client';

import { Icon } from '@/shared/components/ui';
import { useEffect } from 'react';

export default function OrderPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 🐛 DEBUG: log the full error to identify the redirect source
    console.error('[OrderPageError]', {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--md-sys-color-surface)',
        padding: '2rem',
        fontFamily: 'var(--mio-theme-text-font-family), sans-serif',
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
          <Icon size={32}>error</Icon>
        </div>
        <h2
          style={{
            margin: '0 0 0.5rem',
            fontSize: '1.5rem',
            fontWeight: 950,
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          Error al cargar la orden
        </h2>
        <p
          style={{
            margin: '0 0 1.5rem',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            color: 'var(--md-sys-color-on-error-container)',
            opacity: 0.8,
          }}
        >
          Ocurrió un error inesperado. El error fue registrado para depuración.
        </p>
        <button
          onClick={reset}
          style={{
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '100px',
            fontWeight: 950,
            textTransform: 'uppercase',
            cursor: 'pointer',
            letterSpacing: '0.1em',
            background: 'var(--md-sys-color-primary)',
            color: 'white',
          }}
        >
          Reintentar
        </button>
        <details
          style={{
            marginTop: '2rem',
            textAlign: 'left',
            fontSize: '0.75rem',
            opacity: 0.6,
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Detalles del error</summary>
          <pre
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              overflow: 'auto',
              fontSize: '0.65rem',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {error.name}: {error.message}
            {'\n\n'}
            Digest: {error.digest || 'N/A'}
            {'\n\n'}
            URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}
