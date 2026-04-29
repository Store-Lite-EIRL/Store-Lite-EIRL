/**
 * Generate a complex tracking token for order tracking URLs.
 * 
 * This function generates a 96-character hexadecimal token by combining
 * three UUIDs without hyphens. This provides high entropy and security
 * while being URL-safe.
 * 
 * @returns A 96-character hex string
 * 
 * @example
 * const token = generateTrackingToken();
 * // Use in: /mitienda/order/{token}
 */
export function generateTrackingToken(): string {
  // Generate three UUIDs and remove hyphens
  const uuid1 = crypto.randomUUID().replace(/-/g, "");
  const uuid2 = crypto.randomUUID().replace(/-/g, "");
  const uuid3 = crypto.randomUUID().replace(/-/g, "");
  
  return uuid1 + uuid2 + uuid3;
}

/**
 * Validate if a string looks like a valid tracking token.
 * Useful for route validation in /mitienda/order/[token]
 * 
 * @param token - The token to validate
 * @returns true if it looks like a valid tracking token
 */
export function isValidTrackingToken(token: string): boolean {
  // Should be 96 hex characters (3 UUIDs without hyphens: 32 * 3 = 96)
  return /^[0-9a-f]{96}$/i.test(token);
}
