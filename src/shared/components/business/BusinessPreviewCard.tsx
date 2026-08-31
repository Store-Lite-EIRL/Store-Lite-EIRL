'use client';

import type { StorefrontColorScheme, StorefrontTheme } from '@/core/storefront';
import {
  createRandomStorefrontTheme,
  getReadableTextColor,
  getStorefrontColorConfig,
  normalizeStorefrontColorScheme,
} from '@/core/storefront';
import { Button, Icon } from '@/shared/components/ui';
import { useRef, useState } from 'react';

// ─── SVG Icons inline (reemplazan Material Symbols para compatibilidad con html-to-image) ─────

function VerifiedIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
    </svg>
  );
}

function LocationIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0, ...style }}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function EmailIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0, ...style }}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0, ...style }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PersonIcon({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function BusinessIcon({ size = 120, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </svg>
  );
}

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 80);

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;

      try {
        await image.decode();
      } catch {
        // If decode fails, html-to-image will use the configured placeholder.
      }
    }),
  );
};

const hasBlobImages = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('img')).some(
    (image) => image.currentSrc.startsWith('blob:') || image.src.startsWith('blob:'),
  );

const getCaptureDimensions = (node: HTMLElement) => {
  const rect = node.getBoundingClientRect();
  const width = Math.ceil(Math.max(rect.width, node.scrollWidth));
  const height = Math.ceil(Math.max(rect.height, node.scrollHeight));

  return { width, height };
};

const getSafePixelRatio = (width: number, height: number) => {
  const targetExportWidth = 1440;
  const maxCanvasSide = 8192;
  const maxCanvasArea = 16_000_000;

  const targetRatio = Math.max(2, targetExportWidth / Math.max(width, 1));
  const sideRatio = Math.min(
    maxCanvasSide / Math.max(width, 1),
    maxCanvasSide / Math.max(height, 1),
  );
  const areaRatio = Math.sqrt(maxCanvasArea / Math.max(width * height, 1));

  return Math.max(1, Math.min(targetRatio, sideRatio, areaRatio));
};

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'rejected';

export interface BusinessPreviewCardProps {
  commercialName: string;
  sector: string;
  country: string;
  city: string;
  address: string;
  email: string;
  description: string;
  taxId: string;
  legalRepName: string;
  legalRepRole: string;
  logoPreview?: string | null;
  storefrontTheme: StorefrontTheme;
  colorScheme?: StorefrontColorScheme;
  onStorefrontThemeChange?: (theme: StorefrontTheme) => void;
  showDownloadButton?: boolean;
  downloadButtonLabel?: string;
  /**
   * Public profile props (optional, R4): when absent the card renders exactly
   * as before — no badge, no social row, no wa.me link.
   */
  socialLinks?: Record<string, string>;
  whatsappNumber?: string;
  legalRepPhone?: string;
  verificationStatus?: VerificationStatus | null;
  /** Contract-only field: accepted for API parity, header rendering deferred (D1). */
  coverImageUrl?: string | null;
  /** Contract-only field: reserved for the storefront type label (D1). */
  storeType?: string;
}

const tokenizeTaxId = (taxId: string) => {
  const input = taxId || '';
  const length = input.length;

  // Support both 11 and 20 digits
  const targetLength = length > 11 ? 20 : 11;
  const DEFAULT_ZEROS = '00000000000000000000'; // 20 zeros

  if (length === 0) {
    return DEFAULT_ZEROS.substring(0, 11);
  }

  // Typing state: progressive filling with zeros
  if (length < targetLength) {
    return input + DEFAULT_ZEROS.substring(0, targetLength - length);
  }

  // Final tokenized state: starts with x3bet, then mixed-case alphanumerics
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
  let token = 'x3bet';
  for (let i = 0; i < length; i++) {
    const charCode = input.charCodeAt(i);
    // Deterministic mixed-case randomness
    const salt = (i + length) * 13;
    const index = (charCode * 31 + salt) % alphabet.length;
    token += alphabet[index];
  }
  return token;
};

