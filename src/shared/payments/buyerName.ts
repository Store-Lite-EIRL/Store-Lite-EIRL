/**
 * Shared buyer-name validation for the checkout flow.
 *
 * Isomorphic module (no imports, no 'use client') consumed by client
 * components (Checkout prefill, CheckoutPaymentStep inline error,
 * useCheckoutPayment guard) AND server schemas (billing zod refines),
 * so the two-word rule and its Spanish copy live in exactly one place.
 */

export const BUYER_NAME_ERROR_MESSAGE = 'Ingresá tu nombre y apellido';

const SPANISH_LETTERS_ONLY = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

/**
 * True when the trimmed name is non-empty, at least 3 chars, uses only
 * Spanish letters/whitespace, and contains at least two words.
 */
export function isTwoWordName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.length < 3) return false;
  if (!SPANISH_LETTERS_ONLY.test(trimmed)) return false;
  return trimmed.split(/\s+/).length >= 2;
}

/**
 * Returns null when the name is empty or valid (two words); otherwise
 * returns BUYER_NAME_ERROR_MESSAGE. Empty input is NOT a validation
 * failure — the caller keeps the legacy empty-field handling.
 */
export function validateBuyerName(name: string): string | null {
  if (!name.trim() || isTwoWordName(name)) return null;
  return BUYER_NAME_ERROR_MESSAGE;
}

/**
 * Prefills the buyer name from a Google full_name only when the current
 * field value is empty (whitespace-only counts as empty). Returns the
 * trimmed fullName, or '' when no fullName is available.
 */
export function prefillBuyerName(current: string, fullName?: string | null): string {
  return current.trim() ? current : fullName?.trim() || '';
}
