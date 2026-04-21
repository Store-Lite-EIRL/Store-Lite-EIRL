'use client';

import React from 'react';

export interface StoreLogoProps {
  /** Tamaño del icono en píxeles */
  size?: number;
  /** Variante de color: 'primary' usa el color de marca, 'white' para fondos oscuros */
  variant?: 'primary' | 'white';
  /** Si es true, muestra solo el icono. Si es false, incluye el texto "Store.Lite" */
  iconOnly?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Estilo adicional en línea */
  style?: React.CSSProperties;
}

/**
 * StoreLogo - Logo oficial de Store Lite
 * 
 * Diseño: Cubo isométrico con efecto 3D de aristas delgadas.
 * Color: Azul RGB (0, 97, 164)
 */
export function StoreLogo({
  size = 36,
  variant = 'primary',
  iconOnly = false,
  className = '',
  style = {}
}: StoreLogoProps) {
  // Azul RGB: (0, 97, 164) = #0061A4
  const primaryColor = '#0061A4';
  // Azul más claro para la cara frontal
  const lightBlue = '#3B82F6'; // RGB(59, 130, 246)

  const mainColor = variant === 'white' ? '#2d33edff' : primaryColor;
  const accentColor = variant === 'white' ? '#2d33edff' : lightBlue;

  return (
    <div
      className={`store-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: iconOnly ? 0 : '10px',
        ...style
      }}
    >
      {/* Icono SVG - Cubo isométrico con aristas delgadas */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Cara frontal del cubo - parte más clara */}
        <path
          clipRule="evenodd"
          d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
          fill={accentColor}
          fillRule="evenodd"
        />

        {/* Cuerpo del cubo - cara principal */}
        <path
          clipRule="evenodd"
          d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
          fill={mainColor}
          fillRule="evenodd"
        />
      </svg>

      {/* Texto "Store.Lite" */}
      {!iconOnly && (
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: accentColor,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Store<span style={{ color: accentColor }}>.Lite</span>
        </span>
      )}
    </div>
  );
}

export default StoreLogo;
