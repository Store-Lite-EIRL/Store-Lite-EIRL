'use server';



import { env } from '@/config/env';
import { generateAvailableBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { businesses, businessSettings, profiles } from '@/core/database/schema';
import {
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  mergeStorefrontLayoutIntoPreferences,
  mergeStorefrontThemeIntoPreferences,
  normalizeStorefrontTheme,
} from '@/core/storefront';
import { generateBusinessSlug } from '@/shared/utils/slugify';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function createBusinessAction(formData: FormData) {
  const cookieStore = await cookies();

  // 1. Get authenticated user
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
    return { error: 'Unauthorized' };
  }

  // 1.5 Ensure Profile Exists
  const userId = user.id;
  const userEmail = user.email ?? '';

  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!existingProfile) {
    await db.insert(profiles).values({
      id: userId,
      email: userEmail,
      fullName:
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        userEmail.split('@')[0] ||
        'Unknown User',
      avatarUrl: user.user_metadata.avatar_url,
    });
  }

  // 1.7 Check Business Limit (Max 3)
  const userBusinessesCount = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, userId),
    columns: { id: true },
  });

  if (userBusinessesCount.length >= 3) {
    return {
      error: 'Has alcanzado el límite máximo de 3 negocios por cuenta.',
    };
  }

  // 2. Validate Data using Zod
  const rawData = {
    commercialName: formData.get('commercialName'),
    personType: formData.get('personType'),
    country: formData.get('country'),
    taxId: formData.get('taxId'),
    sector: formData.get('sector'),
    description: formData.get('description'),
    city: formData.get('city'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    legalRepName: formData.get('legalRepName'),
    legalRepRole: formData.get('legalRepRole'),
    legalRepPhone: formData.get('legalRepPhone'),
    legalRepEmail: formData.get('legalRepEmail'),
    storefrontTheme: formData.get('storefrontTheme'),
  };

  const { createBusinessSchema } = await import('@/features/business/schemas');
  const validationResult = createBusinessSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0]?.message;
    return { error: firstError || 'Datos de entrada no válidos' };
  }

  const {
    commercialName,
    personType,
    country,
    taxId,
    sector,
    description,
    city,
    address,
    phone,
    email,
    legalRepName,
    legalRepRole,
    legalRepPhone,
    legalRepEmail,
    storefrontTheme: rawStorefrontTheme,
  } = validationResult.data;

  const logoFile = formData.get('logo') as File | null;

  let storefrontTheme = createDefaultStorefrontTheme();

  if (typeof rawStorefrontTheme === 'string' && rawStorefrontTheme.trim().length > 0) {
    try {
      storefrontTheme = normalizeStorefrontTheme(JSON.parse(rawStorefrontTheme));
    } catch (error) {
      console.warn('[createBusinessAction] Invalid storefront theme payload, using default.', error);
    }
  }

  if (!commercialName || commercialName.length < 3) {
    return { error: 'El nombre comercial es obligatorio.' };
  }

  // 4. Generate Slug
  // Use 'store' as default type for slug generation if sector is generic
  const finalSlug = await generateAvailableBusinessSlug(() =>
    generateBusinessSlug(commercialName, 'store'),
  );

  console.warn(
    '[createBusinessAction] Initiating business creation with logo size:',
    logoFile?.size || 0,
  );

  try {
    // 5. Insert into Database
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        ownerId: userId,
        name: commercialName,
        slug: finalSlug,
        taxId,
        personType,
        country,
        city,
        address,
        email,
        whatsappNumber: phone,
        description,
        legalRepName,
        legalRepRole,
        legalRepPhone,
        legalRepEmail,
        isActive: true,
        storeType: sector, // Map sector to storeType for now
      })
      .returning({ id: businesses.id });

    const businessId = newBusiness.id;
    console.warn('[createBusinessAction] DB insertion success:', businessId);

    const preferencesWithLayout = mergeStorefrontLayoutIntoPreferences(
      {},
      createDefaultStorefrontLayout(),
    );
    const initialPreferences = mergeStorefrontThemeIntoPreferences(
      preferencesWithLayout,
      storefrontTheme,
    );

    await db.insert(businessSettings).values({
      businessId,
      themeMode: storefrontTheme.surfaceMode,
      contrastLevel: 'standard',
      customColors: storefrontTheme.palette,
      preferences: initialPreferences,
    });

    // 3. Handle Logo Upload
    if (logoFile && logoFile.size > 0) {
      console.warn('[createBusinessAction] Preparing logo upload for business:', businessId);

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `logos/${businessId}/${fileName}`;

      // USE ADMIN STORAGE CLIENT to bypass RLS for uploads (as done in other actions)
      const { createClient } = await import('@supabase/supabase-js');
      const adminStorage = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      console.warn('[createBusinessAction] Uploading to store-covers:', filePath);
      const { error: uploadError } = await adminStorage.storage
        .from('store-covers')
        .upload(filePath, logoFile);

      if (uploadError) {
        console.error(
          '[createBusinessAction] Storage error from Supabase (bypassing RLS):',
          uploadError,
        );
        return { error: `Error al subir el logo: ${uploadError.message}` };
      }

      console.warn('[createBusinessAction] Upload successful:', filePath);

      const {
        data: { publicUrl },
      } = adminStorage.storage.from('store-covers').getPublicUrl(filePath);

      console.warn('[createBusinessAction] Final logo URL:', publicUrl);

      await db
        .update(businesses)
        .set({ logoUrl: publicUrl })
        .where(eq(businesses.id, businessId));
    }

    console.warn('[createBusinessAction] Creation fully completed for slug:', finalSlug);
    return { success: true, slug: finalSlug };
  } catch (error) {
    console.error('[createBusinessAction] Top level catch block error:', error);
    return { error: 'Error al guardar los datos en la base de datos.' };
  }
}

export async function checkUserHasBusinessesAction() {
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
    return { hasBusinesses: false };
  }

  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
    limit: 1,
  });

  return { hasBusinesses: userBusinesses.length > 0 };
}
