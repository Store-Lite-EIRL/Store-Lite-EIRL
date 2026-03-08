import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { useMemo, useState } from 'react';

export function useProductFilters(initialProducts: ProductWithRelations[]) {
  // calculate min/max possible prices from dataset
  const { absoluteMin, absoluteMax } = useMemo(() => {
    if (!initialProducts.length) return { absoluteMin: 0, absoluteMax: 1000 };

    let min = Infinity;
    let max = -Infinity;
    initialProducts.forEach((p) => {
      const price = Number(p.price);
      if (price < min) min = price;
      if (price > max) max = price;
    });

    // Add some padding or default bounds if all prices are the same
    if (min === max) {
      return { absoluteMin: Math.max(0, min - 100), absoluteMax: max + 100 };
    }

    return { absoluteMin: Math.floor(min), absoluteMax: Math.ceil(max) };
  }, [initialProducts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentMinPrice, setCurrentMinPrice] = useState(absoluteMin);
  const [currentMaxPrice, setCurrentMaxPrice] = useState(absoluteMax);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (searchQuery) {
      result = result.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => p.categoryId && selectedCategories.includes(p.categoryId));
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.some((brand) => p.title.toLowerCase().includes(brand.toLowerCase())),
      );
    }

    if (showDiscountedOnly) {
      result = result.filter((p) => {
        const metadata = (p.metadata as Record<string, unknown>) || {};
        const originalPrice = metadata.originalPrice ? Number(metadata.originalPrice) : null;
        return originalPrice !== null && originalPrice > Number(p.price);
      });
    }

    // Filter by price range
    result = result.filter((p) => {
      const price = Number(p.price);
      return price >= currentMinPrice && price <= currentMaxPrice;
    });

    return result;
  }, [
    initialProducts,
    searchQuery,
    selectedCategories,
    selectedBrands,
    showDiscountedOnly,
    currentMinPrice,
    currentMaxPrice,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      selectedCategories.length > 0 ||
      selectedBrands.length > 0 ||
      currentMinPrice !== absoluteMin ||
      currentMaxPrice !== absoluteMax ||
      showDiscountedOnly
    );
  }, [
    searchQuery,
    selectedCategories,
    selectedBrands,
    currentMinPrice,
    currentMaxPrice,
    absoluteMin,
    absoluteMax,
    showDiscountedOnly,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setCurrentMinPrice(absoluteMin);
    setCurrentMaxPrice(absoluteMax);
    setShowDiscountedOnly(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    selectedBrands,
    setSelectedBrands,
    absoluteMin,
    absoluteMax,
    currentMinPrice,
    setCurrentMinPrice,
    currentMaxPrice,
    setCurrentMaxPrice,
    showDiscountedOnly,
    setShowDiscountedOnly,
    filteredProducts,
    hasActiveFilters,
    clearFilters,
  };
}
