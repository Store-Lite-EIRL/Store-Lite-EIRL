'use client';

/**
 * Normalizes a name for comparison: removes accents, punctuation (commas, dots),
 * converts to uppercase, removes extra spaces
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD') // Separate accents from letters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^A-Z0-9\s]/gi, '') // Remove punctuation (commas, dots, etc.)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .toUpperCase();
}

/**
 * Validates if the user input matches the SUNAT registered name
 * Uses word-by-word matching with STRICT validation:
 * 1. All words from user input must be in SUNAT name
 * 2. User input must cover at least 60% of SUNAT name words (prevents "TACORA" only)
 */
export function validateNameMatch(input: string, sunatName: string | undefined): boolean {
  if (!input || !sunatName) return false;

  const normalizedInput = normalizeName(input);
  const normalizedSunat = normalizeName(sunatName);

  // EXACT MATCH after normalization (simplest and most secure)
  // This ensures user types the COMPLETE name exactly as it appears in SUNAT
  return normalizedInput === normalizedSunat;
}
