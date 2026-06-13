'use server';

import { isBusinessSlugTaken } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { businesses, businessSettings, businessSlugAliases } from '@/core/database/schema';
import {
  type StorefrontLayout,
  type StorefrontTheme,
  clearStorefrontThemeFromPreferences,
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  mergeStorefrontLayoutIntoPreferences,
  mergeStorefrontThemeIntoPreferences,
  normalizeStorefrontLayout,
  normalizeStorefrontTheme,
} from '@/core/storefront';
import { requireAccessOnId } from '@/features/storage/actions/authz';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

export interface SlugActionState extends ActionState {
  newSlug?: string;
}

export interface ToggleActionState extends ActionState {
  isActive?: boolean;
}

export async function updateBusinessSlug(
  businessId: string,
  newSlug: string,
  plan: string,
): Promise<SlugActionState> {
  try {
    await requireAccessOnId(businessId, 'business.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico') {
    return { success: false, error: 'Funcion disponible solo para planes superiores.' };
  }

  if (newSlug.length < 10 || newSlug.length > 30) {
    return { success: false, error: 'El slug debe tener entre 10 y 30 caracteres.' };
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(newSlug) || newSlug.endsWith('-')) {
    return {
      success: false,
      error:
        'El slug no admite espacios. Solo puede contener letras minusculas, numeros y guiones.',
    };
  }

  const currentBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true, slug: true },
  });

  if (!currentBusiness) {
    return { success: false, error: 'Negocio no encontrado.' };
  }

  if (currentBusiness.slug === newSlug) {
    return { success: true, newSlug };
  }

  if (await isBusinessSlugTaken(newSlug, { excludeBusinessId: businessId })) {
    return {
      success: false,
      error: 'Este slug ya esta¡ en uso por otro negocio o reservado por un redirect previo.',
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(businessSlugAliases)
        .values({ businessId, slug: currentBusiness.slug })
        .onConflictDoNothing();

      await tx
        .update(businesses)
        .set({ slug: newSlug, updatedAt: new Date() })
        .where(eq(businesses.id, businessId));

      await tx
        .delete(businessSlugAliases)
        .where(
          and(
            eq(businessSlugAliases.businessId, businessId),
            eq(businessSlugAliases.slug, newSlug),
          ),
        );
    });

    revalidatePath(`/${currentBusiness.slug}`);
    revalidatePath(`/${currentBusiness.slug}/settings`);
    revalidatePath(`/${newSlug}`);
    revalidatePath(`/${newSlug}/settings`);
    revalidatePath('/', 'layout');
    return { success: true, newSlug };
  } catch (error) {
    console.error('Error updating slug:', error);
    return { success: false, error: 'Error inesperado al actualizar el slug.' };
  }
}

export async function checkSlugAvailability(
  slug: string,
  businessId: string,
): Promise<{ success: boolean; available: boolean; error?: string }> {
  try {
    await requireAccessOnId(businessId, 'business.edit');
  } catch {
    return { success: false, available: false, error: 'No autorizado' };
  }

  if (slug.length < 10 || slug.length > 30) {
    return { success: true, available: false };
  }

  const taken = await isBusinessSlugTaken(slug, { excludeBusinessId: businessId });
  return { success: true, available: !taken };
}

