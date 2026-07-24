import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * 🔐 Store Lite Security Utility
 * Encrypts and decrypts sensitive strings (like Culqi Secret Keys)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// In production, ENCRYPTION_KEY must be a 32-byte string in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)
  : Buffer.alloc(32, 0); // Fallback only for dev, SHOULD BE SET IN .ENV

/**
 * Encrypts a text using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: ENCRYPTION_KEY is not set in production environment.');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:encrypted:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a text using AES-256-GCM
 */
export function decrypt(cipherText: string): string {
  try {
    const [ivHex, encrypted, authTagHex] = cipherText.split(':');

    if (!ivHex || !encrypted || !authTagHex) {
      // If it doesn't match the format, it might be an old plain-text key
      // Return as is for backward compatibility during transition, but log it
      if (cipherText.startsWith('sk_')) return cipherText;
      throw new Error('Invalid cipher text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // During transition, if it starts with sk_, it's probably not encrypted yet
    if (cipherText.startsWith('sk_')) return cipherText;
    throw new Error('Could not decrypt the secret key. Ensure ENCRYPTION_KEY is correct.');
  }
}
