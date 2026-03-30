'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
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

async function createUserAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

async function assertBusinessOwnershipOrFail(businessId: string) {
  const supabaseUser = await createUserAuthClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return { user: null, error: 'No autorizado.' as const };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });

  if (!business || business.ownerId !== user.id) {
    return { user, error: 'No tienes permiso para editar este negocio.' as const };
  }

  return { user, error: null };
}

export async function updateBusinessSlug(
  businessId: string,
  newSlug: string,
  plan: string,
): Promise<SlugActionState> {
  const authCheck = await assertBusinessOwnershipOrFail(businessId);
  if (authCheck.error) return { success: false, error: authCheck.error };

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
  const authCheck = await assertBusinessOwnershipOrFail(businessId);
  if (authCheck.error) return { success: false, error: authCheck.error };

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
