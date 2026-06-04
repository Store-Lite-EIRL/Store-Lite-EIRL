import type { StorefrontBackground } from '@/core/storefront/storefrontTheme';
import { buildBackgroundCSS } from '@/core/storefront/storefrontTheme';
import { describe, expect, it } from 'vitest';

describe('buildBackgroundCSS with PatternCraft patterns', () => {
  it('generates CSS vars for basic-grid pattern (no pattern color, no mask)', () => {
    const bg: StorefrontBackground = {
      type: 'solid',
      colors: ['#ffffff'],
      cssOverlay: {
        patternId: 'basic-grid',
        backgroundImage: [
          'linear-gradient(to right, #e5e7eb 1px, transparent 1px)',
          'linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
        ].join(',\n        '),
        backgroundSize: '40px 40px',
      },
    };

    const result = buildBackgroundCSS(bg);

    // Pattern without own background → bg is 'transparent' (fill colors ignored)
    expect(result['--storefront-bg']).toBe('#ffffff');
    expect(result['--storefront-bg-image']).toContain('linear-gradient');
    expect(result['--storefront-bg-size']).toBe('40px 40px');
    expect(result['--storefront-bg-position']).toBeUndefined();
    expect(result['--storefront-mask-image']).toBeUndefined();
  });

  it('generates CSS vars for black-basic-grid pattern (has own background color)', () => {
    const bg: StorefrontBackground = {
      type: 'solid',
      colors: ['#ffffff'],
      cssOverlay: {
        patternId: 'black-basic-grid',
        background: '#000000',
        backgroundImage: [
          'linear-gradient(to right, rgba(75, 85, 99, 0.4) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(75, 85, 99, 0.4) 1px, transparent 1px)',
        ].join(',\n        '),
        backgroundSize: '40px 40px',
      },
    };

    const result = buildBackgroundCSS(bg);

    // Pattern with own background → bg var should be pattern's color
    expect(result['--storefront-bg']).toBe('#000000');
    expect(result['--storefront-bg-image']).toContain('linear-gradient');
    expect(result['--storefront-bg-size']).toBe('40px 40px');
  });

  it('preserves mask properties when present', () => {
    const bg: StorefrontBackground = {
      type: 'solid',
      colors: ['#ffffff'],
      cssOverlay: {
        patternId: 'fade-effect',
        backgroundImage: 'linear-gradient(135deg, #000 50%, transparent 50%)',
        backgroundSize: '20px 20px',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        maskComposite: 'subtract',
      },
    };

    const result = buildBackgroundCSS(bg);

    expect(result['--storefront-mask-image']).toBe(
      'linear-gradient(to bottom, black 0%, transparent 100%)',
    );
    expect(result['--storefront-mask-composite']).toBe('subtract');
  });
  it('replaces gradient fill entirely when pattern is active (mutually exclusive)', () => {
    const bg: StorefrontBackground = {
      type: 'gradient',
      colors: ['#ff0000', '#0000ff', '#00ff00'],
      gradientDirection: 90,
      cssOverlay: {
        patternId: 'basic-grid',
        backgroundImage: [
          'linear-gradient(to right, #e5e7eb 1px, transparent 1px)',
          'linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
        ].join(',\n        '),
        backgroundSize: '40px 40px',
      },
    };

    const result = buildBackgroundCSS(bg);

    // Pattern replaces fill — NO gradient from fill colors
    expect(result['--storefront-bg']).toBe('#ff0000');
    expect(result['--storefront-bg-image']).toContain('linear-gradient(to right');
    expect(result['--storefront-bg-image']).not.toContain('90deg');
    expect(result['--storefront-bg-size']).toBe('40px 40px');
    expect(result['--storefront-bg-position']).toBeUndefined();
  });
  it('uses pattern background color when pattern has own background (black-basic-grid style)', () => {
    const bg: StorefrontBackground = {
      type: 'gradient',
      colors: ['#ff0000', '#0000ff'],
      gradientDirection: 135,
      cssOverlay: {
        patternId: 'some-pattern',
        background: '#000000',
        backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%)',
        backgroundSize: '20px 20px',
      },
    };

    const result = buildBackgroundCSS(bg);

    // Pattern has own background → pattern IS the full background, no custom fill
    expect(result['--storefront-bg']).toBe('#000000');
    expect(result['--storefront-bg-image']).toContain('45deg');
    expect(result['--storefront-bg-image']).not.toContain('135deg');
    // No custom gradient — pattern image is all we need
  });
  it('preserves PatternCraft visual effect properties', () => {
    const bg: StorefrontBackground = {
      type: 'solid',
      colors: ['#0f172a'],
      cssOverlay: {
        patternId: 'effect-pattern',
        backgroundImage: 'radial-gradient(circle at center, #FF7112, transparent)',
        backgroundBlendMode: 'soft-light',
        filter: 'blur(80px)',
        opacity: '0.3',
        mixBlendMode: 'multiply',
        boxShadow: 'inset 0 0 60px rgba(255,255,255,0.3)',
        imageRendering: 'pixelated',
      },
    };

    const result = buildBackgroundCSS(bg);

    expect(result['--storefront-bg-blend-mode']).toBe('soft-light');
    expect(result['--storefront-filter']).toBe('blur(80px)');
    expect(result['--storefront-opacity']).toBe('0.3');
    expect(result['--storefront-mix-blend-mode']).toBe('multiply');
    expect(result['--storefront-box-shadow']).toContain('inset');
    expect(result['--storefront-image-rendering']).toBe('pixelated');
  });
  it('returns an empty object for undefined bg', () => {
    expect(buildBackgroundCSS(undefined)).toEqual({});
  });

  it('returns an empty object for bg with no colors', () => {
    expect(buildBackgroundCSS({ type: 'solid', colors: [] })).toEqual({});
  });
});
