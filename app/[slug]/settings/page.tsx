import { env } from '@/config/env';
import { replaceSlugInPath, resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { businessSettings } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import {
  getStorefrontLayoutFromPreferences,
  getStorefrontThemeFromPreferences,
  hasCustomStorefrontTheme,
} from '@/core/storefront';
import { getMemberPermissions } from '@/lib/permissions/checkPermission';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SettingsClient, type SettingsBusiness } from './components/SettingsClient';

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  return {
    title: business ? `Ajustes — ${business.name}` : 'Ajustes | Store Lite',
    description: 'Configuración y preferencias de tu negocio.',
    robots: { index: false, follow: false },
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  const resolvedBusiness = await resolveBusinessSlug(slug);
  const business = resolvedBusiness?.business;

  if (!business) {
    return notFound();
  }

  if (resolvedBusiness.matchedAlias) {
    redirect(replaceSlugInPath(`/${slug}/settings`, slug, resolvedBusiness.canonicalSlug));
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    columns: {
      themeMode: true,
      culqiPublicKey: true,
      culqiSecretKey: true,
      preferences: true,
    },
  });

  return (
    <SettingsClient
      business={
        {
          ...business,
          culqiPublicKey: settings?.culqiPublicKey ?? null,
          culqiSecretKey: settings?.culqiSecretKey ?? null,
        } as SettingsBusiness
      }
      entitlements={entitlements}
      initialStorefrontLayout={getStorefrontLayoutFromPreferences(settings?.preferences)}
      initialStorefrontTheme={getStorefrontThemeFromPreferences(settings?.preferences)}
      initialHasCustomTheme={hasCustomStorefrontTheme(settings?.preferences)}
      initialScheme={settings?.themeMode ?? 'light'}
      role={role}
      permissions={permissions}
      isOwner={isOwner}
    />
  );
}
