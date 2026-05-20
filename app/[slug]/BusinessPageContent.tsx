'use client';

import type { Business, ProductCategory } from '@/core/database/schema';
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
  getContrastRatio,
  getReadableTextColor,
  getStorefrontColorConfig,
  normalizeStorefrontTheme,
} from '@/core/storefront';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { AlertSnackbar } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useTheme } from '@/shared/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
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
import type { BrandFilterOption } from '../(main)/home/hooks/useProductFilters';
import { useProductFilters } from '../(main)/home/hooks/useProductFilters';
import AboutSection from './AboutSection';
import styles from './BusinessPageContent.module.css';
import { Footer } from './Footer';
import { BasicContactDialog } from './components/BasicContactDialog';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import { FloatingChatFab } from './components/FloatingChatFab';
import { LookupOrderModal } from './components/LookupOrderModal';
import ProductPreviewSheet from './components/ProductPreviewSheet';
import { StorefrontEditor } from './components/StorefrontEditor';
import { DeleteProductDialog } from './storage/components/DeleteProductDialog';
import { CreateProductSheet } from './storage/components/createProduct/CreateProductSheet';
import { StorageProvider, useStorage } from './storage/context/StorageContext';
import type { Product as StorageProduct } from './storage/data';
import type { SaveProductMediaItem, SaveProductPayload } from './storage/types';

function ensureContrast(color: string, background: string, targetRatio = 4.5): string {
  if (getContrastRatio(color, background) >= targetRatio) return color;
  const dark = '#111827';
  const light = '#ffffff';
  const target =
    getContrastRatio(dark, background) >= getContrastRatio(light, background) ? dark : light;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 10; i++) {
    const t = (lo + hi) / 2;
    const blended = blendColors(color, target, t);
    if (getContrastRatio(blended, background) >= targetRatio) {
      hi = t;
    } else {
      lo = t;
    }
  }
  return blendColors(color, target, hi);
}

