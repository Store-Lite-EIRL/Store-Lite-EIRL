/* eslint-disable max-lines-per-function */
'use client';

import { Button, Dialog } from '@/shared/components/ui';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { Select } from '@/shared/components/ui/inputs/Select';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import React, { useEffect, useState } from 'react';
import { useStorage } from '../../context/StorageContext';

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
  const { categories, saveCategories: onSaveCategories } = useStorage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cada vez que se abre el diÃ¡logo, sincronizar local con la realidad actual
  useEffect(() => {
    if (isDialogOpen) {
      setLocalCategories(categories);
    }
  }, [isDialogOpen, categories]);

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setNewCategoryError('La categoría no puede estar vacía');
      return;
    }

    if (trimmed.length < 3) {
      setNewCategoryError('Mínimo 3 caracteres');
      return;
    }

    // Si ya existe, simplemente seleccionarla
    if (localCategories.includes(trimmed)) {
      onCategoryChange(trimmed);
      setNewCategoryName('');
      setNewCategoryError(null);
      return;
    }

    const updated = [...localCategories, trimmed];
    setLocalCategories(updated);
    onCategoryChange(trimmed);
    setNewCategoryName('');
    setNewCategoryError(null);
  };

  const handleDeleteCategory = (index: number) => {
    const toDelete = localCategories[index];
    const updated = localCategories.filter((_, i) => i !== index);
    setLocalCategories(updated);

    if (category === toDelete) {
      // No reseteamos inmediatamente la categorÃ­a seleccionada en el formulario global
      // porque estamos en modo borrador dentro del diÃ¡logo.
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const { success, error } = await onSaveCategories(localCategories);
    setIsSaving(false);

    if (success) {
      setIsDialogOpen(false);
    } else {
      setNewCategoryError(error || 'Error al guardar');
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
              setNewCategoryName('');
              setNewCategoryError(null);
              setIsDialogOpen(true);
            }}
            aria-label="Administrar categorías"
            title="Administrar categorías"
            style={{ flexShrink: 0 }}
          >
            <Icon>add</Icon>
          </button>
        </div>
        {categoryError && <p className="field-error">{categoryError}</p>}
      </div>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div slot="headline">Categorías del negocio</div>
        <div slot="content" className="categories-dialog-content">
          <div className="categories-dialog-create-row">
            <div className="categories-dialog-input-wrapper">
              <TextField
                label="Nueva categoría"
                variant="outlined"
                value={newCategoryName}
                error={!!newCategoryError}
                errorText={newCategoryError ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewCategoryName(e.target.value);
                  if (newCategoryError) setNewCategoryError(null);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') handleCreateCategory();
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`categories-create-icon-btn${newCategoryName.trim().length >= 3 ? ' is-valid' : ''}`}
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                title="Crear categoría"
              >
                <Icon>north</Icon>
              </button>
            </div>
            <div className="category-limit-info">
              <p
                className={localCategories.length > 5 ? 'field-error' : 'secondary-text'}
                style={{ fontSize: '0.75rem', marginTop: '4px' }}
              >
                Categorías: {localCategories.length}/5
              </p>
              {localCategories.length > 5 && (
                <p className="field-error" style={{ fontSize: '0.75rem' }}>
                  Elimina categorías para poder guardar.
                </p>
              )}
            </div>
          </div>

          {localCategories.length === 0 ? (
            <p className="categories-dialog-empty">No hay categorías</p>
          ) : (
            <div className="categories-tags-list">
              {localCategories.map((cat, index) => (
                <div
                  key={`${cat}-${index}`}
                  className={`category-chip${category === cat ? ' category-chip-selected' : ''}`}
                >
                  <span
                    className="category-chip-label"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onCategoryChange(cat);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onCategoryChange(cat);
                    }}
                  >
                    {cat}
                  </span>
                  <button
                    type="button"
                    className="category-chip-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(index);
                    }}
                    aria-label="Eliminar categoría"
                    title="Eliminar categoría"
                  >
                    <Icon>close</Icon>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
            Cerrar
          </Button>
          <Button
            variant="filled"
            onClick={handleSaveDraft}
            disabled={isSaving || localCategories.length > 5}
          >
            {isSaving ? (
              <div className="button-loading-content">
                <div className="spinner-mini" />
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
