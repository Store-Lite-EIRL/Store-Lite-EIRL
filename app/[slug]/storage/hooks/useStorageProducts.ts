import type { BusinessEntitlements } from '@/core/entitlements/plans';
import { isBusinessError } from '@/lib/errorHandling';
import { useEffect, useMemo, useState } from 'react';
import {
  createProduct,
  deleteCategory as deleteCategoryAction,
  deleteProduct as deleteProductAction,
  getProductCategories,
  getProductsByBusinessSlug,
  syncProductCategories,
  updateProduct as updateProductAction,
  type SaleStatus,
} from '../actions';
import type { Product } from '../data';
import { deleteProductImage, uploadProductImage } from '../services/storageService';
import type { SaveProductMediaItem, SaveProductPayload } from '../types';
import { parsePriceValue } from '../utils/currency';

export type SortDirection = 'asc' | 'desc';
export interface SortConfig {
  key: keyof Product;
  direction: SortDirection;
}

export const ITEMS_PER_PAGE = 20;

export interface CategoryItem {
  id: string;
  name: string;
}

interface StorageCache {
  products: Product[];
  categories: CategoryItem[];
  businessId: string | null;
  entitlements: BusinessEntitlements | null;
  timestamp: number;
}
const globalStorageCache: Record<string, StorageCache> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface UseStorageProductsProps {
  businessSlug: string;
  initialProducts?: Product[];
  initialCategories?: CategoryItem[];
  initialBusinessId?: string | null;
  isOwner?: boolean;
}

