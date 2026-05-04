// =====================================================
// FACTILIZA CLIENT (Server-side only)
// =====================================================
// Description: HTTP client for Factiliza API with caching
// Usage: Import { getRucInfo } from '@/lib/factiliza/client'
// =====================================================

import { env } from '@/config/env';
import type {
  CacheEntry,
  FactilizaDniInfo,
  FactilizaOtpResponse,
  FactilizaRepresentative,
  FactilizaRucInfo,
  FactilizaRucRepresentatives,
} from './types';

// Re-export types for consumers
export type {
  FactilizaDniInfo,
  FactilizaOtpResponse,
  FactilizaRepresentative,
  FactilizaRucInfo,
  FactilizaRucRepresentatives,
};

// Base URL for Factiliza API
const FACTILIZA_BASE_URL = 'https://api.factiliza.com/v1';

// Cache instance (in-memory Map, migrate to Redis before production)
const factilizaCache = new Map<string, CacheEntry>();

// Cache duration: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Limpia entradas expiradas del caché (opcional, para evitar crecimiento infinito)
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of factilizaCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      factilizaCache.delete(key);
    }
  }
}

/**
 * Obtiene del caché o ejecuta la función de fetch
 */
async function cachedFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  // Limpieza liviana cada vez que se usa el caché
  cleanExpiredCache();

  const cached = factilizaCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Factiliza Cache] HIT for key: ${key}`);
    return cached.data as T;
  }

  console.log(`[Factiliza Cache] MISS for key: ${key}`);
  const data = await fetchFn();
  factilizaCache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Cliente base para Factiliza
 */
async function factilizaFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${FACTILIZA_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${env.factilizaToken}`,
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  } as RequestInit);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Factiliza API Error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// =====================================================
// PUBLIC API METHODS
// =====================================================

/**
 * Obtiene información de un RUC
 * @param ruc - RUC de 11 dígitos
 * @returns FactilizaRucInfo
 */
export async function getRucInfo(ruc: string): Promise<FactilizaRucInfo> {
  return cachedFetch(`ruc:${ruc}`, () => factilizaFetch<FactilizaRucInfo>(`/ruc/info/${ruc}`));
}

/**
 * Obtiene los representantes legales de un RUC
 * @param ruc - RUC de 11 dígitos
 * @returns FactilizaRucRepresentatives
 */
export async function getRucRepresentatives(ruc: string): Promise<FactilizaRucRepresentatives> {
  return cachedFetch(`representatives:${ruc}`, () =>
    factilizaFetch<FactilizaRucRepresentatives>(`/ruc/representante/${ruc}`),
  );
}

/**
 * Obtiene información de un DNI
 * @param dni - DNI de 8 dígitos
 * @returns FactilizaDniInfo
 */
export async function getDniInfo(dni: string): Promise<FactilizaDniInfo> {
  return cachedFetch(`dni:${dni}`, () => factilizaFetch<FactilizaDniInfo>(`/dni/info/${dni}`));
}

/**
 * Envía un mensaje de texto (OTP) vía WhatsApp
 * @param phone - Número de teléfono (sin prefijo +51)
 * @param code - Código OTP de 6 dígitos
 * @returns FactilizaOtpResponse
 */
export async function sendWhatsAppOTP(phone: string, code: string): Promise<FactilizaOtpResponse> {
  // OTP sending should NOT be cached, always send a new message
  const payload = {
    number: phone,
    message: `Tu código de verificación para Store Lite es: ${code}. Válido por 5 minutos.`,
  };

  return factilizaFetch<FactilizaOtpResponse>(`/message/sendtext/${env.factilizaWspInstance}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Genera un código OTP criptográfico de 6 dígitos
 * @returns string (ej. "123456")
 */
export function generateOTP(): string {
  // crypto.getRandomValues para mayor seguridad que Math.random
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  // Convertir bytes a un número de 6 dígitos
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}
