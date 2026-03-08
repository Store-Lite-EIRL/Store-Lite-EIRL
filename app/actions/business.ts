'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  url?: string;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function updateBusinessCover(
  businessId: string,
  slug: string,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies();
  const file = formData.get('file') as File;

  if (!file) {
    return { error: 'No se ha proporcionado ninguna imagen.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'La imagen excede el límite de 1MB.' };
  }

  // 1. Authenticate ... (rest of authentication logic remains the same)
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
    return { error: 'No autorizado. Por favor, inicia sesión.' };
  }

  // 2. Validate Ownership
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });

  if (!business || business.ownerId !== user.id) {
    return { error: 'No tienes permiso para editar este negocio.' };
  }

  try {
    // 3. Upload to Supabase Storage - This is the LOGO (brand)
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${businessId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('store-covers')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return { error: `Error al subir el logo: ${uploadError.message}` };
    }

    // 4. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('store-covers').getPublicUrl(filePath);

    // 7. Update Business coverImageUrl (Logo)
    await db
      .update(businesses)
      .set({
        coverImageUrl: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    // 6. Revalidate
    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');

    return {
      success: true,
      message: 'Logo de empresa actualizado exitosamente.',
      url: publicUrl,
    };
  } catch (err) {
    console.error('Server Action Error:', err);
    return { error: 'Error inesperado al actualizar el logo.' };
  }
}

export async function removeBusinessCover(businessId: string, slug: string): Promise<ActionState> {
  // Existing removal logic for coverImageUrl (Logo)
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
    return { error: 'No autorizado.' };
  }

  try {
    const { data: files } = await supabase.storage.from('store-covers').list(`logos/${businessId}`);
    if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `logos/${businessId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('store-covers')
        .remove(pathsToDelete);
      if (deleteError) {
        return { error: `Error al eliminar el logo: ${deleteError.message}` };
      }
    }

    await db
      .update(businesses)
      .set({ coverImageUrl: null, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));
    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    return { success: true, message: 'Logo eliminado.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}

export async function updateBusinessLogo(
  businessId: string,
  slug: string,
  formData: FormData,
): Promise<ActionState> {
  // This is the PUBLICIDAD (Hero) -> logoUrl
  const cookieStore = await cookies();
  const file = formData.get('file') as File;

  if (!file) {
    return { error: 'No se ha proporcionado ninguna imagen.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'La imagen excede el límite de 1MB.' };
  }

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
    return { error: 'No autorizado.' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `portada-${Date.now()}.${fileExt}`;
    const filePath = `portadas/${businessId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images') // Path: product-images/portadas/{businessId}/...
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { error: `Error al subir la publicidad: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    await db
      .update(businesses)
      .set({ logoUrl: publicUrl, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));
    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    return { success: true, url: publicUrl, message: 'Publicidad actualizada.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}

export async function removeBusinessLogo(businessId: string, slug: string): Promise<ActionState> {
  // Clearing Hero Advertising (logoUrl)
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
    return { error: 'No autorizado.' };
  }

  try {
    const { data: files } = await supabase.storage
      .from('product-images')
      .list(`portadas/${businessId}`);
    if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `portadas/${businessId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove(pathsToDelete);
      if (deleteError) {
        return { error: `Error al eliminar la publicidad: ${deleteError.message}` };
      }
    }

    await db
      .update(businesses)
      .set({ logoUrl: null, updatedAt: new Date() })
      .where(eq(businesses.id, businessId));
    revalidatePath(`/${slug}`);
    revalidatePath('/list-business');
    return { success: true, message: 'Publicidad eliminada.' };
  } catch (err) {
    console.error(err);
    return { error: 'Error inesperado.' };
  }
}