const PreviewHeader = ({ logoPreview }: { logoPreview: string | null; sector: string }) => (
  <div
    style={{
      width: '100%',
      height: '320px',
      position: 'relative',
      borderRadius: '32px',
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    }}
  >
    {logoPreview ? (
      <img
        src={logoPreview}
        alt="Logo Preview"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    ) : (
      <BusinessIcon size={120} style={{ color: 'rgba(255,255,255,0.45)' }} />
    )}
  </div>
);

const PreviewMetadata = ({
  description,
  taxId,
  isDark,
  showVerifiedStyle,
}: {
  description: string;
  taxId: string;
  isDark: boolean;
  showVerifiedStyle: boolean;
}) => (
  <div className="flex-column gap-sm" style={{ padding: '8px 4px' }}>
    {description && (
      <p
        className="body-small"
        style={{
          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
          fontStyle: 'italic',
          borderLeft: `3px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
          paddingLeft: '12px',
          margin: '4px 0 12px 0',
          lineHeight: '1.4',
          overflowWrap: 'anywhere',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        &quot;{description}&quot;
      </p>
    )}

    <div className="flex-row gap-md flex-align-center">
      {showVerifiedStyle ? (
        <VerifiedIcon
          size={18}
          style={{ color: isDark ? '#FFF' : 'var(--md-sys-color-primary)', opacity: 0.9 }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)',
            flexShrink: 0,
          }}
        />
      )}
      <span
        className="label-medium"
        style={{
          color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)',
          letterSpacing: '0.8px',
          fontWeight: 600,
          fontFamily: 'monospace',
          fontSize: '13px',
          overflowWrap: 'anywhere',
        }}
      >
        RUC: {tokenizeTaxId(taxId)}
      </span>
    </div>
  </div>
);

const PreviewLegalRep = ({
  name,
  role,
  isDark,
}: {
  name: string;
  role: string;
  isDark: boolean;
}) => (
  <div
    className="flex-row gap-md flex-align-center"
    style={{
      padding: '14px 18px',
      borderRadius: '24px',
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'}`,
      marginTop: '4px',
    }}
  >
    <div
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: isDark ? '#FFF' : 'var(--md-sys-color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#000' : 'var(--md-sys-color-on-primary)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <PersonIcon size={22} />
    </div>
    <div className="flex-column">
      <span
        className="label-large"
        style={{
          fontWeight: 700,
          color: isDark ? '#FFF' : 'rgba(0,0,0,0.9)',
          overflowWrap: 'anywhere',
        }}
      >
        {name || 'Nombre Representante'}
      </span>
      <span
        className="label-small"
        style={{
          opacity: 0.75,
          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
          overflowWrap: 'anywhere',
        }}
      >
        {role || 'Cargo'}
      </span>
    </div>
  </div>
);

// ─── VerificationBadge (inline SVG, html-to-image safe) ─────────────────────────

const VERIFICATION_BADGE_META: Record<
  VerificationStatus,
  { label: string; iconPath: string; color: string; colorDark: string; background: string }
> = {
  verified: {
    label: 'Verificado',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    color: '#16a34a',
    colorDark: '#4ade80',
    background: 'rgba(34, 197, 94, 0.14)',
  },
  pending: {
    label: 'En verificación',
    iconPath:
      'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z',
    color: '#a16207',
    colorDark: '#facc15',
    background: 'rgba(234, 179, 8, 0.16)',
  },
  unverified: {
    label: 'Sin verificar',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    color: 'rgba(0, 0, 0, 0.62)',
    colorDark: 'rgba(255, 255, 255, 0.78)',
    background: 'rgba(128, 128, 128, 0.14)',
  },
  rejected: {
    label: 'No verificado',
    iconPath:
      'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    color: '#b91c1c',
    colorDark: '#f87171',
    background: 'rgba(239, 68, 68, 0.14)',
  },
};

function VerificationBadge({
  status,
  isDark,
}: {
  status: VerificationStatus | null | undefined;
  isDark: boolean;
}) {
  const key: VerificationStatus =
    status === 'verified' || status === 'pending' || status === 'rejected' ? status : 'unverified';
  const meta = VERIFICATION_BADGE_META[key];

  return (
    <span
      role="status"
      aria-label={meta.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '999px',
        backgroundColor: meta.background,
        color: isDark ? meta.colorDark : meta.color,
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.3px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={meta.iconPath} />
      </svg>
      {meta.label}
    </span>
  );
}

// ─── SocialLinksRow (exported, single source of brand glyphs) ──────────────────

const SOCIAL_GLYPHS: Record<string, { label: string; path: string }> = {
  instagram: {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  facebook: {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  twitter: {
    label: 'X / Twitter',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
  tiktok: {
    label: 'TikTok',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
};

const FALLBACK_SOCIAL_GLYPH = {
  label: 'Red social',
  path: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
};

/** Fila de enlaces a redes sociales (inline SVG, html-to-image safe). */
export function SocialLinksRow({
  links,
  isDark,
}: {
  links?: Record<string, string>;
  isDark: boolean;
}) {
  const entries = Object.entries(links ?? {}).filter(
    ([, url]) => typeof url === 'string' && url.trim().length > 0,
  );
  if (entries.length === 0) return null;

  const foreground = isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.72)';
  const background = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.5)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid rgba(0, 0, 0, 0.07)';

  return (
    <div
      className="flex-row flex-align-center"
      style={{ flexWrap: 'wrap', gap: '10px', marginTop: '2px' }}
    >
      {entries.map(([key, url]) => {
        const meta = SOCIAL_GLYPHS[key] ?? FALLBACK_SOCIAL_GLYPH;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Síguenos en ${meta.label}`}
            title={meta.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: background,
              color: foreground,
              border,
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={meta.path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}

export const BusinessPreviewCard = ({
  commercialName,
  sector,
  country,
  city,
  address,
  email,
  description,
  taxId,
  legalRepName,
  legalRepRole,
  logoPreview,
  storefrontTheme,
  colorScheme,
  onStorefrontThemeChange,
  showDownloadButton = true,
  downloadButtonLabel = 'Descargar tarjeta',
  socialLinks,
  whatsappNumber,
  legalRepPhone,
  verificationStatus,
}: BusinessPreviewCardProps) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const waPhoneNumber = whatsappNumber ?? legalRepPhone ?? '';
  const waHref = waPhoneNumber ? `https://wa.me/${waPhoneNumber.replace(/\D/g, '')}` : undefined;

  const resolvedScheme = normalizeStorefrontColorScheme(colorScheme);
  const config = getStorefrontColorConfig(storefrontTheme, resolvedScheme);
  const gradientColors = [config.palette.primary, config.palette.secondary, config.palette.accent];
  const isDark = resolvedScheme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const subTextColor = isDark ? 'rgba(249,250,251,0.78)' : 'rgba(17,24,39,0.7)';

  const hexToRGBA = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const g0 = hexToRGBA(gradientColors[0], 0.95);
  const g1 = hexToRGBA(gradientColors[1], 0.95);
  const g2 = hexToRGBA(gradientColors[2], 0.95);

  const handleDownload = async () => {
    if (!captureRef.current) return;

    try {
      setIsDownloading(true);

      await document.fonts?.ready;
      await waitForImages(captureRef.current);

      const { width, height } = getCaptureDimensions(captureRef.current);
      const pixelRatio = getSafePixelRatio(width, height);
      const containsBlobImages = hasBlobImages(captureRef.current);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: 'transparent',
        width,
        height,
        canvasWidth: Math.ceil(width * pixelRatio),
        canvasHeight: Math.ceil(height * pixelRatio),
        pixelRatio,
        quality: 1,
        // html-to-image appends a query param when cacheBust is true. That breaks
        // blob: object URLs used by the /created logo preview, so only cache-bust
        // captures that do not contain local object URLs.
        cacheBust: !containsBlobImages,
        imagePlaceholder: TRANSPARENT_PIXEL,
        // Avoid reading cssRules from third-party/injected stylesheets. The capture
        // uses inline SVG icons and system fallbacks, so font embedding is not worth
        // the cross-origin SecurityError risk here.
        skipFonts: true,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: 'none',
          transformOrigin: 'top left',
          transition: 'none',
        },
      });

      const link = document.createElement('a');
      link.download = `negocio-${sanitizeFileName(commercialName) || 'preview'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[BusinessPreviewCard] Error downloading preview:', err);
      if (err instanceof Error) {
        console.error('  name:', err.name);
        console.error('  message:', err.message);
        console.error('  stack:', err.stack);
      } else if (err && typeof err === 'object') {
        console.error('  details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } else {
        console.error('  details:', String(err));
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      {onStorefrontThemeChange && (
        <Button
          variant="tonal"
          onClick={() =>
            onStorefrontThemeChange(
              createRandomStorefrontTheme({ fontFamily: storefrontTheme.fontFamily }),
            )
          }
          style={{
            position: 'absolute',
            top: '28px',
            left: '28px',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            minWidth: '44px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,24,39,0.12)',
            color: textColor,
            backdropFilter: 'blur(12px)',
            zIndex: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Icon size={22} style={{ display: 'block', margin: 'auto' }}>
            palette
          </Icon>
        </Button>
      )}

      <div
        ref={captureRef}
        className="surface-container"
        style={{
          padding: '20px',
          borderRadius: '44px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${g0}, ${g1}, ${g2})`,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
          margin: '0 auto',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <PreviewHeader logoPreview={logoPreview ?? null} sector={sector} />

        <div className="flex-column gap-md" style={{ padding: '0 10px 10px 10px' }}>
          <div className="flex-column gap-xs">
            <div className="flex-row flex-align-center gap-sm">
              <h2
                className="heading-2"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  color: textColor,
                  letterSpacing: '-0.8px',
                  fontSize: '28px',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {commercialName || 'Empresa'}
              </h2>
              {verificationStatus !== undefined ? (
                <VerificationBadge status={verificationStatus} isDark={isDark} />
              ) : (
                <VerifiedIcon size={26} style={{ color: isDark ? '#66BB6A' : '#2E7D32' }} />
              )}
            </div>
            <p className="body-large" style={{ color: subTextColor, fontWeight: 600 }}>
              {sector || 'Sector'} • {country || 'País'}
            </p>
          </div>

          <div className="flex-column gap-sm">
            <div className="flex-row gap-md flex-align-center">
              <LocationIcon size={18} style={{ color: textColor, opacity: 0.7 }} />
              <span
                className="label-medium"
                style={{ color: subTextColor, minWidth: 0, overflowWrap: 'anywhere' }}
              >
                {city || 'Ciudad'}, {address || 'Ubicación'}
              </span>
            </div>
            <div className="flex-row gap-md flex-align-center">
              <EmailIcon size={18} style={{ color: textColor, opacity: 0.7 }} />
              <span
                className="label-medium"
                style={{ color: subTextColor, minWidth: 0, overflowWrap: 'anywhere' }}
              >
                {email || 'contacto@empresa.com'}
              </span>
            </div>
            {waHref && (
              <div className="flex-row gap-md flex-align-center">
                <WhatsAppIcon size={18} style={{ color: textColor, opacity: 0.7 }} />
                <a
                  className="label-medium"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp al ${waPhoneNumber}`}
                  style={{ color: subTextColor, minWidth: 0, overflowWrap: 'anywhere' }}
                >
                  {waPhoneNumber}
                </a>
              </div>
            )}
          </div>

          <PreviewMetadata
            description={description}
            taxId={taxId}
            isDark={isDark}
            showVerifiedStyle={verificationStatus === undefined}
          />

          <PreviewLegalRep name={legalRepName} role={legalRepRole} isDark={isDark} />

          <SocialLinksRow links={socialLinks} isDark={isDark} />
        </div>
      </div>

      {showDownloadButton && (
        <Button
          variant="filled"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label={downloadButtonLabel}
          style={{
            position: 'absolute',
            bottom: '-14px',
            right: '-14px',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            minWidth: '60px',
            padding: 0,
            backgroundColor: gradientColors[0],
            color: getReadableTextColor(gradientColors[0]),
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            zIndex: 40,
          }}
        >
          <Icon size={28}>{isDownloading ? 'hourglass_top' : 'download'}</Icon>
        </Button>
      )}
    </div>
  );
};
