export type StorefrontFontFamily = 'inter' | 'roboto' | 'poppins';
export type StorefrontSurfaceMode = 'light' | 'dark';

export interface StorefrontPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface StorefrontTheme {
  version: 1;
  fontFamily: StorefrontFontFamily;
  palette: StorefrontPalette;
  surfaceMode: StorefrontSurfaceMode;
}

export const STOREFRONT_THEME_PREFERENCES_KEY = 'storefrontTheme';

export const STOREFRONT_FONT_OPTIONS = [
  { value: 'inter', label: 'Moderna', description: 'Inter' },
  { value: 'roboto', label: 'Neutral', description: 'Roboto' },
  { value: 'poppins', label: 'Comercial', description: 'Poppins' },
] as const satisfies readonly {
  value: StorefrontFontFamily;
  label: string;
  description: string;
}[];

export const STOREFRONT_SURFACE_MODE_OPTIONS = [
  { value: 'light', label: 'Fondo claro' },
  { value: 'dark', label: 'Fondo oscuro' },
] as const satisfies readonly {
  value: StorefrontSurfaceMode;
  label: string;
}[];

export const STOREFRONT_PRESET_PALETTES: readonly StorefrontPalette[] = [
  { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899' },
  { primary: '#3b82f6', secondary: '#06b6d4', accent: '#10b981' },
  { primary: '#f59e0b', secondary: '#ef4444', accent: '#f472b6' },
  { primary: '#8b5cf6', secondary: '#6366f1', accent: '#3b82f6' },
  { primary: '#14b8a6', secondary: '#0ea5e9', accent: '#6366f1' },
] as const;

const DEFAULT_STOREFRONT_PALETTE: StorefrontPalette = {
  primary: '#6366f1',
  secondary: '#a855f7',
  accent: '#ec4899',
};

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  version: 1,
  fontFamily: 'inter',
  palette: DEFAULT_STOREFRONT_PALETTE,
  surfaceMode: 'dark',
};

const FONT_OPTIONS: readonly StorefrontFontFamily[] = ['inter', 'roboto', 'poppins'];
const SURFACE_MODES: readonly StorefrontSurfaceMode[] = ['light', 'dark'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function randomHexColor() {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  );
}

export function getStorefrontColorLuminance(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getReadableTextColor(hex: string, dark = '#111827', light = '#ffffff') {
  return getStorefrontColorLuminance(hex) > 0.62 ? dark : light;
}

export function deriveStorefrontSurfaceMode(palette: StorefrontPalette): StorefrontSurfaceMode {
  const averageLuminance =
    (getStorefrontColorLuminance(palette.primary) +
      getStorefrontColorLuminance(palette.secondary) +
      getStorefrontColorLuminance(palette.accent)) /
    3;

  return averageLuminance < 0.65 ? 'dark' : 'light';
}

export function createRandomStorefrontPalette(): StorefrontPalette {
  return {
    primary: randomHexColor(),
    secondary: randomHexColor(),
    accent: randomHexColor(),
  };
}

export function createRandomStorefrontTheme(
  overrides: Partial<Pick<StorefrontTheme, 'fontFamily' | 'surfaceMode'>> = {},
): StorefrontTheme {
  const palette = createRandomStorefrontPalette();
  return normalizeStorefrontTheme({
    version: 1,
    fontFamily: overrides.fontFamily ?? DEFAULT_STOREFRONT_THEME.fontFamily,
    palette,
    surfaceMode: overrides.surfaceMode ?? deriveStorefrontSurfaceMode(palette),
  });
}

export function createStorefrontThemeFromPalette(
  palette: StorefrontPalette,
  overrides: Partial<Pick<StorefrontTheme, 'fontFamily' | 'surfaceMode'>> = {},
): StorefrontTheme {
  return normalizeStorefrontTheme({
    version: 1,
    fontFamily: overrides.fontFamily ?? DEFAULT_STOREFRONT_THEME.fontFamily,
    palette,
    surfaceMode: overrides.surfaceMode ?? deriveStorefrontSurfaceMode(palette),
  });
}

export function createDefaultStorefrontTheme(): StorefrontTheme {
  return {
    version: 1,
    fontFamily: DEFAULT_STOREFRONT_THEME.fontFamily,
    palette: { ...DEFAULT_STOREFRONT_THEME.palette },
    surfaceMode: DEFAULT_STOREFRONT_THEME.surfaceMode,
  };
}

export function normalizeStorefrontTheme(input: unknown): StorefrontTheme {
  const fallback = createDefaultStorefrontTheme();
  if (!isRecord(input)) {
    return fallback;
  }

  const palette = isRecord(input.palette) ? input.palette : {};

  return {
    version: 1,
    fontFamily:
      typeof input.fontFamily === 'string' &&
      FONT_OPTIONS.includes(input.fontFamily as StorefrontFontFamily)
        ? (input.fontFamily as StorefrontFontFamily)
        : fallback.fontFamily,
    palette: {
      primary: isHexColor(palette.primary) ? palette.primary : fallback.palette.primary,
      secondary: isHexColor(palette.secondary) ? palette.secondary : fallback.palette.secondary,
      accent: isHexColor(palette.accent) ? palette.accent : fallback.palette.accent,
    },
    surfaceMode:
      typeof input.surfaceMode === 'string' &&
      SURFACE_MODES.includes(input.surfaceMode as StorefrontSurfaceMode)
        ? (input.surfaceMode as StorefrontSurfaceMode)
        : fallback.surfaceMode,
  };
}

export function getStorefrontThemeFromPreferences(preferences: unknown): StorefrontTheme {
  if (!isRecord(preferences)) {
    return createDefaultStorefrontTheme();
  }

  return normalizeStorefrontTheme(preferences[STOREFRONT_THEME_PREFERENCES_KEY]);
}

export function mergeStorefrontThemeIntoPreferences(
  preferences: unknown,
  storefrontTheme: StorefrontTheme,
): Record<string, unknown> {
  const basePreferences = isRecord(preferences) ? { ...preferences } : {};

  return {
    ...basePreferences,
    [STOREFRONT_THEME_PREFERENCES_KEY]: normalizeStorefrontTheme(storefrontTheme),
  };
}

/**
 * Returns true if a custom storefront theme has been explicitly saved in preferences.
 * When false, the storefront should inherit the platform's MD3 design system colors.
 */
export function hasCustomStorefrontTheme(preferences: unknown): boolean {
  if (!isRecord(preferences)) return false;
  return preferences[STOREFRONT_THEME_PREFERENCES_KEY] !== undefined;
}

/**
 * Removes the storefrontTheme key from preferences, effectively resetting
 * the storefront to the platform's default MD3 color tokens.
 */
export function clearStorefrontThemeFromPreferences(preferences: unknown): Record<string, unknown> {
  const basePreferences = isRecord(preferences) ? { ...preferences } : {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [STOREFRONT_THEME_PREFERENCES_KEY]: _, ...rest } = basePreferences;
  return rest;
}
