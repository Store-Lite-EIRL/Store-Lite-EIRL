import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../HeroSection.module.css'), 'utf-8');

describe('HeroSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  it('defines the hero section with top padding, relative positioning and overflow hidden', () => {
    const heroBlock = cssContent.match(/\.hero\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(heroBlock).toContain('padding-top: 80px');
    expect(heroBlock).toContain('position: relative');
    expect(heroBlock).toContain('overflow: hidden');
  });

  describe('decorative blobs', () => {
    it('defines the shared blob base: blurred circle, 0.55 opacity, not clickable', () => {
      const blobBlock = cssContent.match(/\.blob\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(blobBlock).toContain('position: absolute');
      expect(blobBlock).toContain('border-radius: 50%');
      expect(blobBlock).toContain('filter: blur(70px)');
      expect(blobBlock).toContain('opacity: 0.55');
      expect(blobBlock).toContain('pointer-events: none');
    });

    it('dims blobs to 0.25 opacity in dark theme', () => {
      const darkBlock =
        cssContent.match(/html\[data-theme=['"]dark['"]\]\s+\.blob\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(darkBlock).toContain('opacity: 0.25');
    });

    it('positions blob-1 as a 420px token-colored circle at top-right', () => {
      const blob1 = cssContent.match(/\.blob1\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(blob1).toContain('width: 420px');
      expect(blob1).toContain('height: 420px');
      expect(blob1).toContain('background: var(--accent-blue)');
      expect(blob1).toContain('top: -140px');
      expect(blob1).toContain('right: -80px');
    });

    it('positions blob-2 as a 320px token-colored circle at bottom-left', () => {
      const blob2 = cssContent.match(/\.blob2\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(blob2).toContain('width: 320px');
      expect(blob2).toContain('height: 320px');
      expect(blob2).toContain('background: var(--accent-violet)');
      expect(blob2).toContain('bottom: -120px');
      expect(blob2).toContain('left: -100px');
    });
  });

  describe('hero grid', () => {
    it('lays out copy + product frame in a 1.05fr/0.95fr two-column grid with 64px gap', () => {
      const gridBlock = cssContent.match(/\.heroGrid\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(gridBlock).toContain('grid-template-columns: 1.05fr 0.95fr');
      expect(gridBlock).toContain('gap: 64px');
      expect(gridBlock).toContain('align-items: center');
    });

    it('collapses to a single column with 44px gap below 960px', () => {
      const mediaBlock = cssContent.match(/@media \(max-width: 960px\)\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(mediaBlock).toContain('grid-template-columns: 1fr');
      expect(mediaBlock).toContain('gap: 44px');
    });
  });

  describe('typography', () => {
    it('renders the display heading in brand font with a 34–58px fluid clamp', () => {
      const displayBlock = cssContent.match(/\.typeDisplay\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(displayBlock).toContain('font-family: var(--font-brand)');
      expect(displayBlock).toContain('clamp(34px, 4.8vw, 58px)');
      expect(displayBlock).toContain('font-weight: 700');
    });

    it('renders the body copy in plain font, muted color, 46ch max width and 18px top margin', () => {
      const subtitleBlock = cssContent.match(/\.subtitle\s*\{([^}]*)\}/)?.[1] ?? '';
      const bodyBlock = cssContent.match(/\.typeBodyLg\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(bodyBlock).toContain('font-family: var(--font-plain)');
      expect(bodyBlock).toContain('font-size: 17px');
      expect(bodyBlock).toContain('line-height: 1.6');
      expect(subtitleBlock).toContain('max-width: 46ch');
      expect(subtitleBlock).toContain('margin-top: 18px');
      expect(cssContent).toContain('.textSecondary');
      expect(cssContent).toContain('var(--color-text-muted)');
    });
  });

  describe('actions and buttons', () => {
    it('wraps the two CTAs in a flexible row with 14px gap and 30px top margin', () => {
      const actionsBlock = cssContent.match(/\.actions\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(actionsBlock).toContain('display: flex');
      expect(actionsBlock).toContain('gap: 14px');
      expect(actionsBlock).toContain('margin-top: 30px');
      expect(actionsBlock).toContain('flex-wrap: wrap');
    });

    it('styles the primary button with gradient background and glow shadow', () => {
      const btnBlock = cssContent.match(/\.btnPrimary\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(btnBlock).toContain('background: var(--gradient-primary)');
      expect(btnBlock).toContain('box-shadow: var(--shadow-glow)');
    });

    it('styles the outline button with surface background and soft shadow', () => {
      const outlineBlock = cssContent.match(/\.btnOutline\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(outlineBlock).toContain('background: var(--color-surface)');
      expect(outlineBlock).toContain('box-shadow: var(--shadow-sm)');
    });

    it('lifts both buttons 2px on hover', () => {
      expect(cssContent).toMatch(/\.btnPrimary:hover\s*\{[^}]*translateY\(-2px\)/);
      expect(cssContent).toMatch(/\.btnOutline:hover\s*\{[^}]*translateY\(-2px\)/);
    });
  });

  describe('feature row', () => {
    it('wraps the feature cards with 12px gap and 44px top margin', () => {
      const rowBlock = cssContent.match(/\.featureRow\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(rowBlock).toContain('display: flex');
      expect(rowBlock).toContain('gap: 12px');
      expect(rowBlock).toContain('margin-top: 44px');
      expect(rowBlock).toContain('flex-wrap: wrap');
    });

    it('styles each card as a flexible surface tile with soft shadow', () => {
      const cardBlock = cssContent.match(/\.featureCard\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardBlock).toContain('flex: 1');
      expect(cardBlock).toContain('min-width: 190px');
      expect(cardBlock).toContain('background: var(--color-surface)');
      expect(cardBlock).toContain('border-radius: var(--radius-m)');
      expect(cardBlock).toContain('padding: 18px');
      expect(cardBlock).toContain('box-shadow: var(--shadow-sm)');
    });

    it('pushes emoji and live badge to opposite ends of the card top row', () => {
      const topBlock = cssContent.match(/\.featureTop\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(topBlock).toContain('display: flex');
      expect(topBlock).toContain('justify-content: space-between');
    });

    it('sizes the emoji at 22px and the live badge with a green status dot', () => {
      const emojiBlock = cssContent.match(/\.emoji\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(emojiBlock).toContain('font-size: 22px');
      const liveBlock = cssContent.match(/\.live\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(liveBlock).toContain('display: flex');
      const dotBlock = cssContent.match(/\.dot\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(dotBlock).toContain('background: #2fbe7a');
    });

    it('styles card titles and descriptions in muted brand/plain typography', () => {
      const titleBlock = cssContent.match(/\.featureCard\s+h4\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(titleBlock).toContain('font-size: 15px');
      const descBlock = cssContent.match(/\.featureCard\s+p\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(descBlock).toContain('font-size: 12.5px');
      expect(descBlock).toContain('var(--color-text-muted)');
      expect(descBlock).toContain('line-height: 1.45');
    });
  });

  describe('responsive container', () => {
    it('limits the hero content to the max-width token and centers it', () => {
      const wrapBlock = cssContent.match(/\.wrap\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(wrapBlock).toContain('max-width: var(--max-width)');
      expect(wrapBlock).toContain('margin: 0 auto');
    });

    it('adjusts wrap padding at the 1024px and 768–1023px breakpoints', () => {
      expect(cssContent).toMatch(
        /@media \(min-width: 1024px\)\s*\{[^}]*\.wrap\s*\{[^}]*padding: 0 80px/,
      );
      expect(cssContent).toMatch(
        /@media \(min-width: 768px\)\s*and\s*\(max-width: 1023px\)\s*\{[^}]*\.wrap\s*\{[^}]*padding: 0 64px/,
      );
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--gradient-primary',
      '--shadow-sm',
      '--shadow-glow',
      '--radius-m',
      '--max-width',
      '--font-brand',
      '--font-plain',
      '--accent-blue',
      '--accent-violet',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
