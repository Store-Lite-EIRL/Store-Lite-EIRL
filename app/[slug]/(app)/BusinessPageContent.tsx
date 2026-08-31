'use client';

import type {
  ProductGridSection,
  StorefrontColorScheme,
  StorefrontLayout,
  StorefrontSection,
  StorefrontTheme,
} from '@/core/storefront';
import {
  buildBackgroundCSS,
  buildStorefrontThemeVars,
  createDefaultStorefrontTheme,
} from '@/core/storefront';
import type { BrandFilterOption } from '@/features/products/hooks/useProductFilters';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { DeleteProductDialog } from '@/features/storage/components/DeleteProductDialog';
import { CreateProductSheet } from '@/features/storage/components/createProduct/CreateProductSheet';
import { StorageProvider, useStorage } from '@/features/storage/context/StorageContext';
import type { Product as StorageProduct } from '@/features/storage/data';
import { AlertSnackbar } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useTheme } from '@/shared/context/ThemeContext';
import type { Business } from '@/types/business';
import type { ProductCategory } from '@/types/product';
import type { SaveProductMediaItem, SaveProductPayload } from '@/types/storage';
import { useRouter } from 'next/navigation';
import { posthog } from 'posthog-js';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react';
import FeaturedItems from '../../(main)/home/FeaturedItems';
import Feed from '../../(main)/home/Feed';
import FilterBar from '../../(main)/home/FilterBar';
import filterStyles from '../../(main)/home/FilterBar.module.css';
import Hero from '../../(main)/home/Hero';
import Pagination from '../../(main)/home/Pagination';
import ProductFiltersTopBar from '../../(main)/home/components/ProductFiltersTopBar';
import styles from './BusinessPageContent.module.css';
import { Footer } from './Footer';
import { StorefrontAboutSection } from './StorefrontAboutSection';
import { BasicContactDialog } from './components/BasicContactDialog';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import { FloatingChatFab } from './components/FloatingChatFab';
import { LookupOrderModal } from './components/LookupOrderModal';
import ProductPreviewSheet from './components/ProductPreviewSheet';
import { StorefrontEditor } from './components/StorefrontEditor';
import { ThemeToggle } from './components/ThemeToggle';
import { resolveActiveScheme } from './components/schemeResolution';

const PAGE_SIZE = 12;

interface BusinessPageContentProps {
  business: Business;
  isOwner?: boolean;
  isStaff?: boolean;
  isLoggedIn?: boolean;
  categories?: ProductCategory[];
  products?: ProductWithRelations[];
  hasPaymentGateway?: boolean;
  isPaymentConfigured?: boolean;
  culqiPublicKey?: string;
  chatEnabled?: boolean;
  storefrontLayout: StorefrontLayout;
  storefrontTheme?: StorefrontTheme;
  previewCardTheme?: StorefrontTheme;
  /** Default color scheme for the storefront from business settings */
  defaultScheme?: 'light' | 'dark';
  // Props del negocio para el checkout
  businessName?: string;
  businessRuc?: string;
  businessAddress?: string;
  businessId?: string;
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
  isPaymentConfigured = false,
  culqiPublicKey,
  chatEnabled = false,
  storefrontLayout,
  storefrontTheme,
  previewCardTheme,
  defaultScheme,
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

  const mappedCategories = categories.map((c) => ({ id: c.id, name: c.name }));

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
        isPaymentConfigured={isPaymentConfigured}
        culqiPublicKey={culqiPublicKey}
        chatEnabled={chatEnabled}
        storefrontLayout={storefrontLayout}
        storefrontTheme={storefrontTheme}
        previewCardTheme={previewCardTheme}
        defaultScheme={defaultScheme}
      />
    </StorageProvider>
  );
}

