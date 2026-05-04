// =====================================================
// FACTILIZA TYPES
// =====================================================
// Description: TypeScript definitions for Factiliza API responses
// =====================================================

export interface FactilizaRucInfo {
  ruc: string;
  razonSocial: string;
  estado: string; // "ACTIVO"
  condicion: string; // "HABIDO"
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  // ... otros campos que devuelva la API
}

export interface FactilizaRepresentative {
  tipoDocumento: string; // "DNI"
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  cargo: string; // "Gerente General", etc.
}

export interface FactilizaRucRepresentatives {
  ruc: string;
  representantes: FactilizaRepresentative[];
}

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
