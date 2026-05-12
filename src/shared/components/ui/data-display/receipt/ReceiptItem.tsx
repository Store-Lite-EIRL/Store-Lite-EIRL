// ReceiptItem - Componente para mostrar un solo item en el ticket

export interface ReceiptItemProps {
  label: string;
  value: string | number;
  isBold?: boolean;
  isTotal?: boolean;
  icon?: string;
}

/**
 * ReceiptItem - Helper para formatear items del receipt
 */
export function createReceiptItem(
  label: string,
  value: number | string,
  options?: {
    isBold?: boolean;
    isTotal?: boolean;
    icon?: string;
  },
): ReceiptItemProps {
  return {
    label,
    value,
    ...options,
  };
}

/**
 * formatCurrency - Formatea un monto a moneda peruana
 */
export function formatCurrency(amount: number, currency = 'S/'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * generateOrderNumber - Genera un número de orden único
 */
export function generateOrderNumber(prefix = 'ORD'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
