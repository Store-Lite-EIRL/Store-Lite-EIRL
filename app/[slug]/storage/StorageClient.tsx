'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import './storage.css';

// Components
import { CreateProductSheet } from './components/CreateProductSheet';
import { DeleteProductDialog } from './components/DeleteProductDialog';
import { ProductTable } from './components/ProductTable';
import { StorageHeader } from './components/StorageHeader';
import { TableControls } from './components/TableControls';
import { TablePagination } from './components/TablePagination';

// Hooks & Logic
import { StorageProvider, useStorage } from './context/StorageContext';
import type { Product } from './data';
import { useExtraColumns } from './hooks/useExtraColumns';
import type { SaveProductMediaItem, SaveProductPayload } from './types';

import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';

function StorageContent({ businessId }: { businessId: string }) {
  const params = useParams();
  const slug = params?.slug as string;
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Create/Edit sheet state
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Alert State
  const [alert, setAlert] = useState<{
    open: boolean;
    description: string;
    color: 'success' | 'error';
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  const showAlert = (description: string, color: 'success' | 'error', icon: string) => {
    setAlert({ open: true, description, color, icon });
  };

  const {
    products,
    allFilteredProducts,
    totalFiltered,
    totalPages,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    totalProducts,
    deleteProduct,
    saveProductBackground,
    isLoading,
  } = useStorage();

  const extraColumns = useExtraColumns(slug, allFilteredProducts);

  if (isLoading && products.length === 0) {
    return (
      <div className="storage-loading-container">
        <div className="spinner-large" />
        <p>Cargando almacén...</p>
      </div>
    );
  }

  // --- Delete handlers ---
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);

    const result = await deleteProduct(id);
    if (!result.success) {
      showAlert(result.error || 'Error al eliminar el producto', 'error', 'error');
    }
  };

  // --- Create/Edit handlers ---
  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setIsCreateSheetOpen(true);
  };

  const handleSaveProduct = async (
    optimisticProduct: Product,
    payload: SaveProductPayload,
    media: SaveProductMediaItem[],
    isEdit: boolean,
  ) => {
    // El background save ya actualiza la UI optimista por dentro
    const result = await saveProductBackground({
      payload,
      media,
      isEdit,
      initialProduct: productToEdit,
      optimisticProduct,
    });

    if (result.success) {
      setIsCreateSheetOpen(false);
      setProductToEdit(null);
      showAlert(isEdit ? 'Producto actualizado' : 'Producto guardado', 'success', 'check_circle');
    } else {
      showAlert(result.error || 'No se pudo guardar el producto', 'error', 'error');
    }
  };

  const handleCloseProductSheet = () => {
    setIsCreateSheetOpen(false);
    setProductToEdit(null);
  };

  return (
    <>
      <StorageHeader
        productsCount={totalProducts}
        allProducts={allFilteredProducts}
        onAddProduct={() => {
          setProductToEdit(null);
          setIsCreateSheetOpen(true);
        }}
        businessId={businessId}
      />

      <main className="storage-content" style={{ position: 'relative' }}>
        <TableControls extraColumns={extraColumns} />

        <ProductTable
          products={products}
          sortConfig={sortConfig}
          onSort={handleSort}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          visibleExtraColumns={extraColumns.visibleColumns}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalFiltered={totalFiltered}
          currentItemsCount={products.length}
          onPageChange={setCurrentPage}
        />
      </main>

      {/* Snackbar Alert */}
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        icon={alert.icon}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />

      {/* Delete confirmation dialog */}
      <DeleteProductDialog
        open={isDeleteDialogOpen}
        product={productToDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Create/Edit product side sheet */}
      <CreateProductSheet
        open={isCreateSheetOpen}
        onClose={handleCloseProductSheet}
        onSave={handleSaveProduct}
        nextId={''}
        initialProduct={productToEdit}
      />
    </>
  );
}

export function StorageClient({
  businessSlug,
  businessId,
  isOwner,
  permissions,
}: {
  businessSlug: string;
  businessId: string;
  isOwner: boolean;
  permissions: string[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="storage-container" />;
  }

  return (
    <div className="storage-container">
      <StorageProvider
        businessSlug={businessSlug}
        businessId={businessId}
        isOwner={isOwner}
        permissions={permissions}
      >
        <StorageContent businessId={businessId} />
      </StorageProvider>
    </div>
  );
}
