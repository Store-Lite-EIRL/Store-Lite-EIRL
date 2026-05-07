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
} from './types';

// Re-export types for consumers
export type { FactilizaDniInfo, FactilizaOtpResponse, FactilizaRepresentative, FactilizaRucInfo };

// Base URL for Factiliza API
const FACTILIZA_BASE_URL = 'https://api.factiliza.com/v1';

// Cache instance (in-memory Map, migrate to Redis before production)
const factilizaCache = new Map<string, CacheEntry>();

// Cache duration: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Limpia entradas expiradas del cachÃ© (opcional, para evitar crecimiento infinito)
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
 * Obtiene del cachÃ© o ejecuta la funciÃ³n de fetch
 */
async function cachedFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  // Limpieza liviana cada vez que se usa el cachÃ©
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

  console.log(`[Factiliza] Fetching: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  } as RequestInit);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Factiliza] HTTP Error ${response.status}: ${errorBody}`);

    // SPECIAL HANDLING: 404 for RUC/DNI not found (valid response, not an error)
    if (response.status === 404) {
      console.log(`[Factiliza] 404 - Resource not found (valid response)`);
      // Return a structured error that the caller can handle
      return {
        success: false,
        status: 404,
        message: 'Not found',
        data: null,
      } as T;
    }

    throw new Error(`Factiliza API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  // Log the response for debugging
  console.log(`[Factiliza] Response from ${endpoint}:`, JSON.stringify(data, null, 2));

  // Check if the API returned success: false (API-level error, not HTTP error)
  if (data && data.success === false) {
    console.warn(`[Factiliza] API returned success:false - ${data.message || 'Unknown error'}`);
    // Return the data anyway, let the caller decide what to do
  }

  // Extract the 'data' field from the response
  // Factiliza API returns: { status, message, success, data: {...} }
  // We want to return only the content of 'data'
  if (data && data.data) {
    return data.data as T;
  }

  return data as T;
}

// =====================================================
// PUBLIC API METHODS
// =====================================================

/**
 * Obtiene informaciÃ³n de un RUC
 * @param ruc - RUC de 11 dÃ­gitos
 * @returns FactilizaRucInfo
 */
export async function getRucInfo(ruc: string): Promise<FactilizaRucInfo> {
  return cachedFetch(`ruc:${ruc}`, () => factilizaFetch<FactilizaRucInfo>(`/ruc/info/${ruc}`));
}

/**
 * Obtiene los representantes legales de un RUC
 * @param ruc - RUC de 11 dÃ­gitos
 * @returns FactilizaRepresentative[] (array of representatives)
 * NOTE: factilizaFetch extracts 'data' from API response, so we get the array directly
 */
export async function getRucRepresentatives(ruc: string): Promise<FactilizaRepresentative[]> {
  return cachedFetch(`representatives:${ruc}`, () =>
    factilizaFetch<FactilizaRepresentative[]>(`/ruc/representante/${ruc}`),
  );
}

/**
 * Obtiene informaciÃ³n de un DNI
 * @param dni - DNI de 8 dÃ­gitos
 * @returns FactilizaDniInfo
 */
export async function getDniInfo(dni: string): Promise<FactilizaDniInfo> {
  return cachedFetch(`dni:${dni}`, () => factilizaFetch<FactilizaDniInfo>(`/dni/info/${dni}`));
}

/**
 * EnvÃ­a un mensaje de texto (OTP) vÃ­a WhatsApp
 * @param phone - NÃºmero de telÃ©fono (sin prefijo +51)
 * @param code - CÃ³digo OTP de 6 dÃ­gitos
 * @returns FactilizaOtpResponse
 */
export async function sendWhatsAppOTP(phone: string, code: string): Promise<FactilizaOtpResponse> {
  // OTP sending should NOT be cached, always send a new message
  const payload = {
    number: phone,
    message: `Tu cÃ³digo de verificaciÃ³n para Store Lite es: ${code}. VÃ¡lido por 5 minutos.`,
  };

  return factilizaFetch<FactilizaOtpResponse>(`/message/sendtext/${env.factilizaWspInstance}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Genera un cÃ³digo OTP criptogrÃ¡fico de 6 dÃ­gitos
 * @returns string (ej. "123456")
 */
export function generateOTP(): string {
  // crypto.getRandomValues para mayor seguridad que Math.random
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  // Convertir bytes a un nÃºmero de 6 dÃ­gitos
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}
