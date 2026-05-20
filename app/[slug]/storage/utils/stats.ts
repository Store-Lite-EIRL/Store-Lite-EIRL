import type { Product } from '../data';
import { parsePriceValue } from './currency';

export const calculateInventoryStats = (products: Product[]) => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  const totalValue = products.reduce((sum, p) => {
    const priceNum = parsePriceValue(p.price);
    return sum + p.stock * priceNum;
  }, 0);

  const lowStockThreshold = 10;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const alertsCount = lowStockCount + outOfStockCount;

  const averageStock = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;

  return {
    totalProducts,
    totalStock,
    totalValue,
    lowStockCount,
    outOfStockCount,
    alertsCount,
    averageStock,
    lowStockThreshold,
  };
};

/**
 * Formatea un valor numérico con el símbolo de moneda del negocio.
 * @param value - Valor numérico
 * @param currencySymbol - Símbolo de moneda (ej: "S/ ", "$", "R$")
 */
export const formatCurrency = (value: number, currencySymbol = '$') => {
  const formatted = new Intl.NumberFormat('es', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currencySymbol}${formatted}`;
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};
