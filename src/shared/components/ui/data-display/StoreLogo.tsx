'use client';

import Image from 'next/image';
import React from 'react';

export interface StoreLogoProps {
  /** Tamaño del icono en píxeles */
  size?: number;
  /** Variante de color: 'primary' usa el color de marca, 'white' para fondos oscuros */
  variant?: 'primary' | 'white';
  /** Si es true, muestra solo el icono. Si es false, incluye el texto "Store Lite" */
  iconOnly?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Estilo adicional en línea */
  style?: React.CSSProperties;
}

/**
 * StoreLogo - Logo oficial de Store Lite
 *
 * Icono: PNG transparente servido desde /img/icon.png
 * Color del texto: azul de marca en variante 'primary', tono claro en 'white'
 */
export function StoreLogo({
  size = 36,
  variant = 'primary',
  iconOnly = false,
  className = '',
  style = {},
}: StoreLogoProps) {
  // Azul RGB: (0, 97, 164) = #0061A4 — color de marca
  const primaryColor = '#3B82F6'; // RGB(59, 130, 246), azul claro para el texto
  const darkBgColor = '#2d33edff'; // Variante sobre fondos oscuros

  const textColor = variant === 'white' ? darkBgColor : primaryColor;

  return (
    <div
      className={`store-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: iconOnly ? 0 : '10px',
        ...style,
      }}
    >
      {/* Icono */}
      <Image
        src="/img/icon.png"
        alt="Store Lite"
        width={size}
        height={size}
        style={{ flexShrink: 0, width: size, height: size }}
      />

      {/* Texto "Store Lite" */}
      {!iconOnly && (
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: textColor,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Store Lite
        </span>
      )}
    </div>
  );
}

export default StoreLogo;
