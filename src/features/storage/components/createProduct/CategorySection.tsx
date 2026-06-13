'use client';

import { Button, Dialog, Icon, Select } from '@/shared/components/ui';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AddCategoryModal } from '../../../../../app/(main)/home/components/AddCategoryModal';
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
  const { categories, refreshCategories, deleteCategory } = useStorage();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({ open: false, description: '', color: 'error', icon: 'error' });
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

  const handleDeleteClick = (cat: { id: string; name: string }) => {
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeletingId(categoryToDelete.id);

    const result = await deleteCategory(categoryToDelete.id);

    if (result.success) {
      setAlert({
        open: true,
        description: `Categoría "${categoryToDelete.name}" eliminada`,
        color: 'success',
        icon: 'check_circle',
      });
      // Si la categoría eliminada era la seleccionada, limpiar la selección
      if (category === categoryToDelete.name) {
        onCategoryChange('');
      }
    } else {
      setAlert({
        open: true,
        description: result.error || 'Error al eliminar la categoría',
        color: 'error',
        icon: 'error',
      });
    }

    setCategoryToDelete(null);
    setDeletingId(null);
  };

  const hasCategories = categories.length > 0;
  const atCategoryLimit = categories.length >= 7;

  return (
    <div className="form-section">
      <p className="form-section-title">Categoría</p>
      <div className="form-fields">
        <div className="category-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            {!hasCategories ? (
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
                options={categories.map((cat) => ({ label: cat.name, value: cat.name }))}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              className="add-category-btn"
              onClick={() => !atCategoryLimit && setIsAddingCategory(true)}
              aria-label={atCategoryLimit ? 'Límite de categorías alcanzado' : 'Agregar categoría'}
              title={atCategoryLimit ? 'Máximo 7 categorías' : 'Agregar categoría'}
              style={atCategoryLimit ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              <Icon>add</Icon>
            </button>
            {hasCategories && (
              <button
                type="button"
                className="add-category-btn"
                onClick={() => setIsDeleteDialogOpen(true)}
                aria-label="Eliminar categoría"
                title="Eliminar categoría"
                style={{ color: 'var(--md-sys-color-error)' }}
              >
                <Icon>delete</Icon>
              </button>
            )}
          </div>
        </div>
        {categoryError && <p className="field-error">{categoryError}</p>}
      </div>

      {/* Modal para agregar categoría */}
      <AddCategoryModal
        open={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        onSave={handleSaveNewCategory}
      />

      {/* Diálogo de eliminar categoría */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
      >
        {!categoryToDelete ? (
          <>
            <div slot="headline">Eliminar Categoría</div>
            <div slot="content">
              {categories.length === 0 ? (
                <p>No hay categorías para eliminar.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface-container-high)',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(cat)}
                        disabled={deletingId === cat.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: deletingId === cat.id ? 'default' : 'pointer',
                          color: 'var(--md-sys-color-error)',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '50%',
                          opacity: deletingId === cat.id ? 0.5 : 1,
                        }}
                        aria-label={`Eliminar categoría ${cat.name}`}
                        title={`Eliminar ${cat.name}`}
                      >
                        <Icon>{deletingId === cat.id ? 'progress_activity' : 'delete'}</Icon>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div slot="actions">
              <Button variant="text" onClick={() => handleDialogClose()}>
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div slot="headline">Confirmar</div>
            <div slot="content">
              ¿Eliminar la categoría <strong>{categoryToDelete.name}</strong>?
              <br />
              <br />
              Los productos asignados a esta categoría quedarán sin categoría.
            </div>
            <div slot="actions">
              <Button variant="text" onClick={() => handleDialogClose()}>
                Cancelar
              </Button>
              <Button
                variant="filled"
                onClick={handleConfirmDelete}
                style={
                  {
                    '--md-sys-color-primary': 'var(--md-sys-color-error)',
                  } as React.CSSProperties
                }
              >
                Eliminar
              </Button>
            </div>
          </>
        )}
      </Dialog>

      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};