function blendColors(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b_.toString(16).padStart(2, '0')}`;
}

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
  // Props del negocio para el checkout
  businessName?: string;
  businessRuc?: string;
  businessAddress?: string;
  businessId?: string;
  plan?: string;
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
        isPaymentConfigured={isPaymentConfigured}
        culqiPublicKey={culqiPublicKey}
        chatEnabled={chatEnabled}
        storefrontLayout={storefrontLayout}
        storefrontTheme={storefrontTheme}
        previewCardTheme={previewCardTheme}
        // onShowLookupModal removed: prop not defined in interface
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
  isPaymentConfigured = false,
  culqiPublicKey,
  chatEnabled = false,
  storefrontLayout,
  storefrontTheme,
  previewCardTheme,
  plan,
}: Omit<BusinessPageContentProps, 'onShowLookupModal'>) {
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
  const [autoOpenChat, setAutoOpenChat] = useState(false);
  const [localStorefrontTheme, setLocalStorefrontTheme] = useState<StorefrontTheme>(
    () => storefrontTheme ?? createDefaultStorefrontTheme(),
  );

  const handleLocalThemeChange = useCallback((theme: StorefrontTheme) => {
    setLocalStorefrontTheme(theme);
  }, []);

  useEffect(() => {
    if (storefrontTheme) {
      setLocalStorefrontTheme(storefrontTheme);
    }
  }, [storefrontTheme]);

  const { effectiveTheme } = useTheme();
  const [previewScheme, setPreviewScheme] = useState<StorefrontColorScheme | undefined>(undefined);
  const effectiveScheme = previewScheme ?? effectiveTheme;

  // Detect ?chat_ready=true from Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('chat_ready') === 'true') {
      setAutoOpenChat(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('chat_ready');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
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

  const normalizedTheme = normalizeStorefrontTheme(localStorefrontTheme);
  const scheme = effectiveScheme;
  const themeConfig = getStorefrontColorConfig(normalizedTheme, scheme);

  const themeStyles = themeConfig
    ? ((): CSSProperties & Record<string, string> => {
        const palette = themeConfig.palette;
        const ff =
          normalizedTheme.fontFamily === 'roboto'
            ? 'var(--font-storefront-roboto), var(--mio-theme-text-font-family), sans-serif'
            : normalizedTheme.fontFamily === 'poppins'
              ? 'var(--font-storefront-poppins), var(--mio-theme-text-font-family), sans-serif'
              : 'var(--font-storefront-inter), var(--mio-theme-text-font-family), sans-serif';
        const isDark = scheme === 'dark';
        return {
          '--storefront-font-family': ff,
          // ── Storefront namespace: variables propias del storefront ──
          // No reemplazan las --md-sys-color-* de abajo; son adicionales para
          // que los componentes puedan elegir entre el tema global MD3 y el
          // tema específico del storefront sin conflictos.
          '--storefront-primary': palette.primary,
          '--storefront-on-primary': getReadableTextColor(palette.primary),
          '--storefront-secondary': palette.secondary,
          '--storefront-on-secondary': getReadableTextColor(palette.secondary),
          '--storefront-tertiary': palette.accent,
          '--storefront-on-tertiary': getReadableTextColor(palette.accent),
          '--storefront-surface': isDark ? '#0f1117' : '#ffffff',
          '--storefront-on-surface': isDark ? '#f3f4f6' : '#111827',
          '--storefront-background': isDark ? '#0f1117' : '#ffffff',
          '--storefront-on-background': isDark ? '#f3f4f6' : '#111827',
          '--storefront-surface-variant': isDark ? '#161b24' : '#f5f7fb',
          '--storefront-on-surface-variant': isDark ? '#cbd5e1' : '#4b5563',
          '--storefront-outline': isDark ? '#938f99' : '#79747e',
          '--storefront-outline-variant': isDark ? '#475569' : '#cbd5e1',
          '--storefront-error': isDark ? '#f2b8b5' : '#b3261e',
          '--storefront-on-error': isDark ? '#601410' : '#ffffff',
          '--storefront-primary-text': getReadableTextColor(palette.primary),
          // ── Legacy MD3 overrides (se mantienen para compatibilidad) ──
          '--md-sys-color-primary': palette.primary,
          '--md-sys-color-primary-rgb': `${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}`,
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
          '--md-sys-color-surface-container-lowest': isDark ? '#090a0e' : '#ffffff',
          '--md-sys-color-surface': isDark ? '#0f1117' : '#ffffff',
          '--md-sys-color-on-surface': isDark ? '#f3f4f6' : '#111827',
          '--md-sys-color-surface-variant': isDark ? '#161b24' : '#f5f7fb',
          '--md-sys-color-on-surface-variant': isDark ? '#cbd5e1' : '#4b5563',
          '--md-sys-color-surface-container-low': isDark ? '#181d29' : '#f8fafc',
          '--md-sys-color-surface-container': isDark ? '#1d2432' : '#f1f5f9',
          '--md-sys-color-surface-container-high': isDark ? '#242d3d' : '#e9eef6',
          '--md-sys-color-surface-container-highest': isDark ? '#2d3748' : '#dfe6f1',
          '--md-sys-color-background': isDark ? '#0f1117' : '#ffffff',
          '--md-sys-color-on-background': isDark ? '#f3f4f6' : '#111827',
          '--md-sys-color-outline': isDark ? '#938f99' : '#79747e',
          '--md-sys-color-outline-variant': isDark ? '#475569' : '#cbd5e1',
          '--md-sys-color-error': isDark ? '#f2b8b5' : '#b3261e',
          '--md-sys-color-on-error': isDark ? '#601410' : '#ffffff',
          '--md-sys-color-error-container': isDark ? '#8c1d18' : '#f9dedc',
          '--md-sys-color-on-error-container': isDark ? '#f9dedc' : '#410e0b',
        };
      })()
    : undefined;

  const backgroundStyles = themeConfig?.background
    ? buildBackgroundCSS(themeConfig.background)
    : {};

  // Sincronizar las CSS vars al :root para que TODOS los componentes
  // (modales, sheets, drawers, portales) hereden los colores del tema.
  // Al desmontarse, restauramos las variables que se sobreescribieron
  // para no contaminar otras páginas con colores del storefront.
  useEffect(() => {
    const root = document.documentElement;
    const allStyles: Record<string, string> = { ...themeStyles, ...backgroundStyles };
    const prevValues: Record<string, string | null> = {};

    Object.entries(allStyles).forEach(([key, value]) => {
      // Guardar valor anterior antes de pisar
      prevValues[key] = root.style.getPropertyValue(key) || null;
      root.style.setProperty(key, value);
    });

    // Cleanup: restaurar valores originales al desmontar
    return () => {
      Object.entries(prevValues).forEach(([key, prev]) => {
        if (prev === null) {
          root.style.removeProperty(key);
        } else {
          root.style.setProperty(key, prev);
        }
      });
    };
  }, [themeStyles, backgroundStyles]);

  // Sincronizar la clase del <body> con el previewScheme.
  // Cuando el usuario cambia el preview toggle (light/dark), NO solo
  // cambian las variables CSS en :root, sino que TAMBIÉN necesitamos
  // actualizar la clase del body para que TODOS los componentes
  // (globales, portales, etc.) respondan al mismo tema.
  // Al desmontar, restauramos la clase al tema global efectivo.
  const effectiveThemeRef = useRef(effectiveTheme);
  useEffect(() => {
    effectiveThemeRef.current = effectiveTheme;
  }, [effectiveTheme]);

  useEffect(() => {
    if (!previewScheme) return;

    const themeClasses = [
      'light',
      'dark',
      'light-medium-contrast',
      'dark-medium-contrast',
      'light-high-contrast',
      'dark-high-contrast',
    ];

    document.body.classList.remove(...themeClasses);
    document.body.classList.add(previewScheme);
    document.documentElement.style.colorScheme = previewScheme;

    return () => {
      document.body.classList.remove(...themeClasses);
      document.body.classList.add(effectiveThemeRef.current);
      document.documentElement.style.colorScheme = effectiveThemeRef.current;
    };
  }, [previewScheme]);

  return (
    <>
      <div className={styles.storefrontThemeRoot} style={{ ...themeStyles, ...backgroundStyles }}>
        <div className={`page-container ${styles.contentWrapper}`}>
          {storefrontLayout.sections.map(renderStorefrontSection)}
        </div>
        <Footer business={business} />
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
          {chatEnabled && !isStaff && (
            <FloatingChatFab
              businessName={business.name}
              businessId={business.id}
              slug={business.slug}
              businessLogo={business.logoUrl ?? undefined}
              initialOpen={autoOpenChat}
            />
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
            initialProduct={
              isEditOpen && previewProduct ? mapToStorageProduct(previewProduct) : null
            }
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
      {/* Theme toggle — disponible para TODOS los usuarios */}
      <div className={styles.schemeFloatingToggle}>
        <button
          className={`${styles.schemeToggleBtn} ${effectiveScheme === 'light' ? styles.schemeToggleActive : ''}`}
          onClick={() => setPreviewScheme('light')}
          aria-label="Tema claro"
          title="Tema claro"
        >
          <Icon>light_mode</Icon>
        </button>
        <button
          className={`${styles.schemeToggleBtn} ${effectiveScheme === 'dark' ? styles.schemeToggleActive : ''}`}
          onClick={() => setPreviewScheme('dark')}
          aria-label="Tema oscuro"
          title="Tema oscuro"
        >
          <Icon>dark_mode</Icon>
        </button>
      </div>
      {/* Editor de tienda — solo para staff */}
      {isStaff && (
        <StorefrontEditor
          business={{ id: business.id, slug: business.slug }}
          storefrontTheme={localStorefrontTheme}
          onThemeChange={handleLocalThemeChange}
          onPreviewSchemeChange={setPreviewScheme}
          detectedColorScheme={effectiveTheme}
          currentScheme={effectiveScheme}
          plan={plan}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isGridVisible ? (
            <>
              {!isOwner && !paymentsEnabled && (
                <div className={styles.paymentBanner} tabIndex={0}>
                  <Icon className={styles.paymentBannerIcon}>info</Icon>
                  <span>Pagos automáticos no disponibles</span>
                  <div className={styles.paymentTooltip} role="tooltip">
                    {hasPaymentGateway
                      ? 'Nuestro negocio aún no ha terminado de configurar sus credenciales de pago. Mientras tanto, puedes contactarnos para comprar.'
                      : 'Nuestro negocio aún no cuenta con la función de pasarela de pagos. Mientras tanto, puedes contactarnos para comprar.'}
                  </div>
                </div>
              )}
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
              {filteredProducts.length > 0 && (
                <div className={styles.productCount}>
                  {totalPages > 1
                    ? `Mostrando ${start + 1}-${start + paginatedProducts.length} de ${filteredProducts.length} productos`
                    : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
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
        <AboutSection
          business={business}
          previewCardTheme={previewCardTheme}
          storefrontTheme={storefrontTheme}
        />
      )}
    </>
  );
}
