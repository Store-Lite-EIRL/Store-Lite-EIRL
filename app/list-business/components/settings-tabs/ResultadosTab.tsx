'use client';

import type { Business } from '@/core/database/schema';
import { Icon } from '@/shared/components/ui/data-display';
import React, { useEffect, useState } from 'react';
import { getBusinessResults } from '../../actions';
import styles from '../BusinessSettingsModal.module.css';

interface ResultadosTabProps {
  business: Business;
}

interface BusinessResults {
  totalSales: number;
  orderCount: number;
  avgTicket: number;
  pendingOrders: number;
  lastOrder: {
    amount: string;
    createdAt: string;
    orderNumber: string | null;
  } | null;
}

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  unverified: { label: 'Sin verificar', color: 'var(--md-sys-color-outline)' },
  pending: { label: 'En revisión', color: 'var(--md-sys-color-tertiary)' },
  verified: { label: 'Verificado', color: 'var(--md-sys-color-primary)' },
  rejected: { label: 'Rechazado', color: 'var(--md-sys-color-error)' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const now = new Date();
  const then = new Date(date);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export const ResultadosTab: React.FC<ResultadosTabProps> = ({ business }) => {
  const [results, setResults] = useState<BusinessResults | null>(null);

  useEffect(() => {
    getBusinessResults(business.id)
      .then((data) => {
        setResults(data);
        return null;
      })
      .catch(() => {
        setResults({
          totalSales: 0,
          orderCount: 0,
          avgTicket: 0,
          pendingOrders: 0,
          lastOrder: null,
        });
      });
  }, [business.id]);

  const verification =
    VERIFICATION_LABELS[business.verificationStatus] ?? VERIFICATION_LABELS.unverified;
  const daysActive = daysSince(business.createdAt);

  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Resultados</h2>
      <p className={styles.formHint}>Métricas y rendimiento de tu tienda.</p>

      {/* ── Metrics Grid ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Ventas Totales</div>
          <div className={styles.metricValue}>
            {results ? formatCurrency(results.totalSales) : '—'}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Órdenes</div>
          <div className={styles.metricValue}>{results?.orderCount ?? '—'}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Ticket Promedio</div>
          <div className={styles.metricValue}>
            {results ? formatCurrency(results.avgTicket) : '—'}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Órdenes Pendientes</div>
          <div className={styles.metricValue}>{results?.pendingOrders ?? '—'}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Días Activo</div>
          <div className={styles.metricValue}>{daysActive > 0 ? `${daysActive} días` : 'Hoy'}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Verificación</div>
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
