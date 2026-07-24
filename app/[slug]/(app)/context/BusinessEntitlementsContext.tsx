'use client';

// =====================================================
// ENTITLEMENTS — React Context
// =====================================================
// Proveedor que distribuye los entitlements al cliente.
// Los entitlements son calculados en el servidor (layout.tsx)
// y pasados a este contexto via BusinessProviders.
// =====================================================

import { createContext, useContext } from 'react';

import type { BusinessEntitlements } from '@/core/entitlements/plans';

const BusinessEntitlementsContext = createContext<BusinessEntitlements | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

interface BusinessEntitlementsProviderProps {
  children: React.ReactNode;
  entitlements: BusinessEntitlements;
}

export function BusinessEntitlementsProvider({
  children,
  entitlements,
}: BusinessEntitlementsProviderProps) {
  return (
    <BusinessEntitlementsContext.Provider value={entitlements}>
      {children}
    </BusinessEntitlementsContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Accede a los entitlements del negocio actual.
 *
 * @example
 * const { hasPaymentGateway, maxProducts } = useEntitlements();
 *
 * if (!hasPaymentGateway) return <UpgradePrompt />;
 */
export function useEntitlements(): BusinessEntitlements {
  const ctx = useContext(BusinessEntitlementsContext);
  if (!ctx) {
    throw new Error(
      '[useEntitlements] Debe usarse dentro de un BusinessEntitlementsProvider. ' +
        'Verifica que el layout del negocio esté correctamente configurado.',
    );
  }
  return ctx;
}
