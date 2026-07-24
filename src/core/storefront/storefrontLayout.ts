export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type GridGap = 'sm' | 'md' | 'lg' | 'xl';
export type ProductGridCardStyle = 'default' | 'compact' | 'comfortable';

export type StorefrontSectionType = 'hero' | 'featured_categories' | 'product_grid';

export interface ProductGridColumns {
  mobile: 1 | 2;
  tablet: 2 | 3;
  desktop: 3 | 4;
}

export interface ProductGridGap {
  mobile: GridGap;
  tablet: GridGap;
  desktop: GridGap;
}

export interface ProductGridConfig {
  columns: ProductGridColumns;
  gap: ProductGridGap;
  cardStyle: ProductGridCardStyle;
}

interface StorefrontSectionBase {
  id: string;
  type: StorefrontSectionType;
  visible: boolean;
  order: number;
}

export interface HeroSection extends StorefrontSectionBase {
  type: 'hero';
}

export interface FeaturedCategoriesSection extends StorefrontSectionBase {
  type: 'featured_categories';
}

export interface ProductGridSection extends StorefrontSectionBase {
  type: 'product_grid';
  config: ProductGridConfig;
}

export type StorefrontSection = HeroSection | FeaturedCategoriesSection | ProductGridSection;

export interface StorefrontLayout {
  version: 1;
  sections: StorefrontSection[];
}

export const STOREFRONT_LAYOUT_PREFERENCES_KEY = 'storefrontLayout';

const DEFAULT_PRODUCT_GRID_CONFIG: ProductGridConfig = {
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
  gap: {
    mobile: 'md',
    tablet: 'lg',
    desktop: 'xl',
  },
  cardStyle: 'default',
};

export const DEFAULT_STOREFRONT_LAYOUT: StorefrontLayout = {
  version: 1,
  sections: [
    {
      id: 'hero',
      type: 'hero',
      visible: true,
      order: 0,
    },
    {
      id: 'featured_categories',
      type: 'featured_categories',
      visible: true,
      order: 1,
    },
    {
      id: 'product_grid',
      type: 'product_grid',
      visible: true,
      order: 2,
      config: DEFAULT_PRODUCT_GRID_CONFIG,
    },
  ],
};

const SECTION_ORDER: readonly StorefrontSectionType[] = [
  'hero',
  'featured_categories',
  'product_grid',
];
const GRID_GAPS: readonly GridGap[] = ['sm', 'md', 'lg', 'xl'];
const GRID_CARD_STYLES: readonly ProductGridCardStyle[] = ['default', 'compact', 'comfortable'];

export const STOREFRONT_SECTION_ORDER = SECTION_ORDER;
export const STOREFRONT_GRID_GAPS = GRID_GAPS;
export const STOREFRONT_GRID_CARD_STYLES = GRID_CARD_STYLES;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneDefaultLayout(): StorefrontLayout {
  return {
    version: 1,
    sections: DEFAULT_STOREFRONT_LAYOUT.sections.map((section) =>
      section.type === 'product_grid'
        ? {
            ...section,
            config: {
              columns: { ...section.config.columns },
              gap: { ...section.config.gap },
              cardStyle: section.config.cardStyle,
            },
          }
        : { ...section },
    ),
  };
}

