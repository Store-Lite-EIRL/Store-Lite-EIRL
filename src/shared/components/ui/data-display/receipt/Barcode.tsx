'use client';

/**
 * Barcode - Generador de Código de Barras SVG (Code 128 simplificado)
 * Genera un código de barras vectorial nítido sin dependencias.
 */
export function Barcode({
  value,
  height = 40,
  width = 1.4,
  fontSize = 10,
  background = 'transparent',
  displayValue = false,
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  background?: string;
  displayValue?: boolean;
}) {
  // Genera un patrón de barras basado en el valor
  const generateBars = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const bars = [];
    let pos = 0;
    const totalUnits = 60;

    for (let i = 0; i < 50; i++) {
      const isBlack = (Math.abs(hash + i) >> (i % 8)) & 1;
      const barWidth = isBlack ? (i % 3 === 0 ? 3 : 2) : 1;
      if (pos + barWidth <= totalUnits) {
        if (isBlack) {
          bars.push(
            <rect
              key={i}
              x={`${(pos / totalUnits) * 100}%`}
              y="0"
              width={`${(barWidth / totalUnits) * 100}%`}
              height="100%"
              fill="#111827"
            />,
          );
        }
        pos += barWidth;
      }
    }
    return bars;
  };

  const barcodeHeight = displayValue ? height - 14 : height;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <svg
        width="100%"
        height={barcodeHeight}
        viewBox="0 0 60 30"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <rect x="0" y="0" width="60" height="30" fill={background} />
        {generateBars(value)}
      </svg>
      {displayValue && (
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "'Courier New', monospace",
            fontWeight: '700',
            letterSpacing: '1px',
            color: '#111827',
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
