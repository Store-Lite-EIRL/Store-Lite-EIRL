'use client';

import { useCurrency } from '../context/CurrencyContext';
import type { Product } from '../data';
import { calculateInventoryStats, formatCurrency, formatNumber } from '../utils/stats';
import { StatCard } from './StatCard';

interface StatsHeaderProps {
  products: Product[];
}

export const StatsHeader = ({ products }: StatsHeaderProps) => {
  const { symbol: currencySymbol } = useCurrency();
  const { totalStock, totalValue, lowStockCount } = calculateInventoryStats(products);

  return (
    <div className="stats-header">
      <StatCard
        label="Stock Total"
        value={formatNumber(totalStock)}
        icon="inventory_2"
        variant="inventory"
      />
      <StatCard
        label="Valor Total"
        value={formatCurrency(totalValue, currencySymbol)}
        icon="trending_up"
        variant="values"
      />
      <StatCard
        label="Bajo Stock"
        value={formatNumber(lowStockCount)}
        icon="warning"
        variant="warnings"
      />
    </div>
  );
};
