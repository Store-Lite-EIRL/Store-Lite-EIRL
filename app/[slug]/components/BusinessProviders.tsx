'use client';

import type { ReactNode } from 'react';

import type { BusinessEntitlements } from '@/core/entitlements/plans';

import type { Permission, Role } from '@/lib/permissions/definitions';
import { BusinessEntitlementsProvider } from '../context/BusinessEntitlementsContext';
import { PermissionsProvider } from '../context/PermissionsContext';
import { CartProvider } from '../storage/context/CartContext';
import { CurrencyProvider } from '../storage/context/CurrencyContext';
import { StorageProvider } from '../storage/context/StorageContext';
import type { Product } from '../storage/data';
import { getCurrencyByCountry } from '../storage/utils/currency';

interface BusinessProvidersProps {
  children: ReactNode;
  businessSlug: string;
  businessId: string;
  country: string | null;
  entitlements: BusinessEntitlements;
  initialProducts?: Product[];
  initialCategories?: string[];
  isOwner: boolean;
  role: Role | null;
  permissions: Permission[];
}

export function BusinessProviders({
  children,
  businessSlug,
  businessId,
  country,
  entitlements,
  initialProducts,
  initialCategories,
  isOwner,
  role,
  permissions,
}: BusinessProvidersProps) {
  const currency = getCurrencyByCountry(country);

  return (
    <PermissionsProvider role={role} permissions={permissions} isOwner={isOwner}>
      <BusinessEntitlementsProvider entitlements={entitlements}>
        <CurrencyProvider value={currency}>
          <CartProvider businessSlug={businessSlug}>
            <StorageProvider
              businessSlug={businessSlug}
              businessId={businessId}
              initialProducts={initialProducts}
              initialCategories={initialCategories}
              isOwner={isOwner}
            >
              {children}
            </StorageProvider>
          </CartProvider>
        </CurrencyProvider>
      </BusinessEntitlementsProvider>
    </PermissionsProvider>
  );
}
