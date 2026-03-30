'use client';

import type { ProductCategory } from '@/core/database/schema';
import { Checkbox } from '@/shared/components/ui/inputs/Checkbox';
import { Select, SelectOption } from '@/shared/components/ui/inputs/Select';
import { Switch } from '@/shared/components/ui/inputs/Switch';
import {
  getMaterialSelectValue,
  getMaterialSwitchSelected,
  type MaterialSelectEvent,
} from '@/shared/utils';
import styles from './ProductFiltersSidebar.module.css';

interface ProductFiltersSidebarProps {
  categories: ProductCategory[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;

  priceSort: 'asc' | 'desc' | 'none';
  onPriceSortChange: (sort: 'asc' | 'desc' | 'none') => void;

  showDiscountedOnly: boolean;
  onDiscountToggle: (checked: boolean) => void;

  // Mock brands for now
  selectedBrands: string[];
  onBrandChange: (brand: string, checked: boolean) => void;
}

const MOCK_BRANDS = ['Nike', 'Adidas', 'Puma', 'Reebok'];

export default function ProductFiltersSidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  priceSort,
  onPriceSortChange,
  showDiscountedOnly,
  onDiscountToggle,
  selectedBrands,
  onBrandChange,
}: ProductFiltersSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Filtros</h3>

      {/* Ordenar por Precio */}
      <section className={styles.filterSection}>
        <h4 className={styles.sectionTitle}>Precio</h4>
        <Select
          label="Ordenar por"
          value={priceSort}
          onChange={(e: MaterialSelectEvent) => {
            const value = getMaterialSelectValue(e, 'none');
            onPriceSortChange(
              value === 'asc' || value === 'desc' || value === 'none' ? value : 'none',
            );
          }}
          className={styles.select}
        >
          <SelectOption value="none">Recomendado</SelectOption>
          <SelectOption value="asc">Menor a mayor</SelectOption>
          <SelectOption value="desc">Mayor a menor</SelectOption>
        </Select>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className={styles.filterSection}>
          <h4 className={styles.sectionTitle}>Categorías</h4>
          <div className={styles.checkboxList}>
            {categories.map((cat) => (
              <label key={cat.id} className={styles.checkboxLabel}>
                <Checkbox
                  checked={selectedCategories.includes(cat.id)}
                  onChange={(e) => onCategoryChange(cat.id, (e.target as HTMLInputElement).checked)}
                />
                <span className={styles.labelSpan}>{cat.name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Marcas (Mock) */}
      <section className={styles.filterSection}>
        <h4 className={styles.sectionTitle}>Marcas</h4>
        <div className={styles.checkboxList}>
          {MOCK_BRANDS.map((brand) => (
            <label key={brand} className={styles.checkboxLabel}>
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onChange={(e) => onBrandChange(brand, (e.target as HTMLInputElement).checked)}
              />
              <span className={styles.labelSpan}>{brand}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Ofertas / Descuentos */}
      <section className={styles.filterSection}>
        <label className={styles.switchLabel}>
          <div className={styles.switchText}>
            <span className={styles.sectionTitle}>Solo ofertas</span>
            <span className={styles.switchDesc}>Mostrar productos con descuento</span>
          </div>
          <Switch
            selected={showDiscountedOnly}
            onChange={(e) => onDiscountToggle(getMaterialSwitchSelected(e))}
          />
        </label>
      </section>
    </aside>
  );
}