export const useStorageProducts = ({
  businessSlug,
  initialProducts = [],
  initialCategories = [],
  initialBusinessId = null,
  isOwner = false,
}: UseStorageProductsProps) => {
  const [currentProducts, setCurrentProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [businessId, setBusinessId] = useState<string | null>(initialBusinessId);
  const [entitlements, setEntitlements] = useState<BusinessEntitlements | null>(null);

  // Sincronizar businessId si cambia el prop (hidratación o re-render)
  useEffect(() => {
    if (initialBusinessId && !businessId) {
      setBusinessId(initialBusinessId);
    }
  }, [initialBusinessId, businessId]);

  // Fetch products and categories from server
  useEffect(() => {
    const fetchInitialData = async () => {
      // Si no es el dueño, no intentamos sincronizar con el storage interno (evita 401/403)
      if (!isOwner) {
        setIsLoading(false);
        return;
      }

      // Revisar caché primero
      const cached = globalStorageCache[businessSlug];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (currentProducts.length === 0) {
          setCurrentProducts(cached.products);
        }
        if (categories.length === 0) {
          setCategories(cached.categories);
        }
        if (!businessId && cached.businessId) {
          setBusinessId(cached.businessId);
        }
        if (!entitlements && cached.entitlements) {
          setEntitlements(cached.entitlements);
        }
        setIsLoading(false);
        return;
      }

      const needsProducts = currentProducts.length === 0;
      const needsCategories = categories.length === 0;

      if (needsProducts || needsCategories) {
        setIsLoading(true);
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            needsProducts
              ? getProductsByBusinessSlug(businessSlug)
              : Promise.resolve({
                  products: currentProducts,
                  businessId,
                  entitlements,
                  error: null,
                }),
            needsCategories
              ? getProductCategories(businessSlug)
              : Promise.resolve({ categories: categories, entitlements, error: null }),
          ]);

          if (productsRes.error) console.error('Error loading products:', productsRes.error);
          if (categoriesRes.error) console.error('Error loading categories:', categoriesRes.error);

          const products = productsRes.products || currentProducts;
          const cats = categoriesRes.categories || categories;
          const bId = productsRes.businessId || businessId;
          const ents = productsRes.entitlements || categoriesRes.entitlements || null;

          setCurrentProducts(products);
          setCategories(cats);
          setBusinessId(bId);
          setEntitlements(ents);

          // Guardar en caché
          globalStorageCache[businessSlug] = {
            products,
            categories: cats,
            businessId: bId,
            entitlements: ents,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error('Error fetching storage data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (businessSlug) {
      // Si tenemos initialBusinessId, guardarlo en el caché si no está
      if (
        initialBusinessId &&
        (!globalStorageCache[businessSlug] || !globalStorageCache[businessSlug].businessId)
      ) {
        if (!globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug] = {
            products: initialProducts,
            categories: initialCategories,
            businessId: initialBusinessId,
            entitlements: null,
            timestamp: Date.now(),
          };
        } else {
          globalStorageCache[businessSlug].businessId = initialBusinessId;
        }
      }
      fetchInitialData();
    }
  }, [businessSlug, isOwner]);

  const statuses = useMemo(
    () => [...new Set(currentProducts.map((p) => p.status))],
    [currentProducts],
  );

  const handleSort = (key: keyof Product) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // CRUD Operations
  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Guardar estado previo
    // 1. Find the product to delete before optimistic update
    const productToDelete = currentProducts.find((p) => p.id === id);

    // 2. Guardar estado previo
    const previousProducts = [...currentProducts];

    // 3. Actualización optimista: lo quitamos de la UI y caché inmediatamente
    setCurrentProducts((prev) => {
      const newProducts = prev.filter((p) => p.id !== id);
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = newProducts;
      }
      return newProducts;
    });

    try {
      // 4. Llamar al backend
      const { success, error } = await deleteProductAction(businessSlug, id);

      if (!success) {
        if (!isBusinessError(error)) {
          console.error('Error al eliminar producto por action:', error);
        }
        // Si falló, restaurar de vuelta el producto a la lista
        setCurrentProducts(previousProducts);
        if (globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug].products = previousProducts;
        }
        return { success: false, error: error || 'Error al eliminar producto' };
      }

      // 5. Storage Cleanup: Delete images if the product was successfully deleted from DB
      if (productToDelete) {
        const imagesToDelete =
          productToDelete.images || (productToDelete.image ? [productToDelete.image] : []);
        if (imagesToDelete.length > 0) {
          console.warn(
            `[useStorageProducts] Eliminando ${imagesToDelete.length} imágenes del producto eliminado...`,
          );
          // We don't await this to avoid blocking the main save flow,
          // but we execute it in background.
          imagesToDelete.forEach((url) => deleteProductImage(url).catch(console.error));
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error de red al eliminar producto:', error);
      // Restaurar si hay una excepción
      setCurrentProducts(previousProducts);
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = previousProducts;
      }
      return { success: false, error: 'Error de red al eliminar' };
    }
  };

  const addProduct = (product: Product) => {
    setCurrentProducts((prev) => {
      const newProducts = [product, ...prev];
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = newProducts;
      }
      return newProducts;
    });
  };

  const updateProduct = (updatedProduct: Product) => {
    setCurrentProducts((prev) => {
      const newProducts = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = newProducts;
      }
      return newProducts;
    });
  };

  const saveProductBackground = async (params: {
    payload: SaveProductPayload;
    media: SaveProductMediaItem[];
    isEdit: boolean;
    initialProduct: Product | null | undefined;
    optimisticProduct: Product;
  }): Promise<{ success: boolean; error?: string }> => {
    const { payload, media, isEdit, initialProduct, optimisticProduct } = params;
    const previousProducts = [...currentProducts];

    // Optimistically update the UI:
    if (isEdit && initialProduct) {
      updateProduct(optimisticProduct);
    } else {
      addProduct(optimisticProduct);
      setCurrentPage(1); // Mover a la primera página para ver el nuevo producto
    }

    try {
      // 1. Process Images in parallel
      const effectiveBusinessId = initialBusinessId || businessId;
      console.warn(
        `[useStorageProducts] Procesando ${media.length} imágenes para businessId: ${effectiveBusinessId}...`,
      );

      const uploadPromises = media.map(async (item, index) => {
        if (item.type === 'url') {
          return item.url;
        } else {
          try {
            return await uploadProductImage(item.file, effectiveBusinessId);
          } catch (error) {
            console.error(`[useStorageProducts] Error subiendo imagen ${index + 1}:`, error);
            throw error;
          }
        }
      });

      const finalImageUrls = await Promise.all(uploadPromises);

      // 2. Logic for cleanup (delete images that are no longer used)
      if (isEdit && initialProduct) {
        const oldImages =
          initialProduct.images || (initialProduct.image ? [initialProduct.image] : []);
        const imagesToDelete = oldImages.filter((url) => !finalImageUrls.includes(url));

        if (imagesToDelete.length > 0) {
          console.warn(
            `[useStorageProducts] Eliminando ${imagesToDelete.length} imágenes obsoletas...`,
          );
          // We don't await this to avoid blocking the main save flow,
          // but we execute it in background.
          imagesToDelete.forEach((url) => deleteProductImage(url).catch(console.error));
        }
      }

      const finalPayload = {
        ...payload,
        images: finalImageUrls,
        saleStatus: (payload.saleStatus || 'NORMAL') as SaleStatus,
      };

      // 3. Save Backend
      if (isEdit && initialProduct) {
        const result = await updateProductAction(businessSlug, initialProduct.id, finalPayload);
        if (!result.success) throw new Error(result.error || 'Error al actualizar producto');

        // Update real image URLs in the state and cache
        setCurrentProducts((prev) => {
          const newProducts = prev.map((p) =>
            p.id === optimisticProduct.id
              ? {
                  ...p,
                  images: finalImageUrls,
                  image: finalImageUrls[0] || '',
                }
              : p,
          );
          try {
            if (globalStorageCache[businessSlug]) {
              globalStorageCache[businessSlug].products = newProducts;
            }
          } catch (e) {
            if (!isBusinessError(e)) {
              console.error('Failed to update global cache:', e);
            }
          }
          return newProducts;
        });
      } else {
        const result = await createProduct(businessSlug, finalPayload);
        if (!result.success || !result.productId)
          throw new Error(result.error || 'Error al guardar producto');
        // Replace temporary ID with real ID in the UI and cache
        setCurrentProducts((prev) => {
          const newProducts = prev.map((p) =>
            p.id === optimisticProduct.id
              ? {
                  ...p,
                  id: result.productId,
                  images: finalImageUrls,
                  image: finalImageUrls[0] || p.image,
                }
              : p,
          );

          try {
            if (globalStorageCache[businessSlug]) {
              globalStorageCache[businessSlug].products = newProducts;
            }
          } catch (e) {
            if (!isBusinessError(e)) {
              console.error('Failed to update global cache:', e);
            }
          }

          return newProducts;
        });
      }
      return { success: true };
    } catch (error) {
      if (!isBusinessError(error)) {
        console.error('Background save error catch block reached:', error);
      }
      // Revert Optimistic UI
      setCurrentProducts(previousProducts);
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = previousProducts;
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado al guardar el producto',
      };
    }
  };

  const saveCategories = async (newCategoryNames: string[]) => {
    setIsLoading(true);
    try {
      const {
        success,
        error,
        categories: updatedCategories,
      } = await syncProductCategories(businessSlug, newCategoryNames);
      if (success && updatedCategories) {
        setCategories(updatedCategories);
        if (globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug].categories = updatedCategories;
        }
      } else {
        console.error('Error saving categories:', error);
      }
      return { success, error };
    } catch (error) {
      console.error('Failed to save categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al sincronizar categorías',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    let result: { success: boolean; error?: string };

    try {
      const { success, error } = await deleteCategoryAction(businessSlug, categoryId);
      result = { success, error: error ?? undefined };

      if (success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        if (globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug].categories = globalStorageCache[
            businessSlug
          ].categories.filter((c) => c.id !== categoryId);
        }
      }
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar la categoría',
      };
    }

    return result;
  };

  const { paginatedProducts, totalFiltered, filteredAll } = useMemo(() => {
    let result = [...currentProducts];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.category.toLowerCase().includes(lowerSearch),
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter((p) => p.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }

    const filteredAll = [...result];

    if (sortBy === 'low-price') {
      result.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
    } else if (sortBy === 'high-price') {
      result.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
    } else if (sortBy === 'stock-asc') {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock-desc') {
      result.sort((a, b) => b.stock - a.stock);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (sortConfig.key === 'price') {
          const numA = parsePriceValue(String(valA));
          const numB = parsePriceValue(String(valB));
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    const totalFiltered = result.length;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = result.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedProducts, totalFiltered, filteredAll };
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortConfig, currentPage, currentProducts]);

  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, sortBy]);

  return {
    products: paginatedProducts,
    allFilteredProducts: filteredAll,
    totalFiltered,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortConfig,
    handleSort,
    categories,
    statuses,
    totalProducts: currentProducts.length,
    isLoading,
    entitlements,
    deleteProduct,
    addProduct,
    updateProduct,
    saveProductBackground,
    saveCategories,
    deleteCategory,
    refreshProducts: async () => {
      Reflect.deleteProperty(globalStorageCache, businessSlug);
      setIsLoading(true);
      try {
        const productsRes = await getProductsByBusinessSlug(businessSlug);
        if (!productsRes.error && productsRes.products) {
          setCurrentProducts(productsRes.products);
          setCurrentPage(1);
          if (productsRes.businessId) setBusinessId(productsRes.businessId);
          if (productsRes.entitlements) setEntitlements(productsRes.entitlements);
          globalStorageCache[businessSlug] = {
            products: productsRes.products,
            categories,
            businessId: productsRes.businessId || businessId,
            entitlements: productsRes.entitlements || null,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        console.error('Error refreshing products:', error);
      } finally {
        setIsLoading(false);
      }
    },
    refreshCategories: async () => {
      const { categories: updatedCategories } = await getProductCategories(businessSlug);
      if (updatedCategories) {
        setCategories(updatedCategories);
        if (globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug].categories = updatedCategories;
        }
      }
    },
  };
};
