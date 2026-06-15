'use server';

import { env } from '@/config/env';
import { generateAvailableBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { businesses, profiles } from '@/core/database/schema';
import { createBusinessSchema } from '@/features/business/schemas';
import { generateBusinessSlug } from '@/shared/utils/slugify';
import { getBusinessPath } from '@/shared/utils/url';
import type { ActionState } from '@/types/actions';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Action: Creates a new business store.
 * Validates input using Zod and enforces limits.
 */
export async function createBusiness(prevState: ActionState, formData: FormData) {
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

  let existingProfile;
  try {
    existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });
  } catch (dbError) {
    console.error('CRITICAL: Database connection failed during profile lookup:', dbError);
    return {
      error:
        'Error de conexión con la base de datos. Por favor, verifica tu configuración de DATABASE_URL.',
    };
  }

  if (!existingProfile) {
    console.warn('Profile missing for user, creating one...', userId);
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

  // 1.7 Enforce limit (Max 3 businesses)
  let userBusinesses;
  try {
    userBusinesses = await db.query.businesses.findMany({
      where: eq(businesses.ownerId, userId),
    });
  } catch (dbError) {
    console.error('CRITICAL: Database connection failed during limit check:', dbError);
    return { error: 'Error al verificar límites de cuenta. Inténtalo de nuevo más tarde.' };
  }

  if (userBusinesses.length >= 3) {
    return { error: 'Has alcanzado el límite de 3 empresas permitidas en el plan gratuito.' };
  }

  // 2. Validate Data using Zod
  const rawData = {
    name: formData.get('name'),
    storeType: formData.get('storeType'),
    description: formData.get('description'),
    address: formData.get('address'),
    whatsappNumber: formData.get('whatsappNumber'),
  };

  const validationResult = createBusinessSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]?.message;
    return { error: firstError || 'Datos de entrada no válidos' };
  }

  const data = validationResult.data as any;
  const { name, storeType, description, address, whatsappNumber } = data;

  // 3. Generate Slug (Refactored to utility)
  const finalSlug = await generateAvailableBusinessSlug(() =>
    generateBusinessSlug(name, storeType),
  );

  try {
    // 4. Insert into Database
    await db.insert(businesses).values({
      ownerId: userId,
      name,
      slug: finalSlug,
      storeType,
      description: description || null,
      address: address || null,
      whatsappNumber: whatsappNumber || null,
      isActive: true,
    });
  } catch (error) {
    console.error('Error creating business:', error);
    return { error: 'Error al crear la empresa. Inténtalo de nuevo.' };
  }

  // 5. Redirect outside try/catch because NEXT_REDIRECT throws an error
  redirect(getBusinessPath(finalSlug));
}
