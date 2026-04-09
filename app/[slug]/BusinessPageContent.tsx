'use client';

import type { Business, ProductCategory } from '@/core/database/schema';
import type {
  ProductGridSection,
  StorefrontLayout,
  StorefrontSection,
  StorefrontTheme,
} from '@/core/storefront';
import { getReadableTextColor } from '@/core/storefront';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import type { BrandFilterOption } from '../(main)/home/hooks/useProductFilters';
import { AlertSnackbar } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
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
  isStaff?: boolean;
  isLoggedIn?: boolean;
  categories?: ProductCategory[];
  products?: ProductWithRelations[];
  hasPaymentGateway?: boolean;
  chatEnabled?: boolean;
  storefrontLayout: StorefrontLayout;
  storefrontTheme?: StorefrontTheme;
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
  isStaff = false,
  isLoggedIn = false,
  categories = [],
  products = [],
  hasPaymentGateway = true,
  chatEnabled = false,
  storefrontLayout,
  storefrontTheme,
}: BusinessPageContentProps) {
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

  // El staff (dueño + miembros con acceso) hereda las capacidades de gestión en el context
  return (
    <StorageProvider
      businessSlug={business.slug}
      businessId={business.id}
      initialProducts={mappedProducts}
      initialCategories={mappedCategories}
      isOwner={isStaff}
    >
      <BusinessPageContentUI
        business={business}
        isOwner={isOwner}
        isStaff={isStaff}
        isLoggedIn={isLoggedIn}
        categories={categories}
        products={products}
        hasPaymentGateway={hasPaymentGateway}
        chatEnabled={chatEnabled}
        storefrontLayout={storefrontLayout}
        storefrontTheme={storefrontTheme}
      />
    </StorageProvider>
  );
}

