import { db } from '@/core/database/client';
import { businesses, businessSettings, type Business } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import {
  getStorefrontLayoutFromPreferences,
  getStorefrontThemeFromPreferences,
  hasCustomStorefrontTheme,
} from '@/core/storefront';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SettingsClient } from './components/SettingsClient';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/config/env';
import { getMemberPermissions } from '@/lib/permissions/checkPermission';

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
    robots: { index: false, follow: false },
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

  // --- Auth & Permission Guard ---
  const cookieStore = await cookies();
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return notFound();
  }

  // Obtener permisos y rol efectivos
  const { isOwner, role, permissions } = await getMemberPermissions(business.id, user.id);

  if (!role) {
    // Si no tiene rol (no es owner ni miembro), no tiene nada que hacer acá
    return notFound();
  }
  // ------------------------------

  const entitlements = await getBusinessEntitlements(business.id);
  const settings = await db.query.businessSettings.findFirst({
    where: eq(businessSettings.businessId, business.id),
  });

  return (
    <SettingsClient
      business={business as Business}
      entitlements={entitlements}
      initialStorefrontLayout={getStorefrontLayoutFromPreferences(settings?.preferences)}
      initialStorefrontTheme={getStorefrontThemeFromPreferences(settings?.preferences)}
      initialHasCustomTheme={hasCustomStorefrontTheme(settings?.preferences)}
      role={role}
      permissions={permissions}
      isOwner={isOwner}
    />
  );
}
