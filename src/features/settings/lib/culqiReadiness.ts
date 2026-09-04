// Pure Culqi readiness validation logic.
// No server-only imports here so it can be unit-tested and imported
// from both the server action and client components.

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface ReadinessResult {
  ready: boolean;
  passedCount: number;
  checks: CheckResult[];
}

interface BusinessInfo {
  id: string;
  email: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
}

interface SettingsInfo {
  preferences: Record<string, unknown> | null;
}

interface ProductInfo {
  id: string;
  isAvailable: boolean;
  description: string | null;
  price: string | null;
}

interface MediaInfo {
  productId: string;
}

export interface EvaluateInput {
  business: BusinessInfo | null | undefined;
  settings: SettingsInfo | null | undefined;
  products: ProductInfo[];
  media: MediaInfo[];
}

const MIN_PRODUCTS = 5;

function checkProductCount(products: ProductInfo[]): CheckResult {
  const count = products.length;
  const passed = count >= MIN_PRODUCTS;
  return {
    id: 'product_count',
    label: 'Mínimo 5 productos',
    passed,
    message: passed
      ? 'Tiene suficientes productos.'
      : `Tiene ${count} productos. Agregue al menos ${MIN_PRODUCTS - count} más.`,
  };
}

function checkProductImages(products: ProductInfo[], media: MediaInfo[]): CheckResult {
  const mediaByProduct = new Map<string, number>();
  for (const m of media) {
    mediaByProduct.set(m.productId, (mediaByProduct.get(m.productId) ?? 0) + 1);
  }
  const withoutImage = products.filter((p) => !mediaByProduct.has(p.id)).length;
  const passed = withoutImage === 0 && products.length > 0;
  return {
    id: 'product_images',
    label: 'Productos con imagen',
    passed,
    message: passed
      ? 'Todos los productos tienen imagen.'
      : `${withoutImage} producto(s) sin imagen.`,
  };
}

function checkProductDescriptions(products: ProductInfo[]): CheckResult {
  const withoutDescription = products.filter(
    (p) => !p.description || p.description.trim() === '',
  ).length;
  const passed = withoutDescription === 0 && products.length > 0;
  return {
    id: 'product_descriptions',
    label: 'Productos con descripción',
    passed,
    message: passed
      ? 'Todos los productos tienen descripción.'
      : `${withoutDescription} producto(s) sin descripción.`,
  };
}

function checkProductPrices(products: ProductInfo[]): CheckResult {
  const withoutPrice = products.filter((p) => !p.price || Number(p.price) <= 0).length;
  const passed = withoutPrice === 0 && products.length > 0;
  return {
    id: 'product_prices',
    label: 'Productos con precio',
    passed,
    message: passed
      ? 'Todos los productos tienen precio válido.'
      : `${withoutPrice} producto(s) sin precio válido.`,
  };
}

function checkTerms(preferences: Record<string, unknown>): CheckResult {
  const terms = preferences.terms;
  const passed = typeof terms === 'string' && terms.trim() !== '';
  return {
    id: 'terms',
    label: 'Términos y Condiciones publicados',
    passed,
    message: passed
      ? 'Términos y Condiciones publicados.'
      : 'Publique sus Términos y Condiciones en Configuración → Páginas legales.',
  };
}

function checkReturns(preferences: Record<string, unknown>): CheckResult {
  const returns = preferences.returns;
  const passed = typeof returns === 'string' && returns.trim() !== '';
  return {
    id: 'returns',
    label: 'Políticas de Devoluciones publicadas',
    passed,
    message: passed
      ? 'Políticas de Devoluciones publicadas.'
      : 'Publique sus Políticas de Devoluciones en Configuración → Páginas legales.',
  };
}

function checkComplaintsBook(preferences: Record<string, unknown>): CheckResult {
  const passed =
    preferences.complaintsEnabled === true || preferences.complaintBookEnabled === true;
  return {
    id: 'complaints_book',
    label: 'Libro de Reclamaciones activo',
    passed,
    message: passed
      ? 'Libro de Reclamaciones activo.'
      : 'Active el Libro de Reclamaciones en Configuración → Páginas legales.',
  };
}

function checkContactInfo(business: BusinessInfo | null | undefined): CheckResult {
  const hasEmail = Boolean(business?.email?.trim());
  const hasAddress = Boolean(business?.address?.trim());
  const passed = hasEmail && hasAddress;
  return {
    id: 'contact_info',
    label: 'Datos de contacto configurados',
    passed,
    message: passed
      ? 'Datos de contacto configurados.'
      : 'Complete el email y la dirección en Configuración → Datos del negocio.',
  };
}

function checkSocialMedia(business: BusinessInfo | null | undefined): CheckResult {
  const socialLinks = business?.socialLinks;
  const hasSocialLinks = Boolean(
    socialLinks && typeof socialLinks === 'object' && Object.keys(socialLinks).length > 0,
  );
  return {
    id: 'social_media',
    label: 'Redes sociales configuradas',
    passed: hasSocialLinks,
    message: hasSocialLinks
      ? 'Redes sociales configuradas.'
      : 'Agregue al menos una red social en Configuración → Datos del negocio.',
  };
}

export function evaluateCulqiReadiness(input: EvaluateInput): ReadinessResult {
  const { business, settings, products: availableProducts, media } = input;
  const preferences = (settings?.preferences ?? {}) as Record<string, unknown>;

  const checks: CheckResult[] = [
    checkProductCount(availableProducts),
    checkProductImages(availableProducts, media),
    checkProductDescriptions(availableProducts),
    checkProductPrices(availableProducts),
    checkTerms(preferences),
    checkReturns(preferences),
    checkComplaintsBook(preferences),
    checkContactInfo(business),
    checkSocialMedia(business),
  ];

  return {
    ready: checks.every((c) => c.passed),
    passedCount: checks.filter((c) => c.passed).length,
    checks,
  };
}
