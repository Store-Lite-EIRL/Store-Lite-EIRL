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
}: {
  description: string;
  taxId: string;
  isDark: boolean;
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
      <VerifiedIcon
        size={18}
        style={{ color: isDark ? '#FFF' : 'var(--md-sys-color-primary)', opacity: 0.9 }}
      />
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
}: BusinessPreviewCardProps) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
              <VerifiedIcon size={26} style={{ color: isDark ? '#66BB6A' : '#2E7D32' }} />
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
          </div>

          <PreviewMetadata description={description} taxId={taxId} isDark={isDark} />

          <PreviewLegalRep name={legalRepName} role={legalRepRole} isDark={isDark} />
        </div>
      </div>

      {showDownloadButton && (
        <Button
          variant="filled"
          onClick={handleDownload}
          disabled={isDownloading}
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
