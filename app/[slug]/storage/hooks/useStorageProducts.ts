import { useEffect, useMemo, useState } from 'react';
import {
  createProduct,
  deleteProduct as deleteProductAction,
  getProductCategories,
  getProductsByBusinessSlug,
  syncProductCategories,
  updateProduct as updateProductAction,
  type SaleStatus,
} from '../actions';
import type { Product } from '../data';
import { uploadProductImage } from '../services/storageService';
import type { SaveProductMediaItem, SaveProductPayload } from '../types';
import { parsePriceValue } from '../utils/currency';

export type SortDirection = 'asc' | 'desc';
export interface SortConfig {
  key: keyof Product;
  direction: SortDirection;
}

export const ITEMS_PER_PAGE = 20;

interface StorageCache {
  products: Product[];
  categories: string[];
  timestamp: number;
}
const globalStorageCache: Record<string, StorageCache> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface UseStorageProductsProps {
  businessSlug: string;
  initialProducts?: Product[];
  initialCategories?: string[];
}

export const useStorageProducts = ({
  businessSlug,
  initialProducts = [],
  initialCategories = [],
}: UseStorageProductsProps) => {
  const [currentProducts, setCurrentProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch products and categories from server
  useEffect(() => {
    const fetchInitialData = async () => {
      // Revisar caché primero
      const cached = globalStorageCache[businessSlug];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (currentProducts.length === 0) {
          setCurrentProducts(cached.products);
        }
        if (categories.length === 0) {
          setCategories(cached.categories);
        }
        setIsLoading(false);
        return;
      }

      // Si no hay datos y no estamos cargando, entonces cargamos
      if (currentProducts.length === 0) {
        setIsLoading(true);
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            getProductsByBusinessSlug(businessSlug),
            getProductCategories(businessSlug),
          ]);

          if (productsRes.error) console.error('Error loading products:', productsRes.error);
          if (categoriesRes.error) console.error('Error loading categories:', categoriesRes.error);

          const products = productsRes.products || [];
          const cats = categoriesRes.categories || [];

          setCurrentProducts(products);
          setCategories(cats);

          // Guardar en caché
          globalStorageCache[businessSlug] = {
            products,
            categories: cats,
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
      fetchInitialData();
    }
  }, [businessSlug]);

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
    const previousProducts = [...currentProducts];

    // 2. Actualización optimista: lo quitamos de la UI y caché inmediatamente
    setCurrentProducts((prev) => {
      const newProducts = prev.filter((p) => p.id !== id);
      if (globalStorageCache[businessSlug]) {
        globalStorageCache[businessSlug].products = newProducts;
      }
      return newProducts;
    });

    try {
      // 3. Llamar al backend
      const { success, error } = await deleteProductAction(businessSlug, id);

      if (!success) {
        console.error('Error al eliminar producto por action:', error);
        // Si falló, restaurar de vuelta el producto a la lista
        setCurrentProducts(previousProducts);
        if (globalStorageCache[businessSlug]) {
          globalStorageCache[businessSlug].products = previousProducts;
        }
        return { success: false, error: error || 'Error al eliminar producto' };
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

  const saveProductBackground = async (
    payload: SaveProductPayload,
    media: SaveProductMediaItem[],
    isEdit: boolean,
    initialProduct: Product | null | undefined,
    optimisticProduct: Product,
  ): Promise<{ success: boolean; error?: string }> => {
    const previousProducts = [...currentProducts];

    // Optimistically update the UI:
    if (isEdit && initialProduct) {
      updateProduct(optimisticProduct);
    } else {
      addProduct(optimisticProduct);
      setCurrentPage(1); // Mover a la primera página para ver el nuevo producto
    }

    try {
      // 1. Process Images
      const finalImageUrls: string[] = [];

      for (const [index, item] of media.entries()) {
        if (item.type === 'url') {
          finalImageUrls.push(item.url);
        } else {
          try {
            console.warn(`[useStorageProducts] Subiendo imagen ${index + 1}/${media.length}...`);
            const url = await uploadProductImage(item.file);
            finalImageUrls.push(url);
          } catch (error) {
            console.error('[useStorageProducts] Error en bucle de subida:', error);
            throw error; // Re-throw to be caught by outer catch
          }
        }
      }

      const finalPayload = {
        ...payload,
        images: finalImageUrls,
        saleStatus: (payload.saleStatus || 'NORMAL') as SaleStatus,
      };

      // 2. Save Backend
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
            console.error('Failed to update global cache:', e);
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
            console.error('Failed to update global cache:', e);
          }

          return newProducts;
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Background save error catch block reached:', error);
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

  const saveCategories = async (newCategories: string[]) => {
    setIsLoading(true);
    try {
      const {
        success,
        error,
        categories: updatedCategories,
      } = await syncProductCategories(businessSlug, newCategories);
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
    deleteProduct,
    addProduct,
    updateProduct,
    saveProductBackground,
    saveCategories,
  };
};
