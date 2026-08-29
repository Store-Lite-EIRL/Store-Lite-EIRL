// =====================================================
// ENTITLEMENTS — Plans Definition
// =====================================================
// Edita PLAN_ENTITLEMENTS para cambiar límites por plan.
// ¡NO cambies la lógica de validación aquí!
// Consulta docs/ENTITLEMENTS_GUIDE.md antes de modificar.
// =====================================================

export type PlanType = 'basico' | 'emprendedor' | 'business_pro' | 'enterprise_pro';

/**
 * Todos los permisos/límites que un negocio puede tener.
 * Agrega nuevas propiedades aquí cuando necesites una nueva validación.
 */
export interface BusinessEntitlements {
  /** Plan activo del negocio */
  plan: PlanType;

  /** El negocio está activo en la plataforma */
  isActive: boolean;

  // ─── Pagos ────────────────────────────────────────────
  /** Puede mostrar botón de compra (Yape, Plin, tarjeta) */
  hasPaymentGateway: boolean;

  /** El negocio ha configurado sus credenciales de pago (Public/Secret Key) */
  isPaymentConfigured: boolean;

  /** API Key pública de Culqi (solo si está configurada) */
  culqiPublicKey?: string;

  // ─── Productos ────────────────────────────────────────
  /** Máximo de productos permitidos (-1 = ilimitado) */
  maxProducts: number;
  /** Máximo de categorías permitidas (-1 = ilimitado) */
  maxCategories: number;
  /** Puede importar productos en masa */
  canImportProducts: boolean;

  // ─── Storefront ───────────────────────────────────────
  /** Puede personalizar colores, fuentes y layout del storefront */
  canCustomizeStorefront: boolean;

  // ─── Comunicación ─────────────────────────────────────
  /** El módulo de chat con clientes está habilitado */
  chatEnabled: boolean;

  // ─── Analytics ────────────────────────────────────────
  /** El dashboard de ventas y métricas está habilitado */
  dashboardEnabled: boolean;

  // ─── SEO & Marketing ──────────────────────────────────
  /** SEO avanzado (Metadata dinámica, JSON-LD, Sitemap) habilitado */
  seoEnabled: boolean;

  // ─── IA ───────────────────────────────────────────────
  /** Puede usar el asistente de IA */
  canUseAIAssistant: boolean;

  // ─── Suscripción ──────────────────────────────────────
  /** Fecha de vencimiento del plan en ISO string (null si Free o sin suscripción) */
  planEndDate: string | null;

  // ─── Equipo ───────────────────────────────────────────
  /** Máximo de miembros en el equipo (-1 = ilimitado) */
  maxTeamMembers: number;
}

/**
 * Límites y permisos por plan.
 * Fuente única de verdad — editar aquí para cambiar cualquier límite.
 */
export const PLAN_ENTITLEMENTS: Record<
  PlanType,
  Omit<
    BusinessEntitlements,
    'plan' | 'isActive' | 'isPaymentConfigured' | 'culqiPublicKey' | 'planEndDate'
  >
> = {
  basico: {
    hasPaymentGateway: false,
    maxProducts: 50,
    maxCategories: 7, // máximo
    canImportProducts: false,
    canCustomizeStorefront: false,
    chatEnabled: true,
    dashboardEnabled: false,
    seoEnabled: false,
    canUseAIAssistant: false,
    maxTeamMembers: 1,
  },

  emprendedor: {
    hasPaymentGateway: false,
    maxProducts: 150,
    maxCategories: 7, // máximo
    canImportProducts: true,
    canCustomizeStorefront: false,
    chatEnabled: true,
    dashboardEnabled: true,
    seoEnabled: true,
    canUseAIAssistant: false,
    maxTeamMembers: 2, // Owner + 1 invitado
  },

  business_pro: {
    hasPaymentGateway: true,
    maxProducts: 300,
    maxCategories: 7, // máximo
    canImportProducts: true,
    canCustomizeStorefront: true,
    chatEnabled: true,
    dashboardEnabled: true,
    seoEnabled: true,
    canUseAIAssistant: true,
    maxTeamMembers: 3, // Owner + 2 invitados
  },

  enterprise_pro: {
    hasPaymentGateway: true,
    maxProducts: 600,
    maxCategories: 7, // máximo
    canImportProducts: true,
    canCustomizeStorefront: true,
    chatEnabled: true,
    dashboardEnabled: true,
    seoEnabled: true,
    canUseAIAssistant: true,
    maxTeamMembers: 5, // Owner + 4 invitados
  },
};

/**
 * Entitlements por defecto cuando no hay suscripción activa.
 * Un negocio sin suscripción se trata como "basico".
 */
export const DEFAULT_PLAN: PlanType = 'basico';
