'use client';

import { Icon } from '@/shared/components/ui/data-display';
import React from 'react';
import styles from '../BusinessSettingsModal.module.css';

export const ResultadosTab: React.FC = () => {
  return (
    <div className={styles.contentContainer}>
      <h2 className={styles.sectionTitle}>Resultados</h2>
      <p className={styles.formHint}>Métricas y rendimiento de tu tienda.</p>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Ventas Totales</div>
          <div className={styles.metricValue}>$1,240.50</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Órdenes</div>
          <div className={styles.metricValue}>124</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Ticket Promedio</div>
          <div className={styles.metricValue}>$10.00</div>
        </div>
      </div>

      <div className={styles.chartPlaceholder}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Icon size={32}>bar_chart</Icon>
          <span>Gráfico de ventas (Próximamente)</span>
        </div>
      </div>
    </div>
  );
};
