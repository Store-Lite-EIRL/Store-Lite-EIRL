'use client';

import { useCurrency } from '../context/CurrencyContext';
import type { Product } from '../data';
import { calculateInventoryStats, formatCurrency, formatNumber } from '../utils/stats';
import { StatCard } from './StatCard';

interface StatsHeaderProps {
  products: Product[];
}

function alertSubtitle(
  alertsCount: number,
  lowStockCount: number,
  outOfStockCount: number,
): string {
  if (alertsCount <= 0) return 'Sin alertas';
  const parts: string[] = [];
  if (lowStockCount > 0) parts.push(`${formatNumber(lowStockCount)} bajo stock`);
  if (outOfStockCount > 0) parts.push(`${formatNumber(outOfStockCount)} sin stock`);
  return parts.join(' · ');
}

export const StatsHeader = ({ products }: StatsHeaderProps) => {
  const { symbol: currencySymbol } = useCurrency();
  const {
    totalProducts,
    totalStock,
    totalValue,
    lowStockCount,
    outOfStockCount,
    alertsCount,
    averageStock,
  } = calculateInventoryStats(products);

  return (
    <div className="stats-header">
      <StatCard
        label="Productos"
        value={formatNumber(totalProducts)}
        icon="inventory"
        variant="products"
        subtitle={
          totalProducts === 1
            ? '1 producto registrado'
            : `${formatNumber(totalProducts)} productos registrados`
        }
      />
      <StatCard
        label="Stock Total"
        value={formatNumber(totalStock)}
        icon="inventory_2"
        variant="inventory"
        subtitle={`Promedio: ${formatNumber(averageStock)} por producto`}
      />
      <StatCard
        label="Valor Total"
        value={formatCurrency(totalValue, currencySymbol)}
        icon="trending_up"
        variant="values"
      />
      <StatCard
        label="Alertas"
        value={formatNumber(alertsCount)}
        icon={alertsCount > 0 ? 'warning' : 'check_circle'}
        variant="alerts"
        subtitle={alertSubtitle(alertsCount, lowStockCount, outOfStockCount)}
      />
    </div>
  );
};
