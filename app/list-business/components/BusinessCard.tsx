'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { getSectorIcon } from '@/shared/utils/business';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../ListBusiness.module.css';

interface BusinessCardProps {
  biz: {
    id: string;
    slug: string;
    name: string;
    storeType: string | null;
    description: string | null;
    logoUrl?: string | null;
    planType?: string | null;
  };
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  index?: number;
}

export default function BusinessCard({ biz, onDelete, onEdit, index = 0 }: BusinessCardProps) {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = () => {
    if (isSelecting) return;
    setIsSelecting(true);
    document.cookie = `selected_business_slug=${encodeURIComponent(biz.slug)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    localStorage.setItem('selectedBusinessSlug', biz.slug);
    router.push(`/${biz.slug}`);
  };

  return (
    <div
      className={`${styles.businessCard} ${isSelecting ? styles.isSelecting : ''}`}
      style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}
      onClick={handleSelect}
    >
      {/* Top Left Badge (Store Type & Plan) */}
      {(biz.storeType || (biz.planType && biz.planType !== 'basico')) && (
        <div className={styles.cardBadge}>
          {biz.storeType && (
            <span className={styles.businessTypeBadge}>{biz.storeType}</span>
          )}
          {biz.planType && biz.planType !== 'basico' && (
            <span style={{ 
              background: 'var(--md-sys-color-tertiary-container)', 
              color: 'var(--md-sys-color-on-tertiary-container)',
              marginLeft: biz.storeType ? '8px' : '0',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Icon size={12}>star</Icon>
              {biz.planType.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div className={styles.cardInner}>
        {/* Header: icon + name + RUC */}
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            {biz.logoUrl ? (
              <Image
                src={biz.logoUrl}
                alt={biz.name}
                className={styles.businessLogo}
                width={46}
                height={46}
                unoptimized
              />
            ) : (
              <Icon size={24} style={{ color: 'var(--md-sys-color-primary)' }}>
                {getSectorIcon(biz.storeType || '')}
              </Icon>
            )}
          </div>
          <div className={styles.nameWrapper}>
            <h2 className={styles.businessName}>{biz.name}</h2>
            <div className={styles.rucWrapper}>
              <Icon size={14} className={styles.rucIcon}>
                badge
              </Icon>
              <span className={styles.rucText}>RUC: 20******123</span>
            </div>
          </div>
        </div>

        {/* Description (Fuller) */}
        <div className={styles.cardBody}>
          <p className={styles.description}>{biz.description || 'Sin descripción disponible.'}</p>
        </div>

        {/* Grouped Actions: Delete Icon | Edit Icon | Manage Button */}
        <div className={styles.cardFooter}>
          <div className={styles.actionIcons}>
            <md-icon-button
              className={styles.iconOnlyDelete}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete(e);
              }}
              disabled={isSelecting}
              suppressHydrationWarning
            >
              <Icon size={20}>delete_outline</Icon>
            </md-icon-button>

            <md-icon-button
              className={styles.iconOnlyEdit}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit(e);
              }}
              disabled={isSelecting}
              suppressHydrationWarning
            >
              <Icon size={20}>settings</Icon>
            </md-icon-button>
          </div>

          <md-filled-button
            className={styles.manageButtonIcon}
            suppressHydrationWarning
            disabled={isSelecting}
            title="Gestionar"
          >
            {isSelecting ? (
              <CircularProgress indeterminate className={styles.buttonSpinner} />
            ) : (
              <Icon size={28}>arrow_forward</Icon>
            )}
          </md-filled-button>
        </div>
      </div>
    </div>
  );
}