function BusinessPageContentUI({
  business,
  isOwner = false,
  isStaff = false,
  isLoggedIn: _isLoggedIn = false,
  categories = [],
  products = [],
  hasPaymentGateway = true,
  isPaymentConfigured = false,
  culqiPublicKey,
  chatEnabled = false,
  storefrontLayout,
  storefrontTheme,
  previewCardTheme,
  defaultScheme,
}: BusinessPageContentProps) {
  // Pagos habilitados para compra automática solo si plan+credenciales están listos.
  const paymentsEnabled = hasPaymentGateway && isPaymentConfigured;

  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<ProductWithRelations | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const { effectiveTheme, setTheme } = useTheme();
  const [editableTheme, setEditableTheme] = useState<StorefrontTheme>(
    () => storefrontTheme ?? createDefaultStorefrontTheme(),
  );
  const [previewScheme, setPreviewScheme] = useState<StorefrontColorScheme | undefined>(undefined);
  const [viewerTheme, setViewerTheme] = useState<'light' | 'dark' | null>(null);
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
      const result = await saveProductBackground({
        payload,
        media: mediaFiles,
        isEdit,
        initialProduct,
        optimisticProduct,
      });
      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar el producto');
      }

      setAlert({
        open: true,
        description: isEdit
          ? 'Producto actualizado correctamente'
          : 'Producto guardado correctamente',
        color: 'success',
        icon: 'check_circle',
      });

      if (!isEdit) {
        try {
          if (typeof posthog?.capture === 'function') {
            posthog.capture('product_created', {
              productId: optimisticProduct.id,
              businessSlug: business.slug,
            });
          }
        } catch {
          // Analytics should never block user flow
        }
      }

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
        return (
          <FeaturedItems
            key={section.id}
            isOwner={isStaff}
            categories={categories}
            onCategorySelect={(categoryId) => {
              if (activeTab !== 'products') handleTabChange('products');
              setSelectedCategories([categoryId]);

              // Scroll to products section smoothly
              const productsSection = document.getElementById('products-grid');
              if (productsSection) {
                const headerOffset = 140;
                const elementPosition = productsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth',
                });
              }
            }}
          />
        );
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
            isOwner={isOwner}
            isStaff={isStaff}
            hasPaymentGateway={hasPaymentGateway}
            isPaymentConfigured={isPaymentConfigured}
            culqiPublicKey={culqiPublicKey}
            onProductPreview={handlePreviewProduct}
            onContactClick={() => setIsContactDialogOpen(true)}
            onCreateProduct={handleCreateProduct}
            storefrontTheme={storefrontTheme}
            previewCardTheme={previewCardTheme}
            onShowLookupModal={() => setShowLookupModal(true)}
          />
        );
      default:
        return null;
    }
  };

  const activeScheme = resolveActiveScheme(
    viewerTheme,
    previewScheme,
    defaultScheme ?? (effectiveTheme as StorefrontColorScheme),
  );
  const themeStyles = buildStorefrontThemeVars(editableTheme, activeScheme) as CSSProperties &
    Record<string, string>;

  // Sync theme CSS vars to document root so parent elements (layout, main-area)
  // can see --storefront-bg, --storefront-bg-image, and all MD colors
  // useLayoutEffect ensures vars are applied synchronously BEFORE paint,
  // preventing the flicker from cleanup → re-apply of CSS custom properties.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(themeStyles) as [string, string][];

    // 1. Set all CSS vars on root (affects layout/main-area/storefront)
    entries.forEach(([key, value]) => root.style.setProperty(key, value));

    // Enable smooth theme transitions on background properties
    root.style.transition = 'background-color 300ms ease, background-image 300ms ease';
    document.body.style.transition = 'background-color 300ms ease';

    // 2. Recompute the ORIGINAL background (themeStyles has it stripped so
    //    ::before doesn't double-paint). HTML handles the pattern exclusively.
    const activeBackground =
      activeScheme === 'dark' ? editableTheme.dark.background : editableTheme.light.background;
    const bgOriginal = buildBackgroundCSS(activeBackground);
    const bgImage = bgOriginal['--storefront-bg-image' as keyof typeof bgOriginal] as
      | string
      | undefined;
    const hasImage = bgImage && bgImage !== 'none' && bgImage.length > 0;

    if (hasImage) {
      // Override --storefront-bg to transparent so .layout / .main-area
      // don't paint a solid color that blocks the pattern on <html>.
      root.style.setProperty('--storefront-bg', 'transparent');

      // Set the background directly on <html> so it covers the entire page.
      root.style.backgroundColor = 'transparent';
      root.style.backgroundImage = bgImage;
      root.style.backgroundSize =
        (bgOriginal['--storefront-bg-size' as keyof typeof bgOriginal] as string) || 'auto';
      root.style.backgroundPosition =
        (bgOriginal['--storefront-bg-position' as keyof typeof bgOriginal] as string) || '0 0';
      root.style.backgroundRepeat =
        (bgOriginal['--storefront-bg-repeat' as keyof typeof bgOriginal] as string) || 'repeat';
      root.style.backgroundAttachment = 'fixed';

      // Make <body> transparent so the <html> pattern/gradient shows through
      // the entire viewport — including margins, the sidebar column, and areas
      // outside .storefrontThemeRoot.
      document.body.style.backgroundColor = 'transparent';
    } else {
      // Sin imagen de fondo: <html> hereda el color sólido normal.
      root.style.backgroundColor = '';
      root.style.backgroundImage = '';
      root.style.backgroundSize = '';
      root.style.backgroundPosition = '';
      root.style.backgroundRepeat = '';
      root.style.backgroundAttachment = '';

      // Restore body background when no pattern is active.
      document.body.style.backgroundColor = '';
    }

    return () => {
      entries.forEach(([key]) => root.style.removeProperty(key));
      root.style.backgroundColor = '';
      root.style.backgroundImage = '';
      root.style.backgroundSize = '';
      root.style.backgroundPosition = '';
      root.style.backgroundRepeat = '';
      root.style.backgroundAttachment = '';
      root.style.transition = '';
      document.body.style.backgroundColor = '';
      document.body.style.transition = '';
    };
  }, [themeStyles, editableTheme, activeScheme]);

  // Read stored theme preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`storefront-theme-${business.slug}`);
      if (stored === 'light' || stored === 'dark') {
        setViewerTheme(stored);
      }
    } catch {
      // Safari private mode — no-op
    }
  }, [business.slug]);

  // Persist viewer theme choice to localStorage whenever it changes
  useEffect(() => {
    if (viewerTheme === null) return;
    try {
      localStorage.setItem(`storefront-theme-${business.slug}`, viewerTheme);
    } catch {
      // Safari private mode — no-op
    }
  }, [viewerTheme, business.slug]);

  const handleViewerThemeToggle = useCallback(() => {
    setViewerTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sync viewer theme to global app-theme so all pages reflect the change
  useEffect(() => {
    if (viewerTheme === null) return;
    setTheme(viewerTheme);
  }, [viewerTheme, setTheme]);

  // Read stored preview scheme from localStorage on mount (staff only)
  // Mirrors the same localStorage pattern as viewerTheme above.
  useEffect(() => {
    if (!isStaff) return;
    try {
      const stored = localStorage.getItem(`storefront-preview-scheme-${business.slug}`);
      if (stored === 'light' || stored === 'dark') {
        setPreviewScheme(stored);
      }
    } catch {
      // Safari private mode — no-op
    }
  }, [isStaff, business.slug]);

  const handlePreviewSchemeChange = useCallback(
    (scheme: StorefrontColorScheme | undefined) => {
      setPreviewScheme(scheme);
      if (scheme) {
        setViewerTheme(scheme);
        setTheme(scheme); // 'light' | 'dark' — same values
        try {
          localStorage.setItem(`storefront-preview-scheme-${business.slug}`, scheme);
          localStorage.setItem(`storefront-theme-${business.slug}`, scheme);
        } catch {
          // Safari private mode — no-op
        }
      }
    },
    [business.slug, setTheme],
  );

  return (
    <>
      <div className={`page-container ${styles.storefrontThemeRoot}`} style={themeStyles}>
        {storefrontLayout.sections.map(renderStorefrontSection)}
      </div>
      <ProductPreviewSheet
        slug={business.slug}
        product={previewProduct}
        openSignal={previewSignal}
        isOwner={isStaff}
        hasPaymentGateway={hasPaymentGateway}
        culqiPublicKey={culqiPublicKey}
        businessId={business.id}
        businessName={business.name}
        businessAddress={business.address ?? undefined}
        businessCity={business.city ?? undefined}
        businessLogoUrl={business.logoUrl ?? undefined}
        onEdit={handleEditFromPreview}
        onDelete={handleDeleteFromPreview}
        initialImageIndex={previewImageIndex}
      />{' '}
      {!isStaff && (
        <CustomerFloatingUi
          business={business}
          paymentsEnabled={paymentsEnabled}
          culqiPublicKey={culqiPublicKey}
          chatEnabled={chatEnabled}
          activeScheme={activeScheme}
          onViewerThemeToggle={handleViewerThemeToggle}
          onContactClick={() => setIsContactDialogOpen(true)}
        />
      )}
      <BasicContactDialog
        business={business}
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      {isStaff && (
        <StaffManagementTools
          business={{ id: business.id, slug: business.slug }}
          previewProduct={previewProduct}
          isEditOpen={isEditOpen}
          isCreateOpen={isCreateOpen}
          isDeleteOpen={isDeleteOpen}
          onSheetClose={() => {
            setIsEditOpen(false);
            setIsCreateOpen(false);
          }}
          onSave={handleSaveProduct}
          onDeleteClose={() => setIsDeleteOpen(false)}
          onDeleteConfirm={handleConfirmDelete}
          editableTheme={editableTheme}
          onThemeChange={setEditableTheme}
          onPreviewSchemeChange={handlePreviewSchemeChange}
          detectedColorScheme={effectiveTheme as StorefrontColorScheme}
          previewScheme={previewScheme}
          defaultScheme={defaultScheme}
        />
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
      <LookupOrderModal
        open={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        businessSlug={business.slug}
        businessName={business.name}
      />
    </>
  );
}

interface CustomerFloatingUiProps {
  business: Business;
  paymentsEnabled: boolean;
  culqiPublicKey?: string;
  chatEnabled: boolean;
  activeScheme: StorefrontColorScheme;
  onViewerThemeToggle: () => void;
  onContactClick: () => void;
}

function CustomerFloatingUi({
  business,
  paymentsEnabled,
  culqiPublicKey,
  chatEnabled,
  activeScheme,
  onViewerThemeToggle,
  onContactClick,
}: CustomerFloatingUiProps) {
  return (
    <>
      <FloatingCartButton />
      <CartDrawer
        hasPaymentGateway={paymentsEnabled}
        culqiPublicKey={culqiPublicKey}
        businessId={business.id}
        businessName={business.name}
        businessAddress={business.address ?? undefined}
        businessCity={business.city ?? undefined}
        businessLogoUrl={business.logoUrl ?? undefined}
        onContactClick={onContactClick}
      />
      {chatEnabled && (
        <FloatingChatFab
          businessName={business.name}
          businessId={business.id}
          slug={business.slug}
          businessLogo={business.logoUrl}
        />
      )}
      <ThemeToggle currentScheme={activeScheme} onToggle={onViewerThemeToggle} />
      <Footer business={business} />
    </>
  );
}

interface StaffManagementToolsProps {
  business: { id: string; slug: string };
  previewProduct: ProductWithRelations | null;
  isEditOpen: boolean;
  isCreateOpen: boolean;
  isDeleteOpen: boolean;
  onSheetClose: () => void;
  onSave: (...args: OwnerSheetSaveArgs) => Promise<void>;
  onDeleteClose: () => void;
  onDeleteConfirm: (id: string) => Promise<void>;
  editableTheme: StorefrontTheme;
  onThemeChange: (theme: StorefrontTheme) => void;
  onPreviewSchemeChange: (scheme: StorefrontColorScheme | undefined) => void;
  detectedColorScheme: StorefrontColorScheme;
  previewScheme?: StorefrontColorScheme;
  defaultScheme?: 'light' | 'dark';
}

function StaffManagementTools({
  business,
  previewProduct,
  isEditOpen,
  isCreateOpen,
  isDeleteOpen,
  onSheetClose,
  onSave,
  onDeleteClose,
  onDeleteConfirm,
  editableTheme,
  onThemeChange,
  onPreviewSchemeChange,
  detectedColorScheme,
  previewScheme,
  defaultScheme,
}: StaffManagementToolsProps) {
  const initialProduct = isEditOpen && previewProduct ? mapToStorageProduct(previewProduct) : null;
  return (
    <>
      <DeleteProductDialog
        open={isDeleteOpen}
        product={previewProduct ? mapToStorageProduct(previewProduct) : null}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
      />
      <CreateProductSheet
        open={isEditOpen || isCreateOpen}
        onClose={onSheetClose}
        onSave={onSave}
        initialProduct={initialProduct}
      />
      <StorefrontEditor
        business={business}
        storefrontTheme={editableTheme}
        onThemeChange={onThemeChange}
        onPreviewSchemeChange={onPreviewSchemeChange}
        detectedColorScheme={detectedColorScheme}
        currentScheme={previewScheme}
        defaultScheme={defaultScheme}
      />
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
  isStaff: boolean;
  hasPaymentGateway: boolean;
  isPaymentConfigured: boolean;
  culqiPublicKey?: string;
  onProductPreview: (product: ProductWithRelations, initialIndex?: number) => void;
  onContactClick: () => void;
  onCreateProduct: () => void;
  storefrontTheme?: StorefrontTheme;
  previewCardTheme?: StorefrontTheme;
  onShowLookupModal: () => void;
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
  isStaff,
  hasPaymentGateway,
  isPaymentConfigured,
  culqiPublicKey,
  onProductPreview,
  onContactClick,
  onCreateProduct,
  storefrontTheme,
  previewCardTheme,
  onShowLookupModal,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <StorefrontNoticeBar
            isOwner={isStaff}
            business={business}
            hasPaymentGateway={hasPaymentGateway}
            isPaymentConfigured={isPaymentConfigured}
          />
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
              <StorefrontOwnerActions
                isOwner={isStaff}
                onCreateProduct={onCreateProduct}
                onShowLookupModal={onShowLookupModal}
              />
              <Feed
                products={paginatedProducts}
                isOwner={isStaff}
                onProductPreview={onProductPreview}
                hasPaymentGateway={hasPaymentGateway}
                isPaymentConfigured={isPaymentConfigured}
                culqiPublicKey={culqiPublicKey}
                onContactClick={onContactClick}
                gridConfig={section.config}
                businessName={business.name}
                businessRuc={business.taxId ?? undefined}
                businessAddress={business.address ?? undefined}
                businessId={business.id}
                businessLogoUrl={business.logoUrl ?? undefined}
              />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={onPageChange}
              />
            </>
          ) : (
            <HiddenCatalogNotice isOwner={isStaff} onCreateProduct={onCreateProduct} />
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <StorefrontAboutSection
          business={business}
          storefrontTheme={storefrontTheme}
          previewCardTheme={previewCardTheme}
          isOwner={isOwner}
        />
      )}
    </>
  );
}

interface StorefrontNoticeBarProps {
  isOwner: boolean;
  business: Business;
  hasPaymentGateway: boolean;
  isPaymentConfigured: boolean;
}

function StorefrontNoticeBar({
  isOwner,
  business,
  hasPaymentGateway,
  isPaymentConfigured,
}: StorefrontNoticeBarProps) {
  const paymentsEnabled = hasPaymentGateway && isPaymentConfigured;
  return (
    <>
      {/* ── Badge de confianza para el customer ── */}
      {!isOwner && business.verificationStatus === 'verified' && (
        <div className={styles.verifiedBadge}>
          <Icon size={14}>verified</Icon>
          Verificado
        </div>
      )}

      {/* ── Mensajes para el owner ── */}
      {isOwner && hasPaymentGateway && !isPaymentConfigured && (
        <div className={`${styles.ownerPrompt} ${styles.ownerPromptWarning}`}>
          <span className={styles.ownerPromptIcon}>⚠️</span>
          <span>Configura tus credenciales de pago para empezar a recibir pagos automáticos.</span>
        </div>
      )}
      {isOwner && !hasPaymentGateway && (
        <div className={`${styles.ownerPrompt} ${styles.ownerPromptInfo}`}>
          <span className={styles.ownerPromptIcon}>💡</span>
          <span>
            Estás en el plan básico. Actualiza tu plan para aceptar pagos automáticos y acceder a
            más beneficios.
          </span>
        </div>
      )}

      {/* ── Info de pagos para el customer ── */}
      {!isOwner && !paymentsEnabled && (
        <div
          className={styles.paymentBanner}
          tabIndex={0}
          role="button"
          aria-label="Información de pagos"
        >
          <span className={styles.paymentBannerIcon}>?</span>
          <span>Pagos automáticos no disponibles</span>
          <div className={styles.paymentTooltip}>
            {hasPaymentGateway
              ? 'Este negocio aún no terminó de configurar sus credenciales de pago. Mientras tanto, puedes contactar al negocio para comprar.'
              : 'Este negocio necesita un plan premium para habilitar pagos automáticos. Mientras tanto, puedes contactar al negocio para comprar.'}
          </div>
        </div>
      )}
    </>
  );
}

interface StorefrontOwnerActionsProps {
  isOwner: boolean;
  onCreateProduct: () => void;
  onShowLookupModal: () => void;
}

function StorefrontOwnerActions({
  isOwner,
  onCreateProduct,
  onShowLookupModal,
}: StorefrontOwnerActionsProps) {
  if (isOwner) {
    return (
      <div className={styles.ownerActionRow}>
        <Button variant="filled" onClick={onCreateProduct} className={styles.addProductButton}>
          <Icon slot="icon" size={21}>
            add_circle
          </Icon>
          Agregar Producto
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.ownerActionRow}>
      <Button variant="filled" onClick={onShowLookupModal} className={styles.addProductButton}>
        <Icon slot="icon" size={21}>
          search
        </Icon>
        Ver Pedido
      </Button>
    </div>
  );
}

interface HiddenCatalogNoticeProps {
  isOwner: boolean;
  onCreateProduct: () => void;
}

function HiddenCatalogNotice({ isOwner, onCreateProduct }: HiddenCatalogNoticeProps) {
  return (
    <div className={filterStyles.aboutContent}>
      <div className={filterStyles.infoCard}>
        <h2 className={filterStyles.infoTitle}>Catálogo oculto</h2>
        <p className={filterStyles.description}>
          El grid de productos está oculto en la configuración del storefront, pero la navegación
          principal del negocio sigue disponible.
        </p>
        {isOwner && (
          <div className={styles.ownerActionRow}>
            <Button variant="filled" onClick={onCreateProduct} className={styles.addProductButton}>
              <Icon slot="icon" size={21}>
                add_circle
              </Icon>
              Agregar Producto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
