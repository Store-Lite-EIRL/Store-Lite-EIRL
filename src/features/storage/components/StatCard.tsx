import { Icon } from '@/shared/components/ui';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  variant: 'products' | 'inventory' | 'values' | 'alerts';
  /** Subtítulo opcional debajo del valor (ej: "Promedio: 42") */
  subtitle?: string;
  /** Elemento adicional opcional (ej: un badge, un mini gráfico) */
  extra?: ReactNode;
}

export const StatCard = ({ label, value, icon, variant, subtitle, extra }: StatCardProps) => (
  <div className={`stat-card stat-${variant}`}>
    <div className={`stat-icon-wrap stat-icon-${variant}`}>
      <Icon>{icon}</Icon>
    </div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <span className="stat-value-text">{value}</span>
      {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      {extra && <div className="stat-extra">{extra}</div>}
    </div>
  </div>
);
