'use client';

import { useMemo } from 'react';
import styles from './LocationMap.module.css';

interface LocationMapProps {
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  city?: string | null;
  /** Fallback if structured fields are empty */
  address?: string | null;
}

/**
 * LocationMap — Google Maps embed (iframe, gratis, sin API key).
 *
 * Construye una URL del tipo:
 *   https://www.google.com/maps?q={query}&output=embed
 *
 * Usa departamento, provincia, distrito y city para armar la query.
 * Si no hay datos estructurados, cae al campo `address` como fallback.
 * Si no hay ningún dato, no renderiza nada.
 */
export function LocationMap({
  departamento,
  provincia,
  distrito,
  city,
  address,
}: LocationMapProps) {
  const query = useMemo(() => {
    // 1. Intentar con datos estructurados
    const parts = [departamento, provincia, distrito, city].filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.map((p) => encodeURIComponent(p.trim())).join(',');
    }

    // 2. Fallback a address
    if (address && address.trim().length > 0) {
      return encodeURIComponent(address.trim());
    }

    return null;
  }, [departamento, provincia, distrito, city, address]);

  if (!query) return null;

  const src = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div className={styles.container}>
      <iframe
        src={src}
        className={styles.mapIframe}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación del negocio"
      />
    </div>
  );
}