function BusinessPageContentUI({
  business,
  isOwner = false,
  isStaff = false,
  isLoggedIn = false,
  categories = [],
  products = [],
  hasPaymentGateway = true,
  chatEnabled = false,
  storefrontLayout,
  storefrontTheme,
}: BusinessPageContentProps) {
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<ProductWithRelations | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
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
        setPreviewProduct(null);
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

  const renderStorefrontSection = (section: StorefrontSection) => {
    if (!section.visible) {
      if (section.type !== 'product_grid') {
        return null;
      }
    }

    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} business={business} isOwner={isStaff} />;
      case 'featured_categories':
        return <FeaturedItems key={section.id} isOwner={isStaff} categories={categories} />;
      case 'product_grid':
        return (
          <StorefrontProductGridSection
            key={section.id}
            section={section}
            business={business}
            categories={categories}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategories={selectedCategories}
            onSelectedCategoriesChange={setSelectedCategories}
            selectedBrands={selectedBrands}
            onSelectedBrandsChange={setSelectedBrands}
            absoluteMin={absoluteMin}
            absoluteMax={absoluteMax}
            currentMinPrice={currentMinPrice}
            onCurrentMinPriceChange={setCurrentMinPrice}
            currentMaxPrice={currentMaxPrice}
            onCurrentMaxPriceChange={setCurrentMaxPrice}
            showDiscountedOnly={showDiscountedOnly}
            onShowDiscountedOnlyChange={setShowDiscountedOnly}
            brandOptions={brandOptions}
            filteredProducts={filteredProducts}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isOwner={isStaff}
            hasPaymentGateway={hasPaymentGateway}
            onProductPreview={handlePreviewProduct}
            onContactClick={() => setIsContactDialogOpen(true)}
            onCreateProduct={handleCreateProduct}
          />
        );
      default:
        return null;
    }
  };

  const themeStyles = storefrontTheme
    ? ((): CSSProperties & Record<string, string> => {
        const ff =
          storefrontTheme.fontFamily === 'roboto'
            ? 'var(--font-storefront-roboto), var(--mio-theme-text-font-family), sans-serif'
            : storefrontTheme.fontFamily === 'poppins'
              ? 'var(--font-storefront-poppins), var(--mio-theme-text-font-family), sans-serif'
              : 'var(--font-storefront-inter), var(--mio-theme-text-font-family), sans-serif';
        const isDark = storefrontTheme.surfaceMode === 'dark';
        return {
          '--storefront-font-family': ff,
          '--md-sys-color-primary': storefrontTheme.palette.primary,
          '--md-sys-color-on-primary': getReadableTextColor(storefrontTheme.palette.primary),
          '--md-sys-color-primary-container': storefrontTheme.palette.primary,
          '--md-sys-color-on-primary-container': getReadableTextColor(storefrontTheme.palette.primary),
          '--md-sys-color-secondary': storefrontTheme.palette.secondary,
          '--md-sys-color-on-secondary': getReadableTextColor(storefrontTheme.palette.secondary),
          '--md-sys-color-secondary-container': storefrontTheme.palette.secondary,
          '--md-sys-color-on-secondary-container': getReadableTextColor(storefrontTheme.palette.secondary),
          '--md-sys-color-tertiary': storefrontTheme.palette.accent,
          '--md-sys-color-on-tertiary': getReadableTextColor(storefrontTheme.palette.accent),
          '--md-sys-color-tertiary-container': storefrontTheme.palette.accent,
          '--md-sys-color-on-tertiary-container': getReadableTextColor(storefrontTheme.palette.accent),
          '--md-sys-color-surface': isDark ? '#0f1117' : '#ffffff',
          '--md-sys-color-on-surface': isDark ? '#f3f4f6' : '#111827',
          '--md-sys-color-surface-variant': isDark ? '#161b24' : '#f5f7fb',
          '--md-sys-color-on-surface-variant': isDark ? '#cbd5e1' : '#4b5563',
          '--md-sys-color-surface-container-low': isDark ? '#181d29' : '#f8fafc',
          '--md-sys-color-surface-container': isDark ? '#1d2432' : '#f1f5f9',
          '--md-sys-color-surface-container-high': isDark ? '#242d3d' : '#e9eef6',
          '--md-sys-color-surface-container-highest': isDark ? '#2d3748' : '#dfe6f1',
          '--md-sys-color-outline-variant': isDark ? '#475569' : '#cbd5e1',
        };
      })()
    : undefined;

  return (
    <>
      <div
        className={`page-container ${styles.storefrontThemeRoot}`}
        style={themeStyles}
      >
        {storefrontLayout.sections.map(renderStorefrontSection)}
      </div>
      <ProductPreviewSheet
        slug={business.slug}
        product={previewProduct}
        openSignal={previewSignal}
        isOwner={isStaff}
        onEdit={handleEditFromPreview}
        onDelete={handleDeleteFromPreview}
        initialImageIndex={previewImageIndex}
      />
      {!isStaff && (
        <>
          <FloatingCartButton />
          <CartDrawer
            hasPaymentGateway={hasPaymentGateway}
            onContactClick={() => setIsContactDialogOpen(true)}
          />
          {chatEnabled && !isLoggedIn && (
            <FloatingChatFab businessName={business.name} businessId={business.id} />
          )}
        </>
      )}
      <BasicContactDialog
        business={business}
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      {isStaff && (
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
      {isStaff && (
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

interface StorefrontProductGridSectionProps {
  section: ProductGridSection;
  business: Business;
  categories: ProductCategory[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onSelectedCategoriesChange: Dispatch<SetStateAction<string[]>>;
  selectedBrands: string[];
  onSelectedBrandsChange: Dispatch<SetStateAction<string[]>>;
  absoluteMin: number;
  absoluteMax: number;
  currentMinPrice: number;
  onCurrentMinPriceChange: Dispatch<SetStateAction<number>>;
  currentMaxPrice: number;
  onCurrentMaxPriceChange: Dispatch<SetStateAction<number>>;
  showDiscountedOnly: boolean;
  onShowDiscountedOnlyChange: Dispatch<SetStateAction<boolean>>;
  brandOptions: BrandFilterOption[];
  filteredProducts: ProductWithRelations[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isOwner: boolean;
  hasPaymentGateway: boolean;
  onProductPreview: (product: ProductWithRelations, initialIndex?: number) => void;
  onContactClick: () => void;
  onCreateProduct: () => void;
}

function StorefrontProductGridSection({
  section,
  business,
  categories,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategories,
  onSelectedCategoriesChange,
  selectedBrands,
  onSelectedBrandsChange,
  absoluteMin,
  absoluteMax,
  currentMinPrice,
  onCurrentMinPriceChange,
  currentMaxPrice,
  onCurrentMaxPriceChange,
  showDiscountedOnly,
  onShowDiscountedOnlyChange,
  brandOptions,
  filteredProducts,
  hasActiveFilters,
  onClearFilters,
  currentPage,
  onPageChange,
  isOwner,
  hasPaymentGateway,
  onProductPreview,
  onContactClick,
  onCreateProduct,
}: StorefrontProductGridSectionProps) {
  const isGridVisible = section.visible;
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(start, start + PAGE_SIZE);

  return (
    <>
      <FilterBar
        business={business}
        activeTab={activeTab}
        onTabChange={onTabChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isGridVisible ? (
            <>
              <ProductFiltersTopBar
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={(id, checked) => {
                  onSelectedCategoriesChange((prev) =>
                    checked ? [...prev, id] : prev.filter((c) => c !== id),
                  );
                  onPageChange(1);
                }}
                minPrice={absoluteMin}
                maxPrice={absoluteMax}
                currentMinPrice={currentMinPrice}
                currentMaxPrice={currentMaxPrice}
                onPriceRangeChange={(min, max) => {
                  onCurrentMinPriceChange(min);
                  onCurrentMaxPriceChange(max);
                  onPageChange(1);
                }}
                showDiscountedOnly={showDiscountedOnly}
                onDiscountToggle={(checked) => {
                  onShowDiscountedOnlyChange(checked);
                  onPageChange(1);
                }}
                onClearFilters={() => {
                  onClearFilters();
                  onPageChange(1);
                }}
                hasActiveFilters={hasActiveFilters}
                selectedBrands={selectedBrands}
                onBrandChange={(brand, checked) => {
                  onSelectedBrandsChange((prev) =>
                    checked ? [...prev, brand] : prev.filter((b) => b !== brand),
                  );
                  onPageChange(1);
                }}
                brandOptions={brandOptions}
              />
              {isOwner && (
                <div className={styles.ownerActionRow}>
                  <Button
                    variant="filled"
                    onClick={onCreateProduct}
                    className={styles.addProductButton}
                  >
                    <Icon slot="icon" size={21}>
                      add_circle
                    </Icon>
                    Agregar Producto
                  </Button>
                </div>
              )}
              <Feed
                products={paginatedProducts}
                isOwner={isOwner}
                onProductPreview={onProductPreview}
                hasPaymentGateway={hasPaymentGateway}
                onContactClick={onContactClick}
                gridConfig={section.config}
              />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={onPageChange}
              />
            </>
          ) : (
            <div className={filterStyles.aboutContent}>
              <div className={filterStyles.infoCard}>
                <h2 className={filterStyles.infoTitle}>Catálogo oculto</h2>
                <p className={filterStyles.description}>
                  El grid de productos está oculto en la configuración del storefront, pero la
                  navegación principal del negocio sigue disponible.
                </p>
                {isOwner && (
                  <div className={styles.ownerActionRow}>
                    <Button
                      variant="filled"
                      onClick={onCreateProduct}
                      className={styles.addProductButton}
                    >
                      <Icon slot="icon" size={21}>
                        add_circle
                      </Icon>
                      Agregar Producto
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
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
    </>
  );
}
