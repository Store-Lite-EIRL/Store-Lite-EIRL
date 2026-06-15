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
  createDefaultStorefrontTheme,
  getReadableTextColor,
  getStorefrontColorConfig,
} from '@/core/storefront';
import type { BrandFilterOption } from '@/features/products/hooks/useProductFilters';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';
import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { DeleteProductDialog } from '@/features/storage/components/DeleteProductDialog';
import { CreateProductSheet } from '@/features/storage/components/createProduct/CreateProductSheet';
import { StorageProvider, useStorage } from '@/features/storage/context/StorageContext';
import type { Product as StorageProduct } from '@/features/storage/data';
import { BusinessPreviewCard } from '@/shared/components/business/BusinessPreviewCard';
import { AlertSnackbar } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useTheme } from '@/shared/context/ThemeContext';
import type { Business } from '@/types/business';
import type { ProductCategory } from '@/types/product';
import type { SaveProductMediaItem, SaveProductPayload } from '@/types/storage';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react';
import FeaturedItems from '../(main)/home/FeaturedItems';
import Feed from '../(main)/home/Feed';
import FilterBar from '../(main)/home/FilterBar';
import filterStyles from '../(main)/home/FilterBar.module.css';
import Hero from '../(main)/home/Hero';
import Pagination from '../(main)/home/Pagination';
import ProductFiltersTopBar from '../(main)/home/components/ProductFiltersTopBar';
import styles from './BusinessPageContent.module.css';
import { Footer } from './Footer';
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
  isOwner: _isOwner = false,
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
  // Compute background styles before themeStyles so we can detect patterns
  // and strip them from ::before — only <html> should render them.
  const _storefrontBg = buildBackgroundCSS(editableTheme[activeScheme].background);
  const _hasStorefrontBgImage = !!_storefrontBg['--storefront-bg-image'];

  if (_hasStorefrontBgImage) {
    // The pattern comes exclusively from <html> (set in useEffect).  Strip ALL
    // background-* and mask vars from ::before so it never paints a second
    // layer — otherwise the content area shows a doubled/brighter pattern.
    _storefrontBg['--storefront-bg-image'] = 'none';
    _storefrontBg['--storefront-bg'] = 'transparent';
    delete _storefrontBg['--storefront-bg-size'];
    delete _storefrontBg['--storefront-bg-position'];
    delete _storefrontBg['--storefront-bg-repeat'];
    delete _storefrontBg['--storefront-bg-blend-mode'];
    delete _storefrontBg['--storefront-mask-image'];
    delete _storefrontBg['--storefront-mask-size'];
    delete _storefrontBg['--storefront-mask-position'];
    delete _storefrontBg['--storefront-mask-repeat'];
    delete _storefrontBg['--storefront-mask-composite'];
    delete _storefrontBg['--storefront-filter'];
    delete _storefrontBg['--storefront-opacity'];
    delete _storefrontBg['--storefront-mix-blend-mode'];
    delete _storefrontBg['--storefront-animation'];
    delete _storefrontBg['--storefront-box-shadow'];
    delete _storefrontBg['--storefront-image-rendering'];
  }

  const themeStyles = ((): CSSProperties & Record<string, string> => {
    const palette = getStorefrontColorConfig(editableTheme, activeScheme).palette;
    const ff =
      editableTheme.fontFamily === 'google-sans'
        ? "'Google Sans', var(--mio-theme-text-font-family), sans-serif"
        : editableTheme.fontFamily === 'inter'
          ? 'var(--font-storefront-inter), var(--mio-theme-text-font-family), sans-serif'
          : editableTheme.fontFamily === 'roboto'
            ? 'var(--font-storefront-roboto), var(--mio-theme-text-font-family), sans-serif'
            : editableTheme.fontFamily === 'poppins'
              ? 'var(--font-storefront-poppins), var(--mio-theme-text-font-family), sans-serif'
              : "'Google Sans', var(--mio-theme-text-font-family), sans-serif";
    const isDark = activeScheme === 'dark';
    return {
      '--storefront-font-family': ff,
      '--md-sys-color-primary': palette.primary,
      '--md-sys-color-on-primary': getReadableTextColor(palette.primary),
      '--md-sys-color-primary-container': palette.primary,
      '--md-sys-color-on-primary-container': getReadableTextColor(palette.primary),
      '--md-sys-color-secondary': palette.secondary,
      '--md-sys-color-on-secondary': getReadableTextColor(palette.secondary),
      '--md-sys-color-secondary-container': palette.secondary,
      '--md-sys-color-on-secondary-container': getReadableTextColor(palette.secondary),
      '--md-sys-color-tertiary': palette.accent,
      '--md-sys-color-on-tertiary': getReadableTextColor(palette.accent),
      '--md-sys-color-tertiary-container': palette.accent,
      '--md-sys-color-on-tertiary-container': getReadableTextColor(palette.accent),
      // Opacidades reducidas para que el patrón/degradado del <html>
      // se vea a través de los componentes (Hero, cards, grid, etc.)
      '--md-sys-color-surface': isDark ? 'rgba(15, 17, 23, 0.82)' : 'rgba(255, 255, 255, 0.78)',
      '--md-sys-color-surface-container-lowest': isDark
        ? 'rgba(18, 20, 32, 0.62)'
        : 'rgba(252, 252, 253, 0.62)',
      '--md-sys-color-on-surface': isDark ? '#f3f4f6' : '#111827',
      '--md-sys-color-surface-variant': isDark
        ? 'rgba(22, 27, 36, 0.72)'
        : 'rgba(245, 247, 251, 0.68)',
      '--md-sys-color-on-surface-variant': isDark ? '#cbd5e1' : '#4b5563',
      '--md-sys-color-surface-container-low': isDark
        ? 'rgba(24, 29, 41, 0.68)'
        : 'rgba(248, 250, 252, 0.66)',
      '--md-sys-color-surface-container': isDark
        ? 'rgba(29, 36, 50, 0.72)'
        : 'rgba(241, 245, 249, 0.70)',
      '--md-sys-color-surface-container-high': isDark
        ? 'rgba(36, 45, 61, 0.76)'
        : 'rgba(233, 238, 246, 0.75)',
      '--md-sys-color-surface-container-highest': isDark
        ? 'rgba(45, 55, 72, 0.80)'
        : 'rgba(223, 230, 241, 0.80)',
      '--md-sys-color-outline-variant': isDark ? '#475569' : '#cbd5e1',
      ..._storefrontBg,
    };
  })();

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
    const bgOriginal = buildBackgroundCSS(editableTheme[activeScheme].background);
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
      const stored = localStorage.getItem('storefront-theme');
      if (stored === 'light' || stored === 'dark') {
        setViewerTheme(stored);
      }
    } catch {
      // Safari private mode — no-op
    }
  }, []);

  // Persist viewer theme choice to localStorage whenever it changes
  useEffect(() => {
    if (viewerTheme === null) return;
    try {
      localStorage.setItem('storefront-theme', viewerTheme);
    } catch {
      // Safari private mode — no-op
    }
  }, [viewerTheme]);

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
      const stored = localStorage.getItem('storefront-preview-scheme');
      if (stored === 'light' || stored === 'dark') {
        setPreviewScheme(stored);
      }
    } catch {
      // Safari private mode — no-op
    }
  }, []);

  const handlePreviewSchemeChange = useCallback(
    (scheme: StorefrontColorScheme | undefined) => {
      setPreviewScheme(scheme);
      if (scheme) {
        setViewerTheme(scheme);
        setTheme(scheme); // 'light' | 'dark' — same values
        try {
          localStorage.setItem('storefront-preview-scheme', scheme);
          localStorage.setItem('storefront-theme', scheme);
        } catch {
          // Safari private mode — no-op
        }
      }
    },
    [setPreviewScheme, setTheme],
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
            onContactClick={() => setIsContactDialogOpen(true)}
          />
          {chatEnabled && (
            <FloatingChatFab
              businessName={business.name}
              businessId={business.id}
              slug={business.slug}
              businessLogo={business.logoUrl}
            />
          )}
          <ThemeToggle currentScheme={activeScheme} onToggle={handleViewerThemeToggle} />
          <Footer business={business} />
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
            initialProduct={
              isEditOpen && previewProduct ? mapToStorageProduct(previewProduct) : null
            }
          />
          <StorefrontEditor
            business={{ id: business.id, slug: business.slug }}
            storefrontTheme={editableTheme}
            onThemeChange={setEditableTheme}
            onPreviewSchemeChange={handlePreviewSchemeChange}
            detectedColorScheme={effectiveTheme as StorefrontColorScheme}
            currentScheme={previewScheme}
            defaultScheme={defaultScheme}
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
      <LookupOrderModal
        open={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        businessSlug={business.slug}
        businessName={business.name}
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
  const paymentsEnabled = hasPaymentGateway && isPaymentConfigured;
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
              <span>
                Configura tus credenciales de pago para empezar a recibir pagos automáticos.
              </span>
            </div>
          )}
          {isOwner && !hasPaymentGateway && (
            <div className={`${styles.ownerPrompt} ${styles.ownerPromptInfo}`}>
              <span className={styles.ownerPromptIcon}>💡</span>
              <span>
                Estás en el plan básico. Actualiza tu plan para aceptar pagos automáticos y acceder
                a más beneficios.
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

              {!isOwner && (
                <div className={styles.ownerActionRow}>
                  <Button
                    variant="filled"
                    onClick={onShowLookupModal}
                    className={styles.addProductButton}
                  >
                    <Icon slot="icon" size={21}>
                      search
                    </Icon>
                    Ver Pedido
                  </Button>
                </div>
              )}
              <Feed
                products={paginatedProducts}
                isOwner={isOwner}
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
        <div
          className={filterStyles.aboutContent}
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '2.5rem',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div className={filterStyles.infoCard} style={{ flex: '1 1 500px', margin: 0 }}>
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

          <div style={{ flex: '0 1 440px' }}>
            <BusinessPreviewCard
              commercialName={business.name}
              sector={business.storeType || ''}
              country={business.country || ''}
              city={business.city || ''}
              address={business.address || ''}
              email={business.email || ''}
              description={business.description || ''}
              taxId={business.taxId || ''}
              legalRepName={business.legalRepName || ''}
              legalRepRole={business.legalRepRole || ''}
              logoPreview={business.logoUrl}
              storefrontTheme={
                previewCardTheme || storefrontTheme || createDefaultStorefrontTheme()
              }
              showDownloadButton={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
