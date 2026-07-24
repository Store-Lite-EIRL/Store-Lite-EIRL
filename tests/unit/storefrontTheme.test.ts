import {
  createDefaultStorefrontTheme,
  getStorefrontColorConfig,
  normalizeStorefrontColorScheme,
} from '@/core/storefront/storefrontTheme';
import { describe, expect, it } from 'vitest';

describe('storefront theme scheme resolution', () => {
  it('keeps dark as a valid persisted scheme', () => {
    expect(normalizeStorefrontColorScheme('dark')).toBe('dark');
  });

  it('falls back to light for invalid persisted schemes', () => {
    expect(normalizeStorefrontColorScheme(undefined)).toBe('light');
    expect(normalizeStorefrontColorScheme('system')).toBe('light');
  });

  it('selects the dark color config when the persisted business scheme is dark', () => {
    const theme = createDefaultStorefrontTheme();

    expect(getStorefrontColorConfig(theme, normalizeStorefrontColorScheme('dark'))).toEqual(
      theme.dark,
    );
  });
});
