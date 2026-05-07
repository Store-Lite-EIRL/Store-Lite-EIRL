// =====================================================
// FACTILIZA TYPES
// =====================================================
// Description: TypeScript definitions for Factiliza API responses
// =====================================================

export interface FactilizaRucInfo {
  success?: boolean; // Present on API-level error responses handled by factilizaFetch
  status?: number; // Present on API-level error responses handled by factilizaFetch
  message?: string; // Present on API-level error responses handled by factilizaFetch
  data?: unknown; // Present on API-level error responses handled by factilizaFetch
  // API returns these fields according to Factiliza docs
  numero: string; // RUC number (11 digits)
  nombre_o_razon_social: string; // Business name or legal name
  tipo_contribuyente: string; // "PERSONA NATURAL CON NEGOCIO", "SOCIEDAD ANONIMA", etc.
  estado: string; // "ACTIVO", "SUSPENDIDO", etc.
  condicion: string; // "HABIDO", "INHABILIDO", etc.
  departamento: string; // Department
  provincia: string; // Province
  distrito: string; // District
  direccion: string; // Full address
  direccion_completa?: string; // Complete address (optional)
  ubigeo_sunat?: string; // SUNAT ubigeo code (optional)
  ubigeo?: string[]; // Ubigeo breakdown (optional)
}

export interface FactilizaRepresentative {
  tipo_de_documento: string; // "DNI", "CE", etc.
  numero_de_documento: string; // Document number (MIGHT BE MASKED like "1*****72")
  nombre: string; // Full name of representative (MIGHT BE MASKED like "PAIMO *****O ***NA")
  cargo: string; // "GERENTE GENERAL", etc.
  fecha_desde?: string; // Optional
}

// NOTE: getRucRepresentatives() returns FactilizaRepresentative[] directly
// because factilizaFetch extracts the 'data' field from API response
// API returns: { status, message, success, data: FactilizaRepresentative[] }
// After extraction: FactilizaRepresentative[]
// So we don't need FactilizaRucRepresentatives interface anymore
// Use FactilizaRepresentative[] directly

export interface FactilizaDniInfo {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

export interface FactilizaOtpResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

// Cache structure
export interface CacheEntry {
  data: any;
  timestamp: number;
}

// Cache duration: 5 minutes
export const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache using Map (pre-Redis implementation)
export const factilizaCache = new Map<string, CacheEntry>();
