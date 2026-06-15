'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import type { ActionState as BaseActionState } from '@/types/actions';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export interface ActionState extends BaseActionState {
  url?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Creates a Supabase client with the service role key.
 * USE ONLY in server actions where authorization has already been validated.
 * This client bypasses RLS — never expose to the client side.
 */
function createAdminStorageClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    console.error('[createAdminStorageClient] Missing environment variables:', {
      hasUrl: !!env.supabaseUrl,
      hasServiceKey: !!env.supabaseServiceRoleKey,
    });
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Creates a Supabase client bound to the current user's session (via cookies).
 * Used only to authenticate the user — storage operations use the admin client.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// LOGO DE NEGOCIO
// Bucket: store-covers | Path: logos/{businessId}/{fileName}
// ─────────────────────────────────────────────────────────────────────────────

export async function updateBusinessLogo(
  businessId: string,
  slug: string,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get('file') as File;

  if (!file) return { error: 'No se ha proporcionado ninguna imagen.' };
  if (file.size > MAX_FILE_SIZE) return { error: 'La imagen excede el límite de 1MB.' };

  // 1. Verify user is authenticated
  const supabaseUser = await createUserAuthClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return { error: 'No autorizado. Por favor, inicia sesión.' };

  // 2. Verify ownership via our own DB (not relying on Supabase RLS)
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });
  if (!business || business.ownerId !== user.id) {
    return { error: 'No tienes permiso para editar este negocio.' };
  }

  try {
    // 3. Upload using admin client (bypasses RLS — ownership already verified above)
    const adminStorage = createAdminStorageClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${businessId}/${fileName}`;

    const { error: uploadError } = await adminStorage.storage
      .from('store-covers')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return { error: `Error al subir el logo: ${uploadError.message}` };
    }

    // 4. Get public URL
    const {
      data: { publicUrl },
    } = adminStorage.storage.from('store-covers').getPublicUrl(filePath);

    // 5. Update DB record
    await db
      .update(businesses)
      .set({ logoUrl: publicUrl, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');

    return { success: true, message: 'Logo de empresa actualizado exitosamente.', url: publicUrl };
  } catch (err) {
    console.error('Server Action Error:', err);
    return { error: 'Error inesperado al actualizar el logo.' };
  }
}

export async function updateBusinessData(
  businessId: string,
  slug: string,
  data: Partial<{
    name: string;
    description: string;
    address: string;
    departamento: string;
    provincia: string;
    distrito: string;
    storeType: string;
    whatsappNumber: string;
    taxId: string;
    personType: string;
    country: string;
    city: string;
    email: string;
    legalRepName: string;
    legalRepRole: string;
    legalRepPhone: string;
    legalRepEmail: string;
  }>,
): Promise<ActionState> {
  // 1. Verify user is authenticated
  const supabaseUser = await createUserAuthClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return { error: 'No autorizado. Por favor, inicia sesión.' };

  // 2. Verify ownership
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });
  if (!business || business.ownerId !== user.id) {
    return { error: 'No tienes permiso para editar este negocio.' };
  }

  try {
    // 3. Update DB record
    await db
      .update(businesses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');

    return { success: true, message: 'Información del negocio actualizada correctamente.' };
  } catch (err) {
    console.error('Server Action Error:', err);
    return { error: 'Error inesperado al actualizar la información del negocio.' };
  }
}

export async function removeBusinessLogo(businessId: string, slug: string): Promise<ActionState> {
  const authCheck = await assertBusinessOwnershipOrFail(businessId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    const adminStorage = createAdminStorageClient();
    const { data: files } = await adminStorage.storage
      .from('store-covers')
      .list(`logos/${businessId}`);

    if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `logos/${businessId}/${f.name}`);
      const { error: deleteError } = await adminStorage.storage
        .from('store-covers')
        .remove(pathsToDelete);
      if (deleteError) return { error: `Error al eliminar el logo: ${deleteError.message}` };
    }

    await db
      .update(businesses)
      .set({ logoUrl: null, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    return { success: true, message: 'Logo eliminado.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICIDAD (Hero / portada del negocio)
// Bucket: store-covers | Path: portadas/{businessId}/{fileName}
// ─────────────────────────────────────────────────────────────────────────────

export async function updateBusinessCover(
  businessId: string,
  slug: string,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get('file') as File;

  if (!file) {
    console.warn('[updateBusinessCover] No file provided in formData');
    return { error: 'No se ha proporcionado ninguna imagen.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    console.warn('[updateBusinessCover] File too large:', file.size);
    return { error: 'La imagen excede el límite de 1MB.' };
  }

  console.warn('[updateBusinessCover] Starting upload:', {
    businessId,
    slug,
    fileName: file.name,
    fileSize: file.size,
  });

  // 1. Verify user is authenticated
  const supabaseUser = await createUserAuthClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    console.warn('[updateBusinessCover] User not authenticated');
    return { error: 'No autorizado.' };
  }
  console.warn('[updateBusinessCover] User authenticated:', user.id);

  // 2. Verify ownership
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });
  if (!business) {
    console.warn('[updateBusinessCover] Business not found:', businessId);
    return { error: 'Negocio no encontrado.' };
  }
  if (business.ownerId !== user.id) {
    console.warn('[updateBusinessCover] Unauthorized. Owner:', business.ownerId, 'User:', user.id);
    return { error: 'No tienes permiso para editar este negocio.' };
  }

  try {
    // 3. Delete existing images to avoid accumulating unused files
    console.warn('[updateBusinessCover] Listing existing files to delete...');
    const adminStorage = createAdminStorageClient();
    const { data: existingFiles } = await adminStorage.storage
      .from('store-covers')
      .list(`portadas/${businessId}`);

    if (existingFiles && existingFiles.length > 0) {
      console.warn(
        '[updateBusinessCover] Found existing files, deleting...',
        existingFiles.map((f) => f.name),
      );
      const pathsToDelete = existingFiles.map((f) => `portadas/${businessId}/${f.name}`);
      const { error: deleteError } = await adminStorage.storage
        .from('store-covers')
        .remove(pathsToDelete);

      if (deleteError) {
        console.warn('Could not delete old images:', deleteError);
      }
    } else {
      console.warn('[updateBusinessCover] No existing images found.');
    }

    // 4. Upload using admin client
    const fileExt = file.name.split('.').pop();
    const fileName = `portada-${Date.now()}.${fileExt}`;
    const filePath = `portadas/${businessId}/${fileName}`;

    console.warn('[updateBusinessCover] Ready to upload new file to path:', filePath);
    const { error: uploadError } = await adminStorage.storage
      .from('store-covers')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('[updateBusinessCover] Storage upload error:', uploadError);
      return { error: `Error al subir la publicidad: ${uploadError.message}` };
    }
    console.warn('[updateBusinessCover] Upload successful. Path:', filePath);

    const {
      data: { publicUrl },
    } = adminStorage.storage.from('store-covers').getPublicUrl(filePath);

    // 5. Update DB record
    console.warn('[updateBusinessCover] Updating DB with URL:', publicUrl);
    await db
      .update(businesses)
      .set({ coverImageUrl: publicUrl, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    console.warn('[updateBusinessCover] Success');
    return { success: true, url: publicUrl, message: 'Publicidad actualizada.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}

export async function removeBusinessCover(businessId: string, slug: string): Promise<ActionState> {
  const authCheck = await assertBusinessOwnershipOrFail(businessId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    const adminStorage = createAdminStorageClient();
    const { data: files } = await adminStorage.storage
      .from('store-covers')
      .list(`portadas/${businessId}`);

    if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `portadas/${businessId}/${f.name}`);
      const { error: deleteError } = await adminStorage.storage
        .from('store-covers')
        .remove(pathsToDelete);
      if (deleteError) return { error: `Error al eliminar la publicidad: ${deleteError.message}` };
    }

    await db
      .update(businesses)
      .set({ coverImageUrl: null, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));

    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    return { success: true, message: 'Publicidad eliminada.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}
