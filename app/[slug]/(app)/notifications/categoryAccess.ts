// =====================================================
// CATEGORY ACCESS — Filter notification tabs by plan
// =====================================================
// Server-safe: NO imports from lucide-react or 'use client' modules.
// Returns only plain strings — no components or functions.
// =====================================================

import type { BusinessEntitlements } from '@/core/entitlements/plans';

/**
 * Mapa: category id → entitlement key requerido.
 * null = siempre disponible, sin importar el plan.
 */
const CATEGORY_ENTITLEMENT: Record<string, keyof BusinessEntitlements | null> = {
  chat: 'chatEnabled',
  almacen: null,
  plan: 'hasPaymentGateway',
  pedidos: 'hasPaymentGateway',
  sistema: null,
};

const ALL_CATEGORY_IDS = ['all', 'chat', 'almacen', 'plan', 'pedidos', 'sistema'] as const;

/**
 * Retorna solo los IDs de categorías disponibles según el plan.
 * 'all' siempre se incluye.
 */
export function getAvailableCategoryIds(entitlements: BusinessEntitlements): string[] {
  return ALL_CATEGORY_IDS.filter((id) => {
    if (id === 'all') return true;
    const required = CATEGORY_ENTITLEMENT[id];
    if (required === null || required === undefined) return true;
    return Boolean(entitlements[required]);
  });
}
