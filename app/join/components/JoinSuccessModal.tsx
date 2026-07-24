'use client';

import { Button, Card, Icon } from '@/shared/components/ui';
import { useEffect, useState } from 'react';
import styles from './JoinSuccessModal.module.css';

interface JoinSuccessModalProps {
  businessName: string;
  onComplete: () => void;
}

export function JoinSuccessModal({ businessName, onComplete }: JoinSuccessModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(true);

  const [confettiData, setConfettiData] = useState<
    {
      id: number;
      left: string;
      delay: string;
      duration: string;
      color: string;
    }[]
  >([]);

  useEffect(() => {
    // Generate confetti data once on mount
    const data = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: [
        'var(--md-sys-color-primary)',
        'var(--md-sys-color-secondary)',
        'var(--md-sys-color-tertiary)',
        'var(--md-sys-color-primary-container)',
        'var(--md-sys-color-secondary-container)',
      ][Math.floor(Math.random() * 5)],
    }));
    setConfettiData(data);
  }, []);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Stop confetti after 3 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  const handleGoNow = () => {
    onComplete();
  };

  return (
    <div className={styles.overlay}>
      {/* Confetti Background */}
      {showConfetti && (
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
              }}
            />
          ))}
        </div>
      )}

      {/* Success Card */}
      <Card variant="elevated" className={styles.card}>
        {/* Animated Check Icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.checkCircle}>
            <Icon size={48}>check</Icon>
          </div>
        </div>

        {/* Title */}
        <h1 className={styles.title}>¡Bienvenido al equipo!</h1>

        {/* Business Name */}
        <p className={styles.businessName}>{businessName}</p>

        {/* Description */}
        <p className={styles.description}>
          Tienes acceso a gestionar productos, categorías, storefront y más.
          <br />
          ¡Empieza a trabajar!
        </p>

        {/* Countdown */}
        <div className={styles.countdownWrapper}>
          <div className={styles.countdown}>
            <span className={styles.countdownNumber}>{countdown}</span>
          </div>
          <p className={styles.countdownText}>Redirigiendo en...</p>
        </div>

        {/* Go Now Button */}
        <Button variant="filled" onClick={handleGoNow} className={styles.goButton}>
          <Icon slot="icon" size={20}>
            arrow_forward
          </Icon>
          Ir al negocio ahora
        </Button>
      </Card>
    </div>
  );
}
