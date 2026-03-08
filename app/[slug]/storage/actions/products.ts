'use server';

import { db } from '@/core/database/client';
import {
  businesses,
  productCategories,
  productLikes,
  productMedia,
  products,
} from '@/core/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export type SaleStatus = 'NORMAL' | 'MAS_VENDIDO' | 'NUEVO_PRODUCTO';

interface ProductActionInput {
  name: string;
  description?: string;
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
}

function normalizeProductInput(input: ProductActionInput): ProductActionInput {
  const normalizedPrice = Number.isFinite(input.price) ? input.price : 0;
  const normalizedStock = Number.isFinite(input.stock) ? input.stock : 0;

  return {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    price: Math.max(0, normalizedPrice),
    stock: Math.max(0, Math.trunc(normalizedStock)),
    category: input.category.trim(),
    status: input.status,
    images: input.images.map((url) => url.trim()).filter(Boolean),
    brand: input.brand?.trim(),
    tags: input.tags?.map((t) => t.trim()).filter(Boolean),
    shippingInfo: input.shippingInfo?.trim(),
    secondPrice: input.secondPrice,
    saleStatus: input.saleStatus,
  };
}

export async function getProductsByBusinessSlug(slug: string) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: { id: true },
    });

    if (!business) {
      return { products: [], error: null };
    }

    const productsList = await db.query.products.findMany({
      where: eq(products.businessId, business.id),
      with: {
        category: {
          columns: {
            name: true,
          },
        },
        media: {
          orderBy: (media, { asc }) => [asc(media.displayOrder)],
          columns: {
            mediaUrl: true,
            displayOrder: true,
          },
        },
      },
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
    });

    const transformedProducts = productsList.map((product) => ({
      id: product.id,
      name: product.title,
      category: product.category?.name || 'Sin categoria',
      stock: product.stock,
      price: String(product.price),
      status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
      image: product.media[0]?.mediaUrl || '',
      images: product.media.map((m) => m.mediaUrl),
      description: product.description || '',
      currency: product.currency,
      brand: product.brand,
      tags: product.tags,
      shippingInfo: product.shippingInfo,
      saleStatus: product.saleStatus,
      secondPrice: product.secondPrice ? String(product.secondPrice) : null,
    }));

    return { products: transformedProducts, error: null };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Error desconocido al obtener productos',
    };
  }
}

export async function getProductById(businessSlug: string, productId: string) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      return { product: null, error: 'Negocio no encontrado' };
    }

    const product = await db.query.products.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, productId), eq(p.businessId, business.id)),
      with: {
        category: {
          columns: {
            name: true,
          },
        },
        media: {
          orderBy: (media, { asc }) => [asc(media.displayOrder)],
          columns: {
            mediaUrl: true,
            displayOrder: true,
          },
        },
      },
    });

    if (!product) {
      return { product: null, error: 'Producto no encontrado' };
    }

    const transformedProduct = {
      id: product.id,
      name: product.title,
      category: product.category?.name || 'Sin categoria',
      stock: product.stock,
      price: String(product.price),
      status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
      image: product.media[0]?.mediaUrl || '',
      images: product.media.map((m) => m.mediaUrl),
      description: product.description || '',
      currency: product.currency,
      displayOrder: product.displayOrder,
      createdAt: product.createdAt,
      brand: product.brand,
      tags: product.tags,
      shippingInfo: product.shippingInfo,
      saleStatus: product.saleStatus,
      secondPrice: product.secondPrice ? String(product.secondPrice) : null,
    };

    return { product: transformedProduct, error: null };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return {
      product: null,
      error: error instanceof Error ? error.message : 'Error al obtener el producto',
    };
  }
}

export async function createProduct(businessSlug: string, productData: ProductActionInput) {
  try {
    const normalizedProduct = normalizeProductInput(productData);

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      throw new Error('Negocio no encontrado');
    }

    let categoryId: string | null = null;
    const cleanCategory = normalizedProduct.category;

    if (cleanCategory) {
      const existingCategory = await db.query.productCategories.findFirst({
        where: (categories, { and, eq }) =>
          and(eq(categories.businessId, business.id), eq(categories.name, cleanCategory)),
        columns: { id: true },
      });

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const [newCategory] = await db
          .insert(productCategories)
          .values({
            businessId: business.id,
            name: cleanCategory,
          })
          .returning({ id: productCategories.id });
        categoryId = newCategory.id;
      }
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        businessId: business.id,
        categoryId: categoryId,
        title: normalizedProduct.name,
        description: normalizedProduct.description,
        price: String(normalizedProduct.price),
        stock: normalizedProduct.stock,
        isAvailable: normalizedProduct.status === 'ACTIVO',
        brand: normalizedProduct.brand,
        tags: normalizedProduct.tags,
        shippingInfo: normalizedProduct.shippingInfo,
        saleStatus: (normalizedProduct.saleStatus || 'NORMAL') as
          | 'NORMAL'
          | 'MAS_VENDIDO'
          | 'NUEVO_PRODUCTO',
        secondPrice:
          normalizedProduct.secondPrice !== undefined && normalizedProduct.secondPrice !== null
            ? String(normalizedProduct.secondPrice)
            : null,
      })
      .returning({ id: products.id });

    if (normalizedProduct.images.length > 0) {
      const mediaValues = normalizedProduct.images.map((url, index) => ({
        productId: newProduct.id,
        mediaUrl: url,
        mediaType: 'image' as const,
        displayOrder: index + 1,
      }));

      await db.insert(productMedia).values(mediaValues);
    }

    revalidatePath(`/${businessSlug}`);
    revalidatePath(`/${businessSlug}/storage`);

    return { success: true, productId: newProduct.id, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      productId: null,
      error: error instanceof Error ? error.message : 'Error al crear producto',
    };
  }
}

