'use client';

import type { Business, ProductCategory } from '@/core/database/schema';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { AlertSnackbar } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FeaturedItems from '../(main)/home/FeaturedItems';
import Feed from '../(main)/home/Feed';
import FilterBar from '../(main)/home/FilterBar';
import filterStyles from '../(main)/home/FilterBar.module.css';
import Hero from '../(main)/home/Hero';
import Pagination from '../(main)/home/Pagination';
import ProductFiltersTopBar from '../(main)/home/components/ProductFiltersTopBar';
import { useProductFilters } from '../(main)/home/hooks/useProductFilters';
import styles from './BusinessPageContent.module.css';
import { BasicContactDialog } from './components/BasicContactDialog';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import { FloatingChatFab } from './components/FloatingChatFab';
import ProductPreviewSheet from './components/ProductPreviewSheet';
import { DeleteProductDialog } from './storage/components/DeleteProductDialog';
import { CreateProductSheet } from './storage/components/createProduct/CreateProductSheet';
import { StorageProvider, useStorage } from './storage/context/StorageContext';
import type { Product as StorageProduct } from './storage/data';
import type { SaveProductMediaItem, SaveProductPayload } from './storage/types';

const PAGE_SIZE = 12;

interface BusinessPageContentProps {
  business: Business;
  isOwner?: boolean;
  isLoggedIn?: boolean;
  categories?: ProductCategory[];
  products?: ProductWithRelations[];
  hasPaymentGateway?: boolean;
  chatEnabled?: boolean;
}

type OwnerSheetSaveArgs = [StorageProduct, SaveProductPayload, SaveProductMediaItem[], boolean];

const mapToStorageProduct = (product: ProductWithRelations): StorageProduct => ({
  id: product.id,
  name: product.title,
  category: product.category?.name || 'Varios',
  stock: product.stock,
  price: String(product.price),
  currency: product.currency,
  status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
  image: product.media?.[0]?.mediaUrl || '',
  images: product.media?.map((m) => m.mediaUrl) || [],
  description: product.description || '',
  brand: product.brand,
  tags: product.tags,
  shippingInfo: product.shippingInfo,
  saleStatus: product.saleStatus,
  secondPrice: product.secondPrice ? String(product.secondPrice) : null,
});

export default function BusinessPageContent({
  business,
  isOwner = false,
  isLoggedIn = false,
  categories = [],
  products = [],
  hasPaymentGateway = true,
  chatEnabled = false,
}: BusinessPageContentProps) {
  // Map ProductWithRelations to the internal 'Product' type used by the Storage feature
  const mappedProducts: StorageProduct[] = products.map((p) => ({
    id: p.id,
    name: p.title,
    category: p.category?.name || 'Varios',
    stock: p.stock,
    price: String(p.price),
    currency: p.currency,
    status: p.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
    image: p.media?.[0]?.mediaUrl || '',
    images: p.media?.map((m) => m.mediaUrl) || [],
    description: p.description || '',
    brand: p.brand,
    tags: p.tags,
    shippingInfo: p.shippingInfo,
    saleStatus: p.saleStatus,
    secondPrice: p.secondPrice ? String(p.secondPrice) : null,
  }));

  const mappedCategories = categories.map((c) => c.name);

  return (
    <StorageProvider
      businessSlug={business.slug}
      initialProducts={mappedProducts}
      initialCategories={mappedCategories}
    >
      <BusinessPageContentUI
        business={business}
        isOwner={isOwner}
        isLoggedIn={isLoggedIn}
        categories={categories}
        products={products}
        hasPaymentGateway={hasPaymentGateway}
        chatEnabled={chatEnabled}
      />
    </StorageProvider>
  );
}