function normalizeVisibility(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeOrder(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalizeColumns(value: unknown): ProductGridColumns {
  const fallback = DEFAULT_PRODUCT_GRID_CONFIG.columns;
  if (!isRecord(value)) {
    return { ...fallback };
  }

  const mobile = value.mobile === 2 ? 2 : 1;
  const tablet = value.tablet === 3 ? 3 : 2;
  const desktop = value.desktop === 3 ? 3 : 4;

  const safeTablet = tablet < mobile ? (mobile === 2 ? 2 : tablet) : tablet;
  const safeDesktop = desktop < safeTablet ? (safeTablet === 3 ? 3 : 4) : desktop;

  return {
    mobile,
    tablet: safeTablet as ProductGridColumns['tablet'],
    desktop: safeDesktop as ProductGridColumns['desktop'],
  };
}

function normalizeGapValue(value: unknown, fallback: GridGap): GridGap {
  return typeof value === 'string' && GRID_GAPS.includes(value as GridGap)
    ? (value as GridGap)
    : fallback;
}

function normalizeGap(value: unknown): ProductGridGap {
  const fallback = DEFAULT_PRODUCT_GRID_CONFIG.gap;
  if (!isRecord(value)) {
    return { ...fallback };
  }

  return {
    mobile: normalizeGapValue(value.mobile, fallback.mobile),
    tablet: normalizeGapValue(value.tablet, fallback.tablet),
    desktop: normalizeGapValue(value.desktop, fallback.desktop),
  };
}

function normalizeCardStyle(value: unknown): ProductGridCardStyle {
  return typeof value === 'string' && GRID_CARD_STYLES.includes(value as ProductGridCardStyle)
    ? (value as ProductGridCardStyle)
    : DEFAULT_PRODUCT_GRID_CONFIG.cardStyle;
}

function normalizeProductGridConfig(value: unknown): ProductGridConfig {
  if (!isRecord(value)) {
    return {
      columns: { ...DEFAULT_PRODUCT_GRID_CONFIG.columns },
      gap: { ...DEFAULT_PRODUCT_GRID_CONFIG.gap },
      cardStyle: DEFAULT_PRODUCT_GRID_CONFIG.cardStyle,
    };
  }

  return {
    columns: normalizeColumns(value.columns),
    gap: normalizeGap(value.gap),
    cardStyle: normalizeCardStyle(value.cardStyle),
  };
}

function normalizeSection(
  sectionType: StorefrontSectionType,
  value: unknown,
  fallbackOrder: number,
): StorefrontSection {
  const defaultSection = cloneDefaultLayout().sections.find(
    (section) => section.type === sectionType,
  );

  if (!defaultSection || !isRecord(value)) {
    return defaultSection ?? DEFAULT_STOREFRONT_LAYOUT.sections[fallbackOrder];
  }

  const base = {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : defaultSection.id,
    type: sectionType,
    visible: normalizeVisibility(value.visible, defaultSection.visible),
    order: normalizeOrder(value.order, fallbackOrder),
  };

  if (sectionType === 'product_grid') {
    return {
      ...base,
      type: 'product_grid',
      config: normalizeProductGridConfig(value.config),
    };
  }

  return {
    ...base,
    type: sectionType,
  } as StorefrontSection;
}

function sortSections(sections: StorefrontSection[]): StorefrontSection[] {
  return [...sections].sort((left, right) => left.order - right.order);
}

function collectSectionsByType(input: unknown): Partial<Record<StorefrontSectionType, unknown>> {
  if (!Array.isArray(input)) {
    return {};
  }

  const byType: Partial<Record<StorefrontSectionType, unknown>> = {};
  for (const item of input) {
    if (!isRecord(item) || typeof item.type !== 'string') {
      continue;
    }

    if ((SECTION_ORDER as readonly string[]).includes(item.type)) {
      byType[item.type as StorefrontSectionType] = item;
    }
  }

  return byType;
}

export function createDefaultStorefrontLayout(): StorefrontLayout {
  return cloneDefaultLayout();
}

export function normalizeStorefrontLayout(input: unknown): StorefrontLayout {
  const fallback = cloneDefaultLayout();
  if (!isRecord(input)) {
    return fallback;
  }

  const sectionsByType = collectSectionsByType(input.sections);
  const sections = SECTION_ORDER.map((sectionType, index) =>
    normalizeSection(sectionType, sectionsByType[sectionType], index),
  );

  return {
    version: 1,
    sections: sortSections(sections),
  };
}

export function getStorefrontLayoutFromPreferences(preferences: unknown): StorefrontLayout {
  if (!isRecord(preferences)) {
    return createDefaultStorefrontLayout();
  }

  return normalizeStorefrontLayout(preferences[STOREFRONT_LAYOUT_PREFERENCES_KEY]);
}

export function mergeStorefrontLayoutIntoPreferences(
  preferences: unknown,
  storefrontLayout: StorefrontLayout,
): Record<string, unknown> {
  const basePreferences = isRecord(preferences) ? { ...preferences } : {};

  return {
    ...basePreferences,
    [STOREFRONT_LAYOUT_PREFERENCES_KEY]: normalizeStorefrontLayout(storefrontLayout),
  };
}
