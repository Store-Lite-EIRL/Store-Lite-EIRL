import type { BusinessEntitlements } from '@/core/entitlements/plans';
import styles from './StatCards.module.css';

interface StatCardsProps {
  totalProducts: number;
  totalCategories: number;
  unreadMessages: number;
  totalLikes: number;
  totalSold: number;
  entitlements: BusinessEntitlements;
}

interface StatCardItem {
  id: string;
  label: string;
  value: number;
  icon: string;
  max?: number;
  iconBg: string;
  iconColor: string;
  formatValue?: (v: number) => string;
}

export function StatCards({
  totalProducts,
  totalCategories,
  unreadMessages,
  totalLikes,
  totalSold,
  entitlements,
}: StatCardsProps) {
  const cards: StatCardItem[] = [
    {
      id: 'products',
      label: 'Productos',
      value: totalProducts,
      icon: '📦',
      max: entitlements.maxProducts === -1 ? undefined : entitlements.maxProducts,
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
    },
    {
      id: 'categories',
      label: 'Categorías',
      value: totalCategories,
      icon: '🏷️',
      max: entitlements.maxCategories === -1 ? undefined : entitlements.maxCategories,
      iconBg: 'rgba(139, 92, 246, 0.12)',
      iconColor: '#8b5cf6',
    },
    {
      id: 'messages',
      label: 'Mensajes nuevos',
      value: unreadMessages,
      icon: '✉️',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
    },
    {
      id: 'likes',
      label: 'Likes en productos',
      value: totalLikes,
      icon: '❤️',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444',
    },
    {
      id: 'sold',
      label: 'Productos vendidos',
      value: totalSold,
      icon: '🛍️',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#d97706',
    },
  ];

  return (
    <section className={styles.grid} aria-label="Resumen del negocio">
      {cards.map((card) => {
        const progress =
          card.max !== undefined && card.max !== null
            ? Math.min((card.value / card.max) * 100, 100)
            : null;
        const isNearLimit = progress !== null && progress >= 80;

        return (
          <article key={card.id} className={styles.card}>
            <div className={styles.topRow}>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>{card.label}</span>
                <span className={styles.cardValue}>{card.value.toLocaleString('es-PE')}</span>
                {card.max !== undefined && card.max !== null && (
                  <span
                    className={`${styles.cardLimit} ${isNearLimit ? styles.cardLimitWarn : ''}`}
                  >
                    de {card.max.toLocaleString('es-PE')} disponibles
                  </span>
                )}
              </div>
              <div
                className={styles.iconWrap}
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                <span className={styles.emoji} role="img" aria-hidden>
                  {card.icon}
                </span>
              </div>
            </div>

            {progress !== null && (
              <div className={styles.progressWrap} aria-label={`Uso: ${card.value} de ${card.max}`}>
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${isNearLimit ? styles.progressFillWarn : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={styles.progressPct}>{Math.round(progress)}%</span>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
