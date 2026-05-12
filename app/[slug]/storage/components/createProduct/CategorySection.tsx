'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import { Select } from '@/shared/components/ui/inputs/Select';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AddCategoryModal } from '../../../../(main)/home/components/AddCategoryModal';
import { createCategory } from '../../actions/categories';
import { useStorage } from '../../context/StorageContext';
import { uploadCategoryImage } from '../../services/storageService';

interface CategorySectionProps {
  category: string;
  categoryError?: string;
  onCategoryChange: (value: string) => void;
}

export const CategorySection = ({
  category,
  categoryError,
  onCategoryChange,
}: CategorySectionProps) => {
  const { categories, refreshCategories } = useStorage();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const params = useParams();
  const businessSlug = params.slug as string;

  const handleSaveNewCategory = async (newName: string, imageFile: File | null) => {
    try {
      let finalImageUrl: string | null = null;

      if (imageFile) {
        finalImageUrl = await uploadCategoryImage(imageFile, businessSlug);
      }

      const result = await createCategory(businessSlug, {
        name: newName,
        imageUrl: finalImageUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la categoría');
      }

      // Refrescamos las categorías localmente para que aparezcan en el Select
      await refreshCategories();

      // Actualizamos la selección
      onCategoryChange(newName);
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  return (
    <div className="form-section">
      <p className="form-section-title">Categoría</p>
      <div className="form-fields">
        <div className="category-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            {categories.length === 0 ? (
              <div className="no-categories-text">No hay categorías</div>
            ) : (
              <Select
                outlined
                label="Categoría *"
                value={category}
                style={{ width: '100%' }}
                onChange={(e: MaterialSelectEvent) => {
                  onCategoryChange(getMaterialSelectValue(e));
                }}
                onInput={(e: MaterialSelectEvent) => {
                  onCategoryChange(getMaterialSelectValue(e));
                }}
                options={categories.map((cat) => ({ label: cat, value: cat }))}
              />
            )}
          </div>
          <button
            type="button"
            className="add-category-btn"
            onClick={() => {
              setIsAddingCategory(true);
            }}
            aria-label="Agregar categoría"
            title="Agregar categoría"
            style={{ flexShrink: 0 }}
          >
            <Icon>add</Icon>
          </button>
        </div>
        {categoryError && <p className="field-error">{categoryError}</p>}
      </div>

      <AddCategoryModal
        open={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        onSave={handleSaveNewCategory}
      />
    </div>
  );
};
