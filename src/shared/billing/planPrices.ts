// =====================================================
// Precios de planes — fuente única de verdad
// =====================================================
// Usado por el servidor (route de billing) y por la UI de
// precios. Los montos están en céntimos y son el TOTAL FINAL
// que se cobra al cliente, INCLUYENDO IGV (18%). El IGV se
// desglosa internamente: subtotal = total / 1.18; igv = total - subtotal.
// =====================================================

export type PlanKey = 'basico' | 'emprendedor' | 'business_pro' | 'enterprise_ai';

export interface PlanPrice {
  monthly: number; // céntimos, total final incluye IGV
  annual: number; // céntimos, total final incluye IGV
  label: string;
}

export const PLAN_PRICES: Record<PlanKey, PlanPrice> = {
  basico: { monthly: 0, annual: 0, label: 'Básico' },
  emprendedor: { monthly: 5900, annual: 59000, label: 'Emprendedor' }, // S/ 59.00 / S/ 590.00
  business_pro: { monthly: 9900, annual: 99000, label: 'Business Pro' }, // S/ 99.00 / S/ 990.00
  enterprise_ai: { monthly: 14900, annual: 149000, label: 'Enterprise AI' }, // S/ 149.00 / S/ 1490.00
};

export const IGV_RATE = 0.18;

export function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export function centimosToSoles(centimos: number): number {
  return centimos / 100;
}

// Desglose de un total (en soles) que YA incluye IGV:
// subtotal = total / 1.18, igv = total - subtotal.
export function splitIgv(totalSoles: number): { subtotalSoles: number; igvSoles: number } {
  const subtotalSoles = roundTwo(totalSoles / (1 + IGV_RATE));
  const igvSoles = roundTwo(totalSoles - subtotalSoles);
  return { subtotalSoles, igvSoles };
}

// Formatea céntimos a una cadena legible en soles (59 → '59', 59.5 → '59.50').
export function formatSoles(centimos: number): string {
  const value = centimos / 100;
  const rounded = roundTwo(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
