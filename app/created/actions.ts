'use server';



import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, profiles } from '@/core/database/schema';
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

  // 2. Extract Data
  const commercialName = formData.get('commercialName') as string;
  const personType = formData.get('personType') as string;
  const country = formData.get('country') as string;
  const taxId = formData.get('taxId') as string;
  const sector = formData.get('sector') as string;
  const description = formData.get('description') as string;
  const city = formData.get('city') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const legalRepName = formData.get('legalRepName') as string;
  const legalRepRole = formData.get('legalRepRole') as string;
  const legalRepPhone = formData.get('legalRepPhone') as string;
  const legalRepEmail = formData.get('legalRepEmail') as string;
  const logoFile = formData.get('logo') as File | null;

  if (!commercialName || commercialName.length < 3) {
    return { error: 'El nombre comercial es obligatorio.' };
  }

  // 4. Generate Slug
  // Use 'store' as default type for slug generation if sector is generic
  const finalSlug = generateBusinessSlug(commercialName, 'store');

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
