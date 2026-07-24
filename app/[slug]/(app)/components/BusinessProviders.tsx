'use client';

import type { ReactNode } from 'react';

import type { BusinessEntitlements } from '@/core/entitlements/plans';

import { CartProvider } from '@/features/storage/context/CartContext';
import { CurrencyProvider } from '@/features/storage/context/CurrencyContext';
import { StorageProvider } from '@/features/storage/context/StorageContext';
import type { Product } from '@/features/storage/data';
import type { CategoryItem } from '@/features/storage/hooks/useStorageProducts';
import { getCurrencyByCountry } from '@/features/storage/utils/currency';
import type { Permission, Role } from '@/lib/permissions/definitions';
import { BusinessEntitlementsProvider } from '../context/BusinessEntitlementsContext';
import { PermissionsProvider } from '../context/PermissionsContext';

interface BusinessProvidersProps {
  children: ReactNode;
  businessSlug: string;
  businessId: string;
  country: string | null;
  entitlements: BusinessEntitlements;
  initialProducts?: Product[];
  initialCategories?: CategoryItem[];
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
