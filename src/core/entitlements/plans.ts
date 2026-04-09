// =====================================================
// ENTITLEMENTS — Plans Definition
// =====================================================
// Edita PLAN_ENTITLEMENTS para cambiar límites por plan.
// ¡NO cambies la lógica de validación aquí!
// Consulta docs/ENTITLEMENTS_GUIDE.md antes de modificar.
// =====================================================

export type PlanType = 'basico' | 'emprendedor' | 'business_pro' | 'enterprise_ai';

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
  Omit<BusinessEntitlements, 'plan' | 'isActive'>
> = {
  basico: {
    hasPaymentGateway: false,
    maxProducts: 50,
    maxCategories: 5,
    canImportProducts: false,
    canCustomizeStorefront: false,
    chatEnabled: false,
    dashboardEnabled: false,
    seoEnabled: false,
    canUseAIAssistant: false,
    maxTeamMembers: 1,
  },

  emprendedor: {
    hasPaymentGateway: false,
    maxProducts: 150,
    maxCategories: 20,
    canImportProducts: true,
    canCustomizeStorefront: false,
    chatEnabled: true,
    dashboardEnabled: true,
    seoEnabled: true,
    canUseAIAssistant: false,
    maxTeamMembers: 3,
  },

  business_pro: {
    hasPaymentGateway: true,
    maxProducts: 300,
    maxCategories: 50,
    canImportProducts: true,
    canCustomizeStorefront: true,
    chatEnabled: true,
    dashboardEnabled: true,
    seoEnabled: true,
    canUseAIAssistant: true,
    maxTeamMembers: 2, // Owner + 1 invitado
  },

  enterprise_ai: {
    hasPaymentGateway: true,
    maxProducts: -1, // ilimitado
    maxCategories: -1, // ilimitado
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
