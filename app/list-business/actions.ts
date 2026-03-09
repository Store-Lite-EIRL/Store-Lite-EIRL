'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, productMedia, products } from '@/core/database/schema';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function deleteBusinessAction(businessId: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autenticado');
  }

  // 2. Verify ownership and existence
  const business = await db.query.businesses.findFirst({
    where: (businesses, { and, eq }) =>
      and(eq(businesses.id, businessId), eq(businesses.ownerId, user.id)),
  });

  if (!business) {
    throw new Error('Empresa no encontrada o no tienes permisos para eliminarla');
  }

  try {
    // 3. Collect image paths to delete from storage
    // We need to find all products of this business first
    const businessProducts = await db.query.products.findMany({
      where: eq(products.businessId, businessId),
      columns: { id: true },
    });

    const productIds = businessProducts.map((p) => p.id);

    if (productIds.length > 0) {
      const media = await db.query.productMedia.findMany({
        where: inArray(productMedia.productId, productIds),
        columns: { mediaUrl: true },
      });

      const pathsToDelete = media
        .map((m) => {
          // Extract path from URL (Assuming URL format includes bucket name or similar)
          // Usually Supabase public URL is https://.../storage/v1/object/public/product-images/path/to/file
          const parts = m.mediaUrl.split('/product-images/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter((path): path is string => !!path);

      if (pathsToDelete.length > 0) {
        // Use service role if available or appropriate, but here we use the user client
        // Actually, for storage we need to ensure the user has permissions to delete from bucket
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(pathsToDelete);

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
          // We might continue anyway to delete the DB record, but logging it is good
        }
      }
    }

    // 4. Delete business (cascades in DB)
    await db.delete(businesses).where(eq(businesses.id, businessId));

    // 5. Revalidate
    revalidatePath('/list-business');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteBusinessAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar la empresa',
    };
  }
}
