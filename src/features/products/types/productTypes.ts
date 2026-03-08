import type { Product, ProductCategory, ProductMedia } from '@/core/database/schema';

export type ProductWithRelations = Product & {
  media: ProductMedia[];
  category: ProductCategory | null;
};
