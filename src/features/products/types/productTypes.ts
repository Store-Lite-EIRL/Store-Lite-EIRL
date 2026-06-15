import type { Product, ProductCategory, ProductMedia } from '@/types/product';

export type ProductWithRelations = Product & {
  media: ProductMedia[];
  category: ProductCategory | null;
};
