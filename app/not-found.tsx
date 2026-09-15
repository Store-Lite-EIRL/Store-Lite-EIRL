'use client';

import { extractTenantSlugFromHost, isReservedSubdomain } from '@/shared/utils/url';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [path, setPath] = useState('');
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    setPath(window.location.pathname);

    const slug = extractTenantSlugFromHost(window.location.hostname);
    if (slug && !isReservedSubdomain(slug)) {
      setTenantSlug(slug);
    }
  }, []);

  const linkLabel = tenantSlug ? `Ir a ${tenantSlug}` : 'Ir a Store Lite';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
        fontFamily: 'var(--font-google-sans-flex), system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* ── 404 ── */}
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(5rem, 15vw, 8rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'var(--md-sys-color-outline)',
            opacity: 0.25,
            userSelect: 'none',
          }}
        >
          404
        </p>

        {/* ── Title ── */}
        <h1
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          Página no encontrada
        </h1>

        {/* ── Path ── */}
        {path && (
          <p
            style={{
              margin: 0,
              fontSize: '0.8rem',
              fontFamily: 'var(--font-roboto-mono), monospace',
              color: 'var(--md-sys-color-on-surface-variant)',
              background: 'var(--md-sys-color-surface-container)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              wordBreak: 'break-all',
              maxWidth: '100%',
            }}
          >
            {path}
          </p>
        )}

        {/* ── Divider ── */}
        <div
          style={{
            width: '3rem',
            height: '2px',
            background: 'var(--md-sys-color-outline-variant)',
            borderRadius: '1px',
          }}
        />

        {/* ── Link ── */}
        <Link
          href="/"
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--md-sys-color-primary)',
            textDecoration: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '100px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--md-sys-color-surface-container)';
            e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
          }}
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
