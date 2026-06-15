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
  isEmpty?: boolean;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
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
      {imageUrl ? (
        <div className={styles.itemImageContainer}>
          <Image
            src={imageUrl}
            alt={name || 'Category'}
            fill
            className={styles.itemImage}
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 180px"
            priority={false}
          />
        </div>
      ) : (
        <div className={styles.itemIconContainer}>
          <svg
            className={styles.itemIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
          </svg>
        </div>
      )}

      {isOwner && onDelete && (
        <button
          type="button"
          className={styles.deleteBtn}
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

      {isOwner && onEdit && (
        <div
          className={styles.editOverlay}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <svg
            className={styles.editOverlayIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
          </svg>
        </div>
      )}

      <div className={imageUrl ? styles.itemOverlay : styles.itemOverlayNoImage}>
        <span className={imageUrl ? styles.itemName : styles.itemNameNoImage}>{name}</span>
      </div>
    </>
  );
}

function CategoryItem({
  _id,
  name,
  imageUrl,
  isEmpty,
  isOwner,
  onEdit,
  onDelete,
  onAdd,
}: CategoryItemProps & { _id?: string }) {
  return (
    <div
      className={`${styles.itemCard} ${isEmpty ? styles.empty : ''}`}
      style={{ cursor: isEmpty ? 'default' : 'pointer' }}
    >
      {!isEmpty ? (
        <CategoryCardContent
          name={name}
          imageUrl={imageUrl}
          isOwner={isOwner}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <>
          <div className={styles.itemPlaceholder}>Vacio</div>
          {isOwner && onAdd && (
            <div
              className={styles.addOverlay}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <svg
                className={styles.addOverlayIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
              >
                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const EMPTY_CATEGORIES: ProductCategory[] = [];

export default function FeaturedItems({
  isOwner = false,
  categories = EMPTY_CATEGORIES,
}: {
  isOwner?: boolean;
  categories?: ProductCategory[];
}) {
  const params = useParams();
  const businessSlug = params.slug as string;

  const getInitialItems = (cats: ProductCategory[]) => {
    const displayItems: (ProductCategory & { isEmpty?: boolean })[] = [...cats];
    if (displayItems.length < 7) {
      const remaining = 7 - displayItems.length;
      for (let i = 0; i < remaining; i++) {
        displayItems.push({
          id: `empty-${i}`,
          name: '',
          businessId: '',
          displayOrder: 999,
          isEmpty: true,
        } as unknown as ProductCategory & { isEmpty?: boolean });
      }
    }
    return displayItems;
  };

  const [items, setItems] = useState<(ProductCategory & { isEmpty?: boolean })[]>(() =>
    getInitialItems(categories),
  );
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
    setItems(getInitialItems(categories));
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
      setItems(getInitialItems(categories));
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

      const newCategory: ProductCategory & { isEmpty?: boolean } = {
        id: result.category?.id || `new-${Date.now()}`,
        name: newName,
        businessId: '',
        imageUrl: finalImageUrl,
        displayOrder: items.filter((i) => !i.isEmpty).length,
        isEmpty: false,
      } as unknown as ProductCategory & { isEmpty?: boolean };

      setItems((prev) => {
        const firstEmptyIdx = prev.findIndex((i) => i.isEmpty);
        if (firstEmptyIdx !== -1) {
          const newItems = [...prev];
          newItems[firstEmptyIdx] = {
            ...newCategory,
            id: result.category?.id || newCategory.id,
          } as unknown as ProductCategory & { isEmpty?: boolean };
          return newItems;
        }
        return [...prev, { ...newCategory, id: result.category?.id || newCategory.id }];
      });

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
      <div className={styles.itemsContainer}>
        {items.map((item: ProductCategory & { isEmpty?: boolean }) => (
          <CategoryItem
            key={item.id}
            id={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            isEmpty={item.isEmpty}
            isOwner={isOwner}
            onEdit={!item.isEmpty ? () => setEditingCategory(item as ProductCategory) : undefined}
            onDelete={
              !item.isEmpty ? () => handleDeleteCategory(item as ProductCategory) : undefined
            }
            onAdd={item.isEmpty ? () => setIsAddingCategory(true) : undefined}
          />
        ))}
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
