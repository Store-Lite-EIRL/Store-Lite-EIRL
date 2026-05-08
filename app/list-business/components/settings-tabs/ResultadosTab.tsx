'use client';

import type { Business } from '@/core/database/schema';
import { Icon } from '@/shared/components/ui/data-display';
import React, { useEffect, useState } from 'react';
import { getProductStats } from '../../actions';
import styles from '../BusinessSettingsModal.module.css';

interface ResultadosTabProps {
  business: Business;
}

interface Stats {
  productCount: number;
  categoryCount: number;
}

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  unverified: { label: 'Sin verificar', color: 'var(--md-sys-color-outline)' },
  pending: { label: 'En revisión', color: 'var(--md-sys-color-tertiary)' },
  verified: { label: 'Verificado', color: 'var(--md-sys-color-primary)' },
  rejected: { label: 'Rechazado', color: 'var(--md-sys-color-error)' },
};

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ResultadosTab: React.FC<ResultadosTabProps> = ({ business }) => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getProductStats(business.id)
      .then((data) => {
        setStats({
          productCount: data.productCount,
          categoryCount: data.categoryCount,
        });
        return null;
      })
      .catch(() => {
        setStats({ productCount: 0, categoryCount: 0 });
      });
  }, [business.id]);

  const verification =
    VERIFICATION_LABELS[business.verificationStatus] ?? VERIFICATION_LABELS.unverified;

  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Resultados</h2>
      <p className={styles.formHint}>Métricas y rendimiento de tu tienda.</p>

      {/* ── Metrics Grid ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Productos registrados</div>
          <div className={styles.metricValue}>{stats?.productCount ?? '—'}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Categorías</div>
          <div className={styles.metricValue}>{stats?.categoryCount ?? '—'}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Estado de verificación</div>
          <div className={styles.metricValue}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: verification.color,
              }}
            >
              {verification.label}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Negocio creado</div>
          <div className={styles.metricValue} style={{ fontSize: '1rem', lineHeight: 1.3 }}>
            {formatDate(business.createdAt)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Última actualización</div>
          <div className={styles.metricValue} style={{ fontSize: '1rem', lineHeight: 1.3 }}>
            {formatDate(business.updatedAt)}
          </div>
        </div>
      </div>

      {/* ── Business Info Card ── */}
      <div className={styles.actionsCard}>
        <div className={styles.actionsCardInfo}>
          <div className={styles.actionsCardTitle}>{business.name}</div>
          <div className={styles.actionsCardDesc}>
            {business.storeType ? `${business.storeType} · ` : ''}
            {business.city ?? business.country ?? 'Sin ubicación'}
          </div>
        </div>
        <Icon size={24}>store</Icon>
      </div>

      {/* ── Chart placeholder (future) ── */}
      <div className={styles.chartPlaceholder}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Icon size={32}>bar_chart</Icon>
          <span>Gráfico de ventas (Próximamente)</span>
        </div>
      </div>
    </div>
  );
};
