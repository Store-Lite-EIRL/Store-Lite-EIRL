/* eslint-disable unicorn/filename-case -- kebab-case is mandated by the Next.js metadata file convention (app/opengraph-image.tsx) */
import { ImageResponse } from 'next/og';

// Branded OpenGraph card rendered at build/request time by Next.js.
// Uses the system font stack — no external font fetches — so the image
// stays dependency-free and renders identically across environments.

export const alt = 'Store Lite — Crea tu tienda online en minutos';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #135BEC 0%, #0A3FA8 100%)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 120,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
        }}
      >
        Store Lite
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 32,
          fontSize: 44,
          color: 'rgba(255, 255, 255, 0.92)',
        }}
      >
        Crea tu tienda online en minutos
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 48,
          padding: '14px 40px',
          borderRadius: 999,
          border: '2px solid rgba(255, 255, 255, 0.45)',
          fontSize: 30,
          color: '#FFFFFF',
        }}
      >
        store-lite.com
      </div>
    </div>,
    size,
  );
}
