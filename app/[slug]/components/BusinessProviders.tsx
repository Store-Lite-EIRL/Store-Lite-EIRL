'use client';

import type { ReactNode } from 'react';

import type { BusinessEntitlements } from '@/core/entitlements/plans';

import { BusinessEntitlementsProvider } from '../context/BusinessEntitlementsContext';
import { CartProvider } from '../storage/context/CartContext';
import { CurrencyProvider } from '../storage/context/CurrencyContext';
import { StorageProvider } from '../storage/context/StorageContext';
import type { Product } from '../storage/data';
import { getCurrencyByCountry } from '../storage/utils/currency';

interface BusinessProvidersProps {
  children: ReactNode;
  businessSlug: string;
  country: string | null;
  entitlements: BusinessEntitlements;
  initialProducts?: Product[];
  initialCategories?: string[];
}

export function BusinessProviders({
  children,
  businessSlug,
  country,
  entitlements,
  initialProducts,
  initialCategories,
}: BusinessProvidersProps) {
  const currency = getCurrencyByCountry(country);

  return (
    <BusinessEntitlementsProvider entitlements={entitlements}>
      <CurrencyProvider value={currency}>
        <CartProvider businessSlug={businessSlug}>
          <StorageProvider
            businessSlug={businessSlug}
            initialProducts={initialProducts}
            initialCategories={initialCategories}
          >
            {children}
          </StorageProvider>
        </CartProvider>
      </CurrencyProvider>
    </BusinessEntitlementsProvider>
  );
}
