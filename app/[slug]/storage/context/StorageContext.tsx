'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Product } from '../data';
import { useStorageProducts, type SortConfig } from '../hooks/useStorageProducts';
import type { SaveProductMediaItem, SaveProductPayload } from '../types';

interface StorageContextType {
  products: Product[];
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
  categories: string[];
  statuses: string[];
  totalProducts: number;
  isLoading: boolean;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  saveProductBackground: (
    payload: SaveProductPayload,
    media: SaveProductMediaItem[],
    isEdit: boolean,
    initialProduct: Product | null | undefined,
    optimisticProduct: Product,
  ) => Promise<{ success: boolean; error?: string }>;
  saveCategories: (categories: string[]) => Promise<{ success: boolean; error?: string }>;
}

export const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({
  children,
  businessSlug,
  initialProducts,
  initialCategories,
}: {
  children: ReactNode;
  businessSlug: string;
  initialProducts?: Product[];
  initialCategories?: string[];
}) => {
  const storage = useStorageProducts({
    businessSlug,
    initialProducts,
    initialCategories,
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
