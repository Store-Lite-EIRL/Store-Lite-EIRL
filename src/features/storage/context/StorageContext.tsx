'use client';

import type { BusinessEntitlements } from '@/core/entitlements/plans';
import type { SaveProductMediaItem, SaveProductPayload } from '@/types/storage';
import { usePermissions } from '@app/[slug]/(app)/context/PermissionsContext';
import { createContext, useContext, type ReactNode } from 'react';
import type { Product } from '../data';
import {
  useStorageProducts,
  type CategoryItem,
  type SortConfig,
} from '../hooks/useStorageProducts';

interface StorageContextType {
  products: Product[];
  entitlements: BusinessEntitlements | null;
  allFilteredProducts: Product[];
  totalFiltered: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortConfig: SortConfig | null;
  handleSort: (key: keyof Product) => void;
  categories: CategoryItem[];
  statuses: string[];
  totalProducts: number;
  isLoading: boolean;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  saveProductBackground: (params: {
    payload: SaveProductPayload;
    media: SaveProductMediaItem[];
    isEdit: boolean;
    initialProduct: Product | null | undefined;
    optimisticProduct: Product;
  }) => Promise<{ success: boolean; error?: string }>;
  saveCategories: (categories: string[]) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  refreshCategories: () => Promise<void>;
  /** Invalida el caché y vuelve a cargar productos desde el servidor */
  refreshProducts: () => Promise<void>;
}

export const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({
  children,
  businessSlug,
  businessId,
  initialProducts,
  initialCategories,
  isOwner = false,
  permissions: _permissions,
}: {
  children: ReactNode;
  businessSlug: string;
  businessId?: string;
  initialProducts?: Product[];
  initialCategories?: CategoryItem[];
  isOwner?: boolean;
  permissions?: string[];
}) => {
  const { can } = usePermissions();
  const canViewProducts = can('products.view');

  const storage = useStorageProducts({
    businessSlug,
    initialProducts,
    initialCategories,
    initialBusinessId: businessId,
    isOwner: isOwner || canViewProducts, // Ahora permite cargar si tiene permiso
  });

  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
