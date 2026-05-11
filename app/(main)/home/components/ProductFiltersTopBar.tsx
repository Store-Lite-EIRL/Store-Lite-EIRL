'use client';

import type { ProductCategory } from '@/core/database/schema';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { DropdownCheckbox } from '@/shared/components/ui/inputs/DropdownCheckbox';
import { Switch } from '@/shared/components/ui/inputs/Switch';
import { getMaterialSwitchSelected } from '@/shared/utils';
import type { BrandFilterOption } from '../hooks/useProductFilters';
import { PriceRangeFilter } from './PriceRangeFilter';
import styles from './ProductFiltersTopBar.module.css';

interface ProductFiltersTopBarProps {
  categories: ProductCategory[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;

  minPrice: number;
  maxPrice: number;
  currentMinPrice: number;
  currentMaxPrice: number;
  onPriceRangeChange: (min: number, max: number) => void;

  showDiscountedOnly: boolean;
  onDiscountToggle: (checked: boolean) => void;

  brandOptions: BrandFilterOption[];
  selectedBrands: string[];
  onBrandChange: (brandId: string, checked: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function ProductFiltersTopBar({
  categories,
  selectedCategories,
  onCategoryChange,
  minPrice,
  maxPrice,
  currentMinPrice,
  currentMaxPrice,
  onPriceRangeChange,
  showDiscountedOnly,
  onDiscountToggle,
  brandOptions = [],
  selectedBrands,
  onBrandChange,
  onClearFilters,
  hasActiveFilters,
}: ProductFiltersTopBarProps) {
  const categoryOptions = categories.map((cat) => ({ id: cat.id, label: cat.name }));

  return (
    <div className={styles.topBar}>
      <div className={styles.filterGroup}>
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          currentMin={currentMinPrice}
          currentMax={currentMaxPrice}
          onChange={onPriceRangeChange}
          className={styles.priceRangeFullWidth}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Filtrar por:</span>
        <div className={styles.filterItem}>
          <DropdownCheckbox
            label="Categorías"
            options={categoryOptions}
            selectedIds={selectedCategories}
            onChange={onCategoryChange}
            disabled={categories.length === 0}
            emptyLabel="No hay categorías"
          />
        </div>

        <div className={styles.filterItem}>
          <DropdownCheckbox
            label="Marcas"
            options={brandOptions}
            selectedIds={selectedBrands}
            onChange={onBrandChange}
            disabled={brandOptions.length === 0}
            emptyLabel="No hay marcas"
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.switchWrapper}>
        <span
          className={styles.switchLabelText}
          onClick={() => onDiscountToggle(!showDiscountedOnly)}
        >
          Solo ofertas
        </span>
        <Switch
          selected={showDiscountedOnly}
          onChange={(e) => onDiscountToggle(getMaterialSwitchSelected(e))}
        />
      </div>

      {hasActiveFilters && (
        <>
          <div className={styles.divider} />
          <div className={styles.clearFiltersWrapper}>
            <IconButton
              onClick={onClearFilters}
              title="Eliminar filtros"
              className={styles.clearBtn}
            >
              <Icon>close</Icon>
            </IconButton>
          </div>
        </>
      )}
    </div>
  );
}
