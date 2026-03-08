'use server';

import { db } from '@/core/database/client';
import { businesses, productCategories } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getProductCategories(slug: string) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: { id: true },
    });

    if (!business) {
      return { categories: [], error: 'Negocio no encontrado' };
    }

    const categoriesList = await db.query.productCategories.findMany({
      where: eq(productCategories.businessId, business.id),
      columns: { name: true },
      orderBy: (table, { asc }) => [asc(table.name)],
    });

    return {
      categories: categoriesList.map((c) => c.name),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      categories: [],
      error: error instanceof Error ? error.message : 'Error al obtener categorias',
    };
  }
}

export async function syncProductCategories(slug: string, categoryNames: string[]) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: 'Negocio no encontrado' };
    }

    const existingCategories = await db.query.productCategories.findMany({
      where: eq(productCategories.businessId, business.id),
      columns: { id: true, name: true },
    });

    const existingNames = existingCategories.map((c) => c.name);
    const newNames = categoryNames.map((n) => n.trim()).filter(Boolean);

    const toDelete = existingCategories.filter((c) => !newNames.includes(c.name));
    const toAdd = newNames.filter((name) => !existingNames.includes(name));

    if (toDelete.length > 0) {
      for (const cat of toDelete) {
        await db.delete(productCategories).where(eq(productCategories.id, cat.id));
      }
    }

    if (toAdd.length > 0) {
      const newItems = toAdd.map((name) => ({
        businessId: business.id,
        name,
      }));
      await db.insert(productCategories).values(newItems);
    }

    const finalCategories = await db.query.productCategories.findMany({
      where: eq(productCategories.businessId, business.id),
      columns: { name: true },
      orderBy: (table, { asc }) => [asc(table.name)],
    });

    return {
      success: true,
      categories: finalCategories.map((c) => c.name),
    };
  } catch (error) {
    console.error('Error syncing categories:', error);
    return {
      success: false,
      categories: [],
      error: error instanceof Error ? error.message : 'Error al sincronizar categorias',
    };
  }
}

export async function updateCategory(
  businessSlug: string,
  categoryId: string,
  data: {
    name?: string;
    imageUrl?: string | null;
  },
) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: 'Negocio no encontrado' };
    }

    const category = await db.query.productCategories.findFirst({
      where: (categories, { and, eq }) =>
        and(eq(categories.id, categoryId), eq(categories.businessId, business.id)),
      columns: { id: true },
    });

    if (!category) {
      return { success: false, error: 'Categoria no encontrada o acceso denegado' };
    }

    const updateData: Partial<{ name: string; imageUrl: string | null }> = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }

    await db.update(productCategories).set(updateData).where(eq(productCategories.id, categoryId));

    revalidatePath(`/${businessSlug}`);
    revalidatePath(`/${businessSlug}/storage`);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar categoria',
    };
  }
}

export async function createCategory(
  businessSlug: string,
  data: {
    name: string;
    imageUrl?: string | null;
  },
) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: 'Negocio no encontrado' };
    }

    const [newCategory] = await db
      .insert(productCategories)
      .values({
        businessId: business.id,
        name: data.name.trim(),
        imageUrl: data.imageUrl || null,
        displayOrder: 0,
      })
      .returning();

    revalidatePath(`/${businessSlug}`);
    revalidatePath(`/${businessSlug}/storage`);

    return { success: true, category: newCategory, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la categoria',
    };
  }
}
