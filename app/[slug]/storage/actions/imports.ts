'use server';

import { db } from '@/core/database/client';
import { productCategories, productMedia, products } from '@/core/database/schema';
import { getUniqueCategorySlug } from '@/shared/utils/categorySlug';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/errorHandling';
import { requireOwnedBusinessBySlug } from './authz';

interface ImportProductInput {
  name: string;
  description: string;
  category: string;
  stock: number;
  price: number;
  status: string;
  imageUrl?: string;
}

export async function importProductsBatch(
  businessSlug: string,
  productsList: ImportProductInput[],
) {
  try {
    const normalizedProductsList = productsList.map((p) => ({
      ...p,
      name: p.name.trim(),
      description: p.description?.trim() || '',
      category: p.category.trim(),
      stock: Math.max(0, Math.trunc(Number.isFinite(p.stock) ? p.stock : 0)),
      price: Math.max(0, Number.isFinite(p.price) ? p.price : 0),
      imageUrl: p.imageUrl?.trim(),
    }));

    const { businessId } = await requireOwnedBusinessBySlug(businessSlug);

    const uniqueCategoryNames = Array.from(
      new Set(normalizedProductsList.map((p) => p.category).filter(Boolean)),
    );

    const categoryMap = new Map<string, string>();

    if (uniqueCategoryNames.length > 0) {
      const existingCategories = await db.query.productCategories.findMany({
        where: eq(productCategories.businessId, businessId),
        columns: { id: true, name: true, slug: true },
      });

      const usedSlugs = new Set(existingCategories.map((c) => c.slug));

      for (const cat of existingCategories) {
        categoryMap.set(cat.name, cat.id);
      }

      const toCreate = uniqueCategoryNames.filter((name) => !categoryMap.has(name));

      if (toCreate.length > 0) {
        const newCategoryRows = await db
          .insert(productCategories)
          .values(
            toCreate.map((name) => ({
              businessId,
              name,
              slug: getUniqueCategorySlug(name, usedSlugs),
            })),
          )
          .returning({ id: productCategories.id, name: productCategories.name });

        for (const cat of newCategoryRows) {
          categoryMap.set(cat.name, cat.id);
        }
      }
    }

    const newProductsData = normalizedProductsList.map((p) => ({
      businessId,
      categoryId: p.category ? categoryMap.get(p.category) || null : null,
      title: p.name,
      description: p.description,
      price: String(p.price),
      stock: p.stock,
      isAvailable: p.status === 'ACTIVO',
    }));

    if (newProductsData.length > 0) {
      const insertedProducts = await db
        .insert(products)
        .values(newProductsData)
        .returning({ id: products.id });

      const mediaValues = insertedProducts
        .map((inserted, idx) => {
          const imgUrl = normalizedProductsList[idx]?.imageUrl;
          if (!imgUrl) return null;
          return {
            productId: inserted.id,
            mediaUrl: imgUrl,
            mediaType: 'image' as const,
            displayOrder: 1,
          };
        })
        .filter(Boolean) as {
        productId: string;
        mediaUrl: string;
        mediaType: 'image';
        displayOrder: number;
      }[];

      if (mediaValues.length > 0) {
        await db.insert(productMedia).values(mediaValues);
      }
    }

    revalidatePath(`/${businessSlug}/storage`);

    return { success: true };
  } catch (error) {
    logError('importProductsBatch', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al importar productos masivamente',
    };
  }
}
