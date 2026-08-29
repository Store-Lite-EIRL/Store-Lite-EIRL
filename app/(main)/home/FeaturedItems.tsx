'use client';

import type { ProductCategory } from '@/core/database/schema';
import { createCategory, deleteCategory, updateCategory } from '@/features/storage/actions';
import { Button, Dialog, Icon } from '@/shared/components/ui';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './FeaturedItems.module.css';
import { AddCategoryModal } from './components/AddCategoryModal';
import { EditCategoryModal } from './components/EditCategoryModal';

interface CategoryItemProps {
  id: string;
  name?: string;
  imageUrl?: string | null;
  isAddButton?: boolean;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  onSelect?: () => void;
}

function CategoryCardContent({
  name,
  imageUrl,
  isOwner,
  onEdit,
  onDelete,
}: {
  name?: string;
  imageUrl?: string | null;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <>
      <div className={styles.itemAvatarContainer}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name || 'Category'}
            fill
            className={styles.itemAvatarImage}
            sizes="40px"
            priority={false}
          />
        ) : (
          <div className={styles.itemAvatarIconContainer}>
            <svg
              className={styles.itemAvatarIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              fill="currentColor"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
            </svg>
          </div>
        )}
      </div>

      <span className={styles.itemName}>{name}</span>

      {isOwner && (
        <div className={styles.ownerActions}>
          {onEdit && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.editBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Editar categoría ${name}`}
              title={`Editar ${name}`}
            >
              <Icon>edit</Icon>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Eliminar categoría ${name}`}
              title={`Eliminar ${name}`}
            >
              <Icon>close</Icon>
            </button>
          )}
        </div>
      )}
    </>
  );
}

function CategoryItem({
  _id,
  name,
  imageUrl,
  isAddButton,
  isOwner,
  onEdit,
  onDelete,
  onAdd,
  onSelect,
}: CategoryItemProps & { _id?: string }) {
  return (
    <div
      className={`${styles.itemCard} ${isAddButton ? styles.addButtonCard : ''}`}
      onClick={() => {
        if (isAddButton && onAdd) {
          onAdd();
        } else if (onSelect) {
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isAddButton && onAdd) onAdd();
          else if (onSelect) onSelect();
        }
      }}
    >
      {!isAddButton ? (
        <CategoryCardContent
          name={name}
          imageUrl={imageUrl}
          isOwner={isOwner}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <div className={styles.itemPlaceholder}>
          <div className={styles.addIconCircle}>
            <Icon>add</Icon>
          </div>
          <span>Nueva Categoría</span>
        </div>
      )}
    </div>
  );
}

const EMPTY_CATEGORIES: ProductCategory[] = [];

export default function FeaturedItems({
  isOwner = false,
  categories = EMPTY_CATEGORIES,
  onCategorySelect,
}: {
  isOwner?: boolean;
  categories?: ProductCategory[];
  onCategorySelect?: (categoryId: string) => void;
}) {
  const params = useParams();
  const businessSlug = params.slug as string;

  const [items, setItems] = useState<ProductCategory[]>(() => categories);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({ open: false, description: '', color: 'error', icon: 'error' });

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const handleSaveCategory = async (id: string, newName: string, imageFile: File | null) => {
    try {
      let finalImageUrl = editingCategory?.imageUrl || null;

      if (imageFile) {
        const { uploadCategoryImage } = await import('@/features/storage/services/storageService');

        finalImageUrl = await uploadCategoryImage(imageFile, businessSlug);
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, name: newName, imageUrl: finalImageUrl } : item,
        ),
      );

      const payloadObj: { name?: string; imageUrl?: string | null } = {
        name: newName,
      };

      if (finalImageUrl !== undefined) {
        payloadObj.imageUrl = finalImageUrl;
      }

      const result = await updateCategory(businessSlug, id, payloadObj);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar categoría');
      }

      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      setItems(categories);
      window.alert(
        'Error en el servidor: ' + (error instanceof Error ? error.message : String(error)),
      );

      throw error;
    }
  };

  const handleSaveNewCategory = async (newName: string, imageFile: File | null) => {
    try {
      let finalImageUrl: string | null = null;

      if (imageFile) {
        const { uploadCategoryImage } = await import('@/features/storage/services/storageService');
        finalImageUrl = await uploadCategoryImage(imageFile, businessSlug);
      }

      const result = await createCategory(businessSlug, {
        name: newName,
        imageUrl: finalImageUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la categoría');
      }

      const newCategory: ProductCategory = {
        id: result.category?.id || `new-${Date.now()}`,
        name: newName,
        businessId: '',
        imageUrl: finalImageUrl,
        displayOrder: items.length,
      } as unknown as ProductCategory;

      setItems((prev) => [...prev, { ...newCategory, id: result.category?.id || newCategory.id }]);

      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error adding new category:', error);
      window.alert(
        'Error al agregar categoría: ' + (error instanceof Error ? error.message : String(error)),
      );
      throw error;
    }
  };

  const handleDeleteCategory = (item: ProductCategory) => {
    setCategoryToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    const result = await deleteCategory(businessSlug, categoryToDelete.id);

    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== categoryToDelete.id));
      setAlert({
        open: true,
        description: `Categoría "${categoryToDelete.name}" eliminada`,
        color: 'success',
        icon: 'check_circle',
      });
    } else {
      setAlert({
        open: true,
        description: result.error || 'Error al eliminar la categoría',
        color: 'error',
        icon: 'error',
      });
    }

    setCategoryToDelete(null);
  };

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Categorías</h2>
      </div>

      <div className={styles.itemsContainer}>
        {items.map((item: ProductCategory) => (
          <CategoryItem
            key={item.id}
            id={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            isAddButton={false}
            isOwner={isOwner}
            onEdit={() => setEditingCategory(item)}
            onDelete={() => handleDeleteCategory(item)}
            onSelect={() => onCategorySelect && onCategorySelect(item.id)}
          />
        ))}
        {isOwner && (
          <CategoryItem id="add-new" isAddButton={true} onAdd={() => setIsAddingCategory(true)} />
        )}
      </div>

      <EditCategoryModal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      <AddCategoryModal
        open={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        onSave={handleSaveNewCategory}
      />

      {/* Diálogo de confirmación para eliminar categoría */}
      {categoryToDelete && (
        <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} type="alert">
          <div slot="headline">Eliminar categoría</div>
          <div slot="content">
            ¿Eliminar la categoría <strong>{categoryToDelete.name}</strong>?
            <br />
            <br />
            Los productos asignados a esta categoría quedarán sin categoría.
          </div>
          <div slot="actions">
            <Button variant="text" onClick={() => setCategoryToDelete(null)}>
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
        </Dialog>
      )}

      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />
    </section>
  );
}
