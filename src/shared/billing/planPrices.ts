// =====================================================
// Precios de planes — fuente única de verdad
// =====================================================
// Usado por el servidor (route de billing) y por la UI de
// precios. Los montos están en céntimos y son el TOTAL FINAL
// que se cobra al cliente, INCLUYENDO IGV (18%). El IGV se
// desglosa internamente: subtotal = total / 1.18; igv = total - subtotal.
// =====================================================

export type PlanKey = 'lite' | 'lite_pago' | 'lite_plus';

export interface PlanPrice {
  monthly: number; // céntimos, total final incluye IGV
  annual: number; // céntimos, total final incluye IGV
  label: string;
}

export const PLAN_PRICES: Record<PlanKey, PlanPrice> = {
  lite: { monthly: 0, annual: 0, label: 'Lite' },
  lite_pago: { monthly: 3900, annual: 39000, label: 'Lite Pago' }, // S/ 39.00 / S/ 390.00
  lite_plus: { monthly: 7900, annual: 79000, label: 'Lite Plus' }, // S/ 79.00 / S/ 790.00
};

// Convenience map for UI: plan key → display label (source: PLAN_PRICES).
export const PLAN_LABELS: Record<PlanKey, string> = {
  lite: PLAN_PRICES.lite.label,
  lite_pago: PLAN_PRICES.lite_pago.label,
  lite_plus: PLAN_PRICES.lite_plus.label,
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
