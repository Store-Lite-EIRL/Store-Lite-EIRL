import { Icon } from '@/shared/components/ui';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  variant: 'inventory' | 'values' | 'warnings';
}

export const StatCard = ({ label, value, icon, variant }: StatCardProps) => (
  <div className={`stat-card stat-${variant}`}>
    <div className="stat-icon-wrap">
      <Icon>{icon}</Icon>
    </div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <span className="stat-value-text">{value}</span>
    </div>
  </div>
);