export async function updateProduct(
  businessSlug: string,
  productId: string,
  productData: ProductActionInput,
) {
  try {
    const normalizedProduct = normalizeProductInput(productData);

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      throw new Error('Negocio no encontrado');
    }

    let categoryId: string | null = null;
    const cleanCategory = normalizedProduct.category;

    if (cleanCategory) {
      const existingCategory = await db.query.productCategories.findFirst({
        where: (categories, { and, eq }) =>
          and(eq(categories.businessId, business.id), eq(categories.name, cleanCategory)),
        columns: { id: true },
      });

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const [newCategory] = await db
          .insert(productCategories)
          .values({
            businessId: business.id,
            name: cleanCategory,
          })
          .returning({ id: productCategories.id });
        categoryId = newCategory.id;
      }
    }

    await db
      .update(products)
      .set({
        categoryId: categoryId,
        title: normalizedProduct.name,
        description: normalizedProduct.description,
        price: String(normalizedProduct.price),
        stock: normalizedProduct.stock,
        isAvailable: normalizedProduct.status === 'ACTIVO',
        brand: normalizedProduct.brand,
        tags: normalizedProduct.tags,
        shippingInfo: normalizedProduct.shippingInfo,
        saleStatus: (normalizedProduct.saleStatus || 'NORMAL') as
          | 'NORMAL'
          | 'MAS_VENDIDO'
          | 'NUEVO_PRODUCTO',
        secondPrice:
          normalizedProduct.secondPrice !== undefined && normalizedProduct.secondPrice !== null
            ? String(normalizedProduct.secondPrice)
            : null,
      })
      .where(eq(products.id, productId));

    await db.delete(productMedia).where(eq(productMedia.productId, productId));

    if (normalizedProduct.images.length > 0) {
      const mediaValues = normalizedProduct.images.map((url, index) => ({
        productId,
        mediaUrl: url,
        mediaType: 'image' as const,
        displayOrder: index + 1,
      }));

      await db.insert(productMedia).values(mediaValues);
    }

    revalidatePath(`/${businessSlug}`);
    revalidatePath(`/${businessSlug}/storage`);

    return { success: true, productId, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      productId: null,
      error: error instanceof Error ? error.message : 'Error al actualizar producto',
    };
  }
}

export async function toggleLikeProduct(productId: string, businessSlug?: string) {
  try {
    const headersList = await headers();
    const xForwardedFor = headersList.get('x-forwarded-for');
    const xRealIp = headersList.get('x-real-ip');

    // Determine IP with better fallbacks
    const rawIp = xForwardedFor ? xForwardedFor.split(',')[0] : xRealIp || 'unknown';
    const ipAddress = rawIp.trim() || 'unknown';

    // 1. Check if already liked using standard select
    const existing = await db
      .select({ id: productLikes.id })
      .from(productLikes)
      .where(and(eq(productLikes.productId, productId), eq(productLikes.ipAddress, ipAddress)))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, alreadyLiked: true };
    }

    // 2. Insert like and increment stars
    await db.transaction(async (tx) => {
      await tx
        .insert(productLikes)
        .values({
          productId,
          ipAddress,
        })
        .onConflictDoNothing();

      await tx
        .update(products)
        .set({
          stars: sql`coalesce(${products.stars}, 0) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    });

    if (businessSlug) {
      revalidatePath(`/${businessSlug}`);
    }
    revalidatePath('/', 'layout');
    return { success: true, alreadyLiked: false };
  } catch (error) {
    console.error('Error in toggleLikeProduct:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al dar like',
    };
  }
}

export async function deleteProduct(businessSlug: string, productId: string) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, businessSlug),
      columns: { id: true },
    });

    if (!business) {
      throw new Error('Negocio no encontrado');
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { businessId: true },
    });

    if (!product || product.businessId !== business.id) {
      throw new Error('Producto no encontrado o no autorizado');
    }

    await db.delete(productMedia).where(eq(productMedia.productId, productId));
    await db.delete(products).where(eq(products.id, productId));

    revalidatePath(`/${businessSlug}`);
    revalidatePath(`/${businessSlug}/storage`);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar producto',
    };
  }
}
