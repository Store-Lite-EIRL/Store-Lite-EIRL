import { resolveBusinessSlug } from '@/core/business/slug';
import { notFound } from 'next/navigation';
import { CurrencyProvider } from './context/CurrencyContext';
import { getCurrencyByCountry } from './utils/currency';

interface StorageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorageLayout({ children, params }: StorageLayoutProps) {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) {
    notFound();
  }

  const currency = getCurrencyByCountry(business.country);

  return <CurrencyProvider value={currency}>{children}</CurrencyProvider>;
}
