'use server';

import { db } from '@/core/database/client';
import { products } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateProduct, type SaleStatus } from './actions';
import { requireOwnedBusinessBySlug } from './actions/authz';

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
    saleStatus?: SaleStatus;
  },
) {
  try {
    // Delegate to canonical storage action to avoid duplicated update flows.
    const result = await updateProduct(businessSlug, productId, {
      ...payload,
      saleStatus: payload.saleStatus,
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
    const { businessId } = await requireOwnedBusinessBySlug(businessSlug);
    const newStatus = !currentStatus;

    // Guard: when enabling, check plan product limit
    if (newStatus) {
      const entitlements = await getBusinessEntitlements(businessId);
      if (entitlements.maxProducts !== -1) {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(and(eq(products.businessId, businessId), eq(products.isAvailable, true)));

        const activeCount = Number(result[0]?.count ?? 0);
        if (activeCount >= entitlements.maxProducts) {
          return {
            success: false,
            error: `Has alcanzado el límite de ${entitlements.maxProducts} productos activos para tu plan actual. Desactiva otros productos o mejora tu plan para activar este.`,
          };
        }
      }
    }

    await db
      .update(products)
      .set({
        isAvailable: newStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.businessId, businessId)));

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