export async function toggleBusinessActive(
  businessId: string,
  currentIsActive: boolean,
  plan: string,
): Promise<ToggleActionState> {
  try {
    await requireAccessOnId(businessId, 'business.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico') {
    return { success: false, error: 'Funcion disponible solo para planes superiores.' };
  }

  try {
    const nextState = !currentIsActive;
    await db
      .update(businesses)
      .set({ isActive: nextState, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath('/', 'layout');

    return { success: true, isActive: nextState };
  } catch (error) {
    console.error('Error toggling business active state:', error);
    return { success: false, error: 'Error inesperado al cambiar estado del negocio.' };
  }
}

export interface SEOActionInput {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  latitude?: string | null;
  longitude?: string | null;
  geoRegion?: string | null;
  geoPlacename?: string | null;
}

export interface StorefrontLayoutActionState extends ActionState {
  layout?: StorefrontLayout;
}

export interface StorefrontThemeActionState extends ActionState {
  storefrontTheme?: StorefrontTheme;
}

export async function updateBusinessSEO(
  businessId: string,
  seoData: SEOActionInput,
  plan: string,
): Promise<ActionState> {
  try {
    await requireAccessOnId(businessId, 'seo.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico') {
    return { success: false, error: 'Funcion disponible solo para planes superiores.' };
  }

  try {
    await db
      .update(businesses)
      .set({
        seoTitle: seoData.seoTitle,
        seoDescription: seoData.seoDescription,
        seoKeywords: seoData.seoKeywords,
        latitude: seoData.latitude,
        longitude: seoData.longitude,
        geoRegion: seoData.geoRegion,
        geoPlacename: seoData.geoPlacename,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    revalidatePath('/', 'layout');
    return { success: true, message: 'Configuracion SEO actualizada correctamente.' };
  } catch (error) {
    console.error('Error updating business SEO:', error);
    return { success: false, error: 'Error inesperado al actualizar la configuracion SEO.' };
  }
}

export async function updateStorefrontLayout(
  businessId: string,
  slug: string,
  layout: StorefrontLayout,
  plan: string,
): Promise<StorefrontLayoutActionState> {
  try {
    await requireAccessOnId(businessId, 'storefront.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico' || plan === 'emprendedor') {
    return {
      success: false,
      error: 'Funcion disponible solo para planes con personalizacion de storefront.',
    };
  }

  const normalizedLayout = normalizeStorefrontLayout(layout);

  try {
    const existingSettings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: {
        id: true,
        preferences: true,
      },
    });

    const nextPreferences = mergeStorefrontLayoutIntoPreferences(
      existingSettings?.preferences ?? {},
      normalizedLayout,
    );

    if (existingSettings) {
      await db
        .update(businessSettings)
        .set({
          preferences: nextPreferences,
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        themeMode: 'light',
        contrastLevel: 'standard',
        preferences: mergeStorefrontLayoutIntoPreferences({}, normalizedLayout),
      });
    }

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Layout del storefront actualizado correctamente.',
      layout: normalizedLayout,
    };
  } catch (error) {
    console.error('Error updating storefront layout:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar el layout del storefront.',
      layout: createDefaultStorefrontLayout(),
    };
  }
}

export async function updateStorefrontTheme(
  businessId: string,
  slug: string,
  storefrontTheme: StorefrontTheme,
  plan: string,
  themeMode?: 'light' | 'dark',
): Promise<StorefrontThemeActionState> {
  try {
    await requireAccessOnId(businessId, 'storefront.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico' || plan === 'emprendedor') {
    return {
      success: false,
      error: 'Funcion disponible solo para planes con personalizacion de storefront.',
    };
  }

  const normalizedTheme = normalizeStorefrontTheme(storefrontTheme);

  try {
    const existingSettings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: {
        id: true,
        preferences: true,
      },
    });

    const nextPreferences = mergeStorefrontThemeIntoPreferences(
      existingSettings?.preferences ?? {},
      normalizedTheme,
    );

    if (existingSettings) {
      await db
        .update(businessSettings)
        .set({
          preferences: nextPreferences,
          ...(themeMode && { themeMode }),
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        themeMode: themeMode ?? 'light',
        contrastLevel: 'standard',
        preferences: mergeStorefrontThemeIntoPreferences({}, normalizedTheme),
      });
    }

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Apariencia publica actualizada correctamente.',
      storefrontTheme: normalizedTheme,
    };
  } catch (error) {
    console.error('Error updating storefront theme:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la apariencia publica.',
      storefrontTheme: createDefaultStorefrontTheme(),
    };
  }
}

export async function clearStorefrontTheme(
  businessId: string,
  slug: string,
  plan: string,
): Promise<ActionState> {
  try {
    await requireAccessOnId(businessId, 'storefront.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico' || plan === 'emprendedor') {
    return {
      success: false,
      error: 'Funcion disponible solo para planes con personalizacion de storefront.',
    };
  }

  try {
    const existingSettings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: {
        id: true,
        preferences: true,
      },
    });

    if (!existingSettings) {
      return { success: true, message: 'La apariencia publica ya usaba los colores por defecto.' };
    }

    const nextPreferences = clearStorefrontThemeFromPreferences(existingSettings.preferences ?? {});

    await db
      .update(businessSettings)
      .set({
        preferences: nextPreferences,
        updatedAt: new Date(),
      })
      .where(eq(businessSettings.businessId, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Apariencia publica restablecida a los colores de la plataforma.',
    };
  } catch (error) {
    console.error('Error clearing storefront theme:', error);
    return {
      success: false,
      error: 'Error inesperado al restablecer la apariencia publica.',
    };
  }
}

export async function updateCulqiCredentials(
  businessId: string,
  publicKey: string,
  secretKey: string,
  plan: string,
): Promise<ActionState> {
  try {
    await requireAccessOnId(businessId, 'business.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }
  if (plan !== 'business_pro' && plan !== 'enterprise_ai') {
    return {
      success: false,
      error: 'La configuracion de pagos solo esta disponible en planes premium.',
    };
  }
  if (publicKey && !publicKey.startsWith('pk_')) {
    return { success: false, error: 'La llave publica debe comenzar con pk_' };
  }
  if (secretKey && !secretKey.startsWith('sk_')) {
    return { success: false, error: 'La llave secreta debe comenzar con sk_' };
  }

  // Validate keys format
  const { z } = await import('zod');
  const keySchema = z.object({
    publicKey: z.string().startsWith('pk_'),
    secretKey: z.string().startsWith('sk_'),
  });

  const validation = keySchema.safeParse({ publicKey, secretKey });
  if (!validation.success) {
    return {
      success: false,
      error: 'Formato de llave Culqi inválido. Debe empezar con pk_ y sk_.',
    };
  }

  // 🔥 SECURITY: Encrypt the secret key before DB storage
  const { encrypt } = await import('@/utils/crypto');
  const encryptedSecretKey = encrypt(secretKey);

  try {
    const existingSettings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: { id: true },
    });

    if (existingSettings) {
      await db
        .update(businessSettings)
        .set({
          culqiPublicKey: publicKey,
          culqiSecretKey: encryptedSecretKey,
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        culqiPublicKey: publicKey,
        culqiSecretKey: encryptedSecretKey,
      });
    }

    revalidatePath('/', 'layout');
    return { success: true, message: 'Credenciales de Culqi actualizadas correctamente.' };
  } catch (error) {
    console.error('Error updating Culqi credentials:', error);
    return { success: false, error: 'Error inesperado al actualizar las credenciales.' };
  }
}
