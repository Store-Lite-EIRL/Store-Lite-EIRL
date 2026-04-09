'use server';


import { db } from '@/core/database/client';
import { businesses, businessSettings } from '@/core/database/schema';
import {
  type StorefrontLayout,
  type StorefrontTheme,
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  normalizeStorefrontLayout,
  normalizeStorefrontTheme,
  mergeStorefrontLayoutIntoPreferences,
  mergeStorefrontThemeIntoPreferences,
  clearStorefrontThemeFromPreferences,
} from '@/core/storefront';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAccessOnId } from '../storage/actions/authz';

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
    return { success: false, error: 'Función disponible solo para planes superiores.' };
  }

  if (newSlug.length < 10 || newSlug.length > 30) {
    return { success: false, error: 'El slug debe tener entre 10 y 30 caracteres.' };
  }

  // Verifica que no tenga espacios, tenga solo minúsculas, números y guiones, sin terminar en guión
  if (!/^[a-z0-9][a-z0-9-]*$/.test(newSlug) || newSlug.endsWith('-')) {
    return { success: false, error: 'El slug no admite espacios. Solo puede contener letras minúsculas, números y guiones.' };
  }

  const existing = await db.query.businesses.findFirst({
    where: eq(businesses.slug, newSlug),
    columns: { id: true },
  });

  if (existing && existing.id !== businessId) {
    return { success: false, error: 'Este slug ya está en uso por otro negocio.' };
  }

  try {
    await db
      .update(businesses)
      .set({ slug: newSlug, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath('/', 'layout');
    return { success: true, newSlug };
  } catch (error) {
    console.error('Error updating slug:', error);
    return { success: false, error: 'Error inesperado al actualizar el slug.' };
  }
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
    return { success: false, error: 'Función disponible solo para planes superiores.' };
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
    return { success: false, error: 'Función disponible solo para planes superiores.' };
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
    return { success: true, message: 'Configuración SEO actualizada correctamente.' };
  } catch (error) {
    console.error('Error updating business SEO:', error);
    return { success: false, error: 'Error inesperado al actualizar la configuración SEO.' };
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
    return { success: false, error: 'Función disponible solo para planes con personalización de storefront.' };
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
): Promise<StorefrontThemeActionState> {
  try {
    await requireAccessOnId(businessId, 'storefront.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  if (plan === 'basico' || plan === 'emprendedor') {
    return {
      success: false,
      error: 'Función disponible solo para planes con personalización de storefront.',
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
          themeMode: normalizedTheme.surfaceMode,
          customColors: normalizedTheme.palette,
          preferences: nextPreferences,
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        themeMode: normalizedTheme.surfaceMode,
        contrastLevel: 'standard',
        customColors: normalizedTheme.palette,
        preferences: mergeStorefrontThemeIntoPreferences({}, normalizedTheme),
      });
    }

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Apariencia pública actualizada correctamente.',
      storefrontTheme: normalizedTheme,
    };
  } catch (error) {
    console.error('Error updating storefront theme:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la apariencia pública.',
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
      error: 'Función disponible solo para planes con personalización de storefront.',
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
      return { success: true, message: 'La apariencia pública ya usaba los colores por defecto.' };
    }

    const nextPreferences = clearStorefrontThemeFromPreferences(
      existingSettings.preferences ?? {},
    );

    // Quitamos los customColors de las settings para limpiar la metadata
    await db
      .update(businessSettings)
      .set({
        customColors: null,
        preferences: nextPreferences,
        updatedAt: new Date(),
      })
      .where(eq(businessSettings.businessId, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Apariencia pública restablecida a los colores de la plataforma.',
    };
  } catch (error) {
    console.error('Error clearing storefront theme:', error);
    return {
      success: false,
      error: 'Error inesperado al restablecer la apariencia pública.',
    };
  }
}

export async function updateCulqiCredentials(
  businessId: string,
  publicKey: string,
  secretKey: string,
): Promise<ActionState> {
  try {
    // Reutilizamos el permiso de edición de negocio para las credenciales
    await requireAccessOnId(businessId, 'business.edit');
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado' };
  }

  // Validaciones básicas de formato Culqi
  if (publicKey && !publicKey.startsWith('pk_')) {
    return { success: false, error: 'La llave pública debe comenzar con pk_' };
  }
  if (secretKey && !secretKey.startsWith('sk_')) {
    return { success: false, error: 'La llave secreta debe comenzar con sk_' };
  }

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
          culqiSecretKey: secretKey,
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        culqiPublicKey: publicKey,
        culqiSecretKey: secretKey,
      });
    }

    revalidatePath('/', 'layout');
    return { success: true, message: 'Credenciales de Culqi actualizadas correctamente.' };
  } catch (error) {
    console.error('Error updating Culqi credentials:', error);
    return { success: false, error: 'Error inesperado al actualizar las credenciales.' };
  }
}
