import { describe, expect, it } from 'vitest';
import { resolveActiveScheme } from '../../app/[slug]/components/schemeResolution';

describe('resolveActiveScheme', () => {
  it('prioritizes viewerTheme over previewScheme and effectiveTheme', () => {
    const result = resolveActiveScheme('dark', 'light', 'light');
    expect(result).toBe('dark');
  });

  it('prioritizes previewScheme over effectiveTheme when viewerTheme is null', () => {
    const result = resolveActiveScheme(null, 'dark', 'light');
    expect(result).toBe('dark');
  });

  it('falls back to effectiveTheme when all overrides are null/undefined', () => {
    const result = resolveActiveScheme(null, undefined, 'light');
    expect(result).toBe('light');
  });

  it('returns effectiveTheme when viewerScheme is dark and no overrides', () => {
    const result = resolveActiveScheme(null, undefined, 'dark');
    expect(result).toBe('dark');
  });
});
