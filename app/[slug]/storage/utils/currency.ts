/**
 * Mapeo de país (según formulario de creación de negocio) a moneda local.
 * Usado para mostrar precios según el país del negocio.
 */
export const COUNTRY_CURRENCY: Record<string, { symbol: string; code: string }> = {
  Argentina: { symbol: '$', code: 'ARS' },
  Bolivia: { symbol: 'Bs.', code: 'BOB' },
  Brasil: { symbol: 'R$', code: 'BRL' },
  Chile: { symbol: '$', code: 'CLP' },
  Colombia: { symbol: '$', code: 'COP' },
  Ecuador: { symbol: '$', code: 'USD' },
  Paraguay: { symbol: '₲', code: 'PYG' },
  Perú: { symbol: 'S/', code: 'PEN' },
  Uruguay: { symbol: '$', code: 'UYU' },
  Venezuela: { symbol: 'Bs.', code: 'VES' },
};

const DEFAULT_CURRENCY = { symbol: '$', code: 'USD' };

/**
 * Obtiene el símbolo y código de moneda según el país del negocio.
 */
export function getCurrencyByCountry(country: string | null | undefined) {
  if (!country?.trim()) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country] ?? DEFAULT_CURRENCY;
}

/**
 * Extrae el valor numérico de un precio que puede incluir símbolos de moneda.
 * Ej: "$245", "S/ 245", "245" -> 245
 */
export function parsePriceValue(price: string): number {
  const cleaned = price.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Formatea un valor numérico con el símbolo de moneda.
 */
export function formatPrice(value: number, currencySymbol: string): string {
  const formatted = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, '');
  return `${currencySymbol}${formatted}`;
}