function BusinessPageContentUI({
  business,
  isOwner = false,
  isLoggedIn = false,
  categories = [],
  products = [],
  hasPaymentGateway = true,
  chatEnabled = false,
}: BusinessPageContentProps) {
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<ProductWithRelations | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Owner Actions State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

  const { deleteProduct, saveProductBackground } = useStorage();
  const router = useRouter();

  const {
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
    brandOptions,
    filteredProducts,
    hasActiveFilters,
    clearFilters,
  } = useProductFilters(products);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(start, start + PAGE_SIZE);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // reset to first page on tab switch
  };

  const handlePreviewProduct = (product: ProductWithRelations, imageIndex = 0) => {
    setPreviewProduct(product);
    setPreviewImageIndex(imageIndex);
    setPreviewSignal((prev) => prev + 1);
  };

  const handleEditFromPreview = () => {
    setIsEditOpen(true);
  };

  const handleCreateProduct = () => {
    setIsCreateOpen(true);
  };

  const handleDeleteFromPreview = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleteOpen(false);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        router.refresh();
        setAlert({
          open: true,
          description: 'Producto eliminado correctamente',
          color: 'success',
          icon: 'check_circle',
        });
        setPreviewProduct(null); // Close preview after delete
      } else {
        setAlert({
          open: true,
          description: result.error || 'Error al eliminar',
          color: 'error',
          icon: 'error',
        });
      }
    } catch {
      setAlert({
        open: true,
        description: 'Error inesperado',
        color: 'error',
        icon: 'error',
      });
    }
  };

  const handleSaveProduct = async (...args: OwnerSheetSaveArgs) => {
    const [optimisticProduct, payload, mediaFiles, isEdit] = args;
    try {
      const initialProduct = isEdit && previewProduct ? mapToStorageProduct(previewProduct) : null;
      const result = await saveProductBackground(
        payload,
        mediaFiles,
        isEdit,
        initialProduct,
        optimisticProduct,
      );
      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar el producto');
      }

      setAlert({
        open: true,
        description: isEdit ? 'Producto actualizado correctamente' : 'Producto guardado correctamente',
        color: 'success',
        icon: 'check_circle',
      });
      setIsEditOpen(false);
      setIsCreateOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
      setAlert({
        open: true,
        description: errorMessage,
        color: 'error',
        icon: 'error',
      });
    }
  };

  return (
    <>
      <div className="page-container">
        <Hero business={business} isOwner={isOwner} />
        <FeaturedItems isOwner={isOwner} categories={categories} />

        <FilterBar
          business={business}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProductFiltersTopBar
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={(id, checked) => {
                setSelectedCategories((prev) =>
                  checked ? [...prev, id] : prev.filter((c) => c !== id),
                );
                setCurrentPage(1);
              }}
              minPrice={absoluteMin}
              maxPrice={absoluteMax}
              currentMinPrice={currentMinPrice}
              currentMaxPrice={currentMaxPrice}
              onPriceRangeChange={(min, max) => {
                setCurrentMinPrice(min);
                setCurrentMaxPrice(max);
                setCurrentPage(1);
              }}
              showDiscountedOnly={showDiscountedOnly}
              onDiscountToggle={(checked) => {
                setShowDiscountedOnly(checked);
                setCurrentPage(1);
              }}
              onClearFilters={() => {
                clearFilters();
                setCurrentPage(1);
              }}
              hasActiveFilters={hasActiveFilters}
              selectedBrands={selectedBrands}
              onBrandChange={(brand, checked) => {
                setSelectedBrands((prev) =>
                  checked ? [...prev, brand] : prev.filter((b) => b !== brand),
                );
                setCurrentPage(1);
              }}
              brandOptions={brandOptions}
            />
            {isOwner && (
              <div className={styles.ownerActionRow}>
                <Button
                  variant="filled"
                  onClick={handleCreateProduct}
                  className={styles.addProductButton}
                >
                  <Icon slot="icon" size={21}>add_circle</Icon>
                  Agregar Producto
                </Button>
              </div>
            )}
            <Feed
              products={paginatedProducts}
              isOwner={isOwner}
              onProductPreview={handlePreviewProduct}
              hasPaymentGateway={hasPaymentGateway}
              onContactClick={() => setIsContactDialogOpen(true)}
            />
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {activeTab === 'about' && (
          <div className={filterStyles.aboutContent}>
            <div className={filterStyles.infoCard}>
              <h2 className={filterStyles.infoTitle}>Sobre nosotros</h2>
              <p className={filterStyles.description}>
                {business.description || 'No hay descripción disponible.'}
              </p>

              <div className={filterStyles.detailsGrid}>
                {business.address && (
                  <div className={filterStyles.detailItem}>
                    <strong>Dirección:</strong>
                    <span>{business.address}</span>
                  </div>
                )}
                {business.whatsappNumber && (
                  <div className={filterStyles.detailItem}>
                    <strong>WhatsApp:</strong>
                    <span>{business.whatsappNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ProductPreviewSheet
        slug={business.slug}
        product={previewProduct}
        openSignal={previewSignal}
        isOwner={isOwner}
        onEdit={handleEditFromPreview}
        onDelete={handleDeleteFromPreview}
        initialImageIndex={previewImageIndex}
      />
      {!isOwner && (
        <>
          <FloatingCartButton />
          <CartDrawer hasPaymentGateway={hasPaymentGateway} onContactClick={() => setIsContactDialogOpen(true)} />
          {chatEnabled && !isLoggedIn && <FloatingChatFab businessName={business.name} businessId={business.id} />}
        </>
      )}
      <BasicContactDialog
        business={business}
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      {isOwner && (
        <>
          <DeleteProductDialog
            open={isDeleteOpen}
            product={previewProduct ? mapToStorageProduct(previewProduct) : null}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
          />
          <CreateProductSheet
            open={isEditOpen || isCreateOpen}
            onClose={() => {
              setIsEditOpen(false);
              setIsCreateOpen(false);
            }}
            onSave={handleSaveProduct}
            initialProduct={isEditOpen && previewProduct ? mapToStorageProduct(previewProduct) : null}
          />
        </>
      )}
      {isOwner && (
        <AlertSnackbar
          open={alert.open}
          description={alert.description}
          color={alert.color}
          icon={alert.icon}
          onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
