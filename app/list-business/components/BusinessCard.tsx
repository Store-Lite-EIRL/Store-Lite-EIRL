'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { LinearProgress } from '@/shared/components/ui/feedback/Progress';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../ListBusiness.module.css';

import { getSectorIcon } from '@/shared/utils/business';

interface BusinessCardProps {
  biz: {
    id: string;
    slug: string;
    name: string;
    storeType: string | null;
    description: string | null;
    coverImageUrl?: string | null;
  };
  onDelete: (e: React.MouseEvent) => void;
}

export default function BusinessCard({ biz, onDelete }: BusinessCardProps) {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = () => {
    if (isSelecting) {
      return;
    }

    setIsSelecting(true);
    // Set cookie for server-side scoping (expires in 7 days)
    document.cookie = `selected_business_slug=${biz.slug}; path=/; max-age=${7 * 24 * 60 * 60}`;
    localStorage.setItem('selectedBusinessSlug', biz.slug);
    router.push(`/${biz.slug}`);
  };

  return (
    <div
      className={`${styles.businessCard} ${isSelecting ? styles.isSelecting : ''}`}
      onClick={handleSelect}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          {biz.coverImageUrl ? (
            <Image
              src={biz.coverImageUrl}
              alt={biz.name}
              className={styles.businessLogo}
              width={64}
              height={64}
              unoptimized
            />
          ) : (
            <Icon>{getSectorIcon(biz.storeType || '')}</Icon>
          )}
        </div>
        <div>
          <h2 className={styles.businessName}>{biz.name}</h2>
          <span className={styles.businessType}>{biz.storeType}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.description}>{biz.description || 'Sin descripción disponible.'}</p>

        {isSelecting && (
          <div style={{ marginTop: '1rem' }}>
            <LinearProgress indeterminate />
            <p
              style={{
                fontSize: '0.75rem',
                textAlign: 'center',
                marginTop: '0.5rem',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              Cargando tienda...
            </p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <md-text-button
          className={styles.deleteButton}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(e);
          }}
          disabled={isSelecting}
          suppressHydrationWarning
        >
          <Icon slot="icon" size={22}>
            delete
          </Icon>
          Eliminar
        </md-text-button>
        <md-filled-tonal-button
          className={styles.manageButton}
          suppressHydrationWarning
          disabled={isSelecting}
        >
          Gestionar
          <Icon slot="icon" size={22}>
            arrow_forward
          </Icon>
        </md-filled-tonal-button>
      </div>
    </div>
  );
}
