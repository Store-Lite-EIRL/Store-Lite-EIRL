'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { getCurrencyByCountry } from '../utils/currency';

type CurrencyInfo = ReturnType<typeof getCurrencyByCountry>;

const CurrencyContext = createContext<CurrencyInfo>(getCurrencyByCountry(null));

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
  value: CurrencyInfo;
  children: ReactNode;
}

export function CurrencyProvider({ value, children }: CurrencyProviderProps) {
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
