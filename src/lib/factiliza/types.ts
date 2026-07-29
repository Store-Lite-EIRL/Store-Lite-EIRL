// =====================================================
// JSON.pe API TYPES (RUC/DNI verification)
// =====================================================
// Description: TypeScript definitions for JSON.pe API responses
// JSON.pe returns { success, message, data: {...} } wrapper
// The client extracts the 'data' field before returning
// =====================================================

export interface JsonpeRucInfo {
  ruc: string; // RUC number (11 digits)
  nombre_o_razon_social: string; // Business name or legal name
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

export interface JsonpeRepresentative {
  tipo_de_documento: string; // "DNI", "CE", etc.
  numero_de_documento: string; // Document number (may be masked)
  nombre: string; // Full name of representative (may be masked)
  cargo: string; // "GERENTE GENERAL", etc.
  fecha_desde?: string; // Optional
}

export interface JsonpeDniInfo {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

/** Generic JSON.pe API response wrapper */
export interface JsonpeResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Cache structure
export interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Cache duration: 5 minutes
export const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache (in-memory Map, migrate to Redis before production)
export const apiCache = new Map<string, CacheEntry>();
