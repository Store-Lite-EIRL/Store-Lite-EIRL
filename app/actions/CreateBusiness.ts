'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, profiles } from '@/core/database/schema';
import { generateBusinessSlug } from '@/shared/utils/slugify';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface ActionState {
  error?: string;
}

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

  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

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
  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, userId),
  });

  if (userBusinesses.length >= 3) {
    return { error: 'Has alcanzado el límite de 3 empresas permitidas en el plan gratuito.' };
  }

  // 2. Extract Data
  const name = formData.get('name') as string;
  const storeType = formData.get('storeType') as string;
  const description = formData.get('description') as string;
  const address = formData.get('address') as string;
  const whatsappNumber = formData.get('whatsappNumber') as string;

  if (!name || name.length < 3) {
    return { error: 'El nombre es obligatorio y debe tener al menos 3 caracteres.' };
  }

  // 3. Generate Slug (Refactored to utility)
  const finalSlug = generateBusinessSlug(name, storeType);

  try {
    // 4. Insert into Database
    await db.insert(businesses).values({
      ownerId: userId,
      name,
      slug: finalSlug,
      storeType,
      description,
      address,
      whatsappNumber,
      isActive: true,
    });
  } catch (error) {
    console.error('Error creating business:', error);
    return { error: 'Error al crear la empresa. Inténtalo de nuevo.' };
  }

  // 5. Redirect outside try/catch because NEXT_REDIRECT throws an error
  redirect(`/${finalSlug}`);
}
