'use client';

import type { ReactNode } from 'react';

import { CartProvider } from '../storage/context/CartContext';
import { CurrencyProvider } from '../storage/context/CurrencyContext';
import { StorageProvider } from '../storage/context/StorageContext';
import type { Product } from '../storage/data';
import { getCurrencyByCountry } from '../storage/utils/currency';

interface BusinessProvidersProps {
  children: ReactNode;
  businessSlug: string;
  country: string | null;
  initialProducts?: Product[];
  initialCategories?: string[];
}

export function BusinessProviders({
  children,
  businessSlug,
  country,
  initialProducts,
  initialCategories,
}: BusinessProvidersProps) {
  const currency = getCurrencyByCountry(country);

  return (
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
  );
}
