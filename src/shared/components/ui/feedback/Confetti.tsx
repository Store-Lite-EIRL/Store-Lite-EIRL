'use client';

import { useEffect, useState } from 'react';
import styles from './Confetti.module.css';

// Colores vibrantes y festivos (círculos)
const DEFAULT_COLORS = [
  '#6750A4', // PúrpuraStore
  '#7C4DEF', // Violeta vivo
  '#FF6B6B', // Rojo coral
  '#4ECDC4', // Turquesa
  '#FFE66D', // Amarillo soleil
  '#95E1D3', // Menta
  '#F38181', // Salmón
  '#AA96DA', // Lavanda
];

export interface ConfettiProps {
  show?: boolean;
  duration?: number; // duración en ms
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

/**
 * Componente reutilizable de confeti
 * Uso: <Confetti show={showSuccess} />
 */
export function Confetti({
  show = true,
  duration = 3000,
  particleCount = 50,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiProps) {
  const [confettiData, setConfettiData] = useState<
    {
      id: number;
      left: string;
      delay: string;
      duration: string;
      color: string;
      size: string;
      borderRadius: string;
    }[]
  >([]);

  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      return;
    }

    // Generar datos del confeti
    const data = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${8 + Math.random() * 10}px`,
      borderRadius: '50%', // Siempre círculos
    }));
    setConfettiData(data);
    setIsVisible(true);

    // Ocultar después de la duración
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, particleCount, colors, onComplete]);

  if (!isVisible || confettiData.length === 0) return null;

  return (
    <div className={styles.confettiContainer}>
      {confettiData.map((item) => (
        <div
          key={item.id}
          className={styles.confetti}
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            backgroundColor: item.color,
            width: item.size,
            height: item.size,
            borderRadius: item.borderRadius,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
