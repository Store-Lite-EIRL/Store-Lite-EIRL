// ──────────────────────────────────────────
// Pickup Code Generator
// Generates codes in format SL-XXXX-XXXX
// ──────────────────────────────────────────

import { randomBytes } from 'node:crypto';

const SEGMENT_LENGTH = 4;
const PREFIX = 'SL';

/**
 * Generate a pickup code in format SL-XXXX-XXXX.
 * Uses crypto.randomBytes for true randomness.
 * Example output: "SL-7K92-X4P8"
 */
export function generatePickupCode(): string {
  const seg1 = randomBytes(SEGMENT_LENGTH).toString('hex').toUpperCase();
  const seg2 = randomBytes(SEGMENT_LENGTH).toString('hex').toUpperCase();
  return `${PREFIX}-${seg1}-${seg2}`;
}
