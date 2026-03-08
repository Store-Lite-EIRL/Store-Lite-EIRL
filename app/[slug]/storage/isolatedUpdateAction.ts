'use server';

import { db } from '@/core/database/client';
import { products } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateProduct } from './actions';

export async function updateProductIsolated(
  businessSlug: string,
  productId: string,
  payload: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    status: string;
    images: string[];
    brand?: string;
    tags?: string[];
    shippingInfo?: string;
    secondPrice?: number;
    saleStatus?: string;
  },
) {
  try {
    // Delegate to canonical storage action to avoid duplicated update flows.
    const result = await updateProduct(businessSlug, productId, {
      ...payload,
      saleStatus: payload.saleStatus as any,
    });
    return { success: result.success, error: result.error ?? undefined };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Error updating product in isolated action' };
  }
}

export async function toggleProductStatus(
  productId: string,
  currentStatus: boolean,
  businessSlug: string,
) {
  try {
    const newStatus = !currentStatus;

    await db
      .update(products)
      .set({
        isAvailable: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath(`/${businessSlug}`);

    return { success: true, newStatus };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message };
  }
}

export async function toggleLikeProductIsolated(productId: string, businessSlug?: string) {
  try {
    const { toggleLikeProduct } = await import('./actions');
    return await toggleLikeProduct(productId, businessSlug);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Error toggling like' };
  }
}
