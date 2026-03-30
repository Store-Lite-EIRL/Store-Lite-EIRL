import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SettingsClient } from './components/SettingsClient';

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { name: true },
  });

  return {
    title: business ? `Ajustes — ${business.name}` : 'Ajustes | Store Lite',
    description: 'Configuración y preferencias de tu negocio.',
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) {
    return notFound();
  }

  const entitlements = await getBusinessEntitlements(business.id);

  return (
    <SettingsClient
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        coverImageUrl: business.coverImageUrl ?? null,
        logoUrl: business.logoUrl ?? null,
        address: business.address ?? null,
        storeType: business.storeType ?? null,
        description: business.description ?? null,
        whatsappNumber: business.whatsappNumber ?? null,
        taxId: business.taxId ?? null,
        personType: business.personType ?? null,
        country: business.country ?? null,
        city: business.city ?? null,
        email: business.email ?? null,
        legalRepName: business.legalRepName ?? null,
        legalRepRole: business.legalRepRole ?? null,
        legalRepPhone: business.legalRepPhone ?? null,
        legalRepEmail: business.legalRepEmail ?? null,
        paymentFlow: business.paymentFlow ?? null,
        isActive: business.isActive,
        createdAt: business.createdAt,
      }}
      entitlements={entitlements}
    />
  );
}
