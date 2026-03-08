import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { CurrencyProvider } from './context/CurrencyContext';
import { getCurrencyByCountry } from './utils/currency';

interface StorageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorageLayout({ children, params }: StorageLayoutProps) {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { country: true },
  });

  if (!business) {
    notFound();
  }

  const currency = getCurrencyByCountry(business.country);

  return <CurrencyProvider value={currency}>{children}</CurrencyProvider>;
}
