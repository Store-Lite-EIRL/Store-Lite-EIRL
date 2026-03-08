'use client';

import type { Business, ProductCategory } from '@/core/database/schema';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { AlertSnackbar } from '@/shared/components/ui';
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
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import ProductPreviewSheet from './components/ProductPreviewSheet';
import { DeleteProductDialog } from './storage/components/DeleteProductDialog';
import { CreateProductSheet } from './storage/components/createProduct/CreateProductSheet';
import { StorageProvider, useStorage } from './storage/context/StorageContext';
import type { Product as StorageProduct } from './storage/data';
import { updateProductIsolated } from './storage/isolatedUpdateAction';
import { uploadProductImage } from './storage/services/storageService';
import { parsePriceValue } from './storage/utils/currency';

const PAGE_SIZE = 12;

interface BusinessPageContentProps {
  business: Business;
  isOwner?: boolean;
  categories?: ProductCategory[];
  products?: ProductWithRelations[];
}

export default function BusinessPageContent({
  business,
  isOwner = false,
  categories = [],
  products = [],
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
        categories={categories}
        products={products}
      />
    </StorageProvider>
  );
}

function BusinessPageContentUI({
  business,
  isOwner = false,
  categories = [],
  products = [],
}: BusinessPageContentProps) {
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<ProductWithRelations | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);

  // Owner Actions State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const { deleteProduct } = useStorage();
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

  const handlePreviewProduct = (product: ProductWithRelations) => {
    setPreviewProduct(product);
    setPreviewSignal((prev) => prev + 1);
  };

  const handleEditFromPreview = () => {
    setIsEditOpen(true);
  };

  const handleDeleteFromPreview = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleteOpen(false);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (
    _optimisticProduct: StorageProduct,
    payload: {
      name?: string;
      description?: string;
      price?: number | string;
      stock?: number | string;
      category?: string;
      status?: string;
    },
    mediaFiles: ({ type: 'url'; url: string } | { type: 'file'; file: File; preview: string })[],
    isEdit: boolean,
  ) => {
    if (!isEdit || !previewProduct) return;
    setIsSaving(true);
    try {
      const finalImageUrls: string[] = [];
      for (const item of mediaFiles) {
        if (item.type === 'url') {
          finalImageUrls.push(item.url);
        } else {
          const url = await uploadProductImage(item.file);
          finalImageUrls.push(url);
        }
      }

      const priceNum =
        typeof payload.price === 'number'
          ? payload.price
          : parsePriceValue(String(payload.price ?? previewProduct.price));
      const stockNum =
        typeof payload.stock === 'number'
          ? payload.stock
          : parseInt(String(payload.stock ?? previewProduct.stock), 10);

      const updateData = {
        name: payload.name?.trim() ?? previewProduct.title,
        description: payload.description?.trim() ?? previewProduct.description ?? '',
        price: priceNum,
        stock: stockNum,
        category: payload.category?.trim() ?? previewProduct.category?.name ?? '',
        status: payload.status ?? (previewProduct.isAvailable ? 'ACTIVO' : 'NO ACTIVO'),
        images: finalImageUrls,
      };

      const result = await updateProductIsolated(business.slug, previewProduct.id, updateData);
      if (!result.success) throw new Error(result.error);

      setAlert({
        open: true,
        description: 'Producto actualizado correctamente',
        color: 'success',
        icon: 'check_circle',
      });
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
      setAlert({
        open: true,
        description: errorMessage,
        color: 'error',
        icon: 'error',
      });
    } finally {
      setIsSaving(false);
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
            />
            <Feed
              products={paginatedProducts}
              isOwner={isOwner}
              onProductPreview={handlePreviewProduct}
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
      />
      {!isOwner && (
        <>
          <FloatingCartButton />
          <CartDrawer />
        </>
      )}
      {isOwner && previewProduct && (
        <>
          <DeleteProductDialog
            open={isDeleteOpen}
            product={{
              id: previewProduct.id,
              name: previewProduct.title,
              category: previewProduct.category?.name || 'Varios',
              stock: previewProduct.stock,
              price: String(previewProduct.price),
              status: previewProduct.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
              image: previewProduct.media?.[0]?.mediaUrl || '',
              images: previewProduct.media?.map((m) => m.mediaUrl) || [],
              description: previewProduct.description || '',
              currency: previewProduct.currency || 'PEN',
            }}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
          />
          <CreateProductSheet
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={handleSaveProduct}
            initialProduct={{
              id: previewProduct.id,
              name: previewProduct.title,
              category: previewProduct.category?.name || 'Varios',
              stock: previewProduct.stock,
              price: String(previewProduct.price),
              status: previewProduct.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
              image: previewProduct.media?.[0]?.mediaUrl || '',
              images: previewProduct.media?.map((m) => m.mediaUrl) || [],
              description: previewProduct.description || '',
              currency: previewProduct.currency || 'PEN',
            }}
            onSavingChange={setIsSaving}
          />
          <AlertSnackbar
            open={alert.open}
            description={alert.description}
            color={alert.color}
            icon={alert.icon}
            onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
          />
        </>
      )}
    </>
  );
}
