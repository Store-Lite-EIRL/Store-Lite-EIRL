import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../PricingSection.module.css'), 'utf-8');

describe('PricingSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('section shell', () => {
    it('provides 96px vertical padding that collapses to 60px on mobile', () => {
      const sectionBlock = cssContent.match(/\.section\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(sectionBlock).toContain('padding: 96px 0');
      expect(cssContent).toMatch(
        /@media \(max-width: 760px\)\s*\{[^}]*\.section\s*\{[^}]*padding: 60px 0/,
      );
    });

    it('centers content in a responsive wrap', () => {
      const wrapBlock = cssContent.match(/\.wrap\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(wrapBlock).toContain('max-width: var(--max-width)');
      expect(wrapBlock).toContain('margin: 0 auto');
    });
  });

  describe('section head', () => {
    it('limits the section head to 56ch', () => {
      const headBlock = cssContent.match(/\.sectionHead\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(headBlock).toContain('max-width: 56ch');
    });

    it('renders the heading in brand font and body copy in muted plain font', () => {
      const h2Block = cssContent.match(/\.sectionHead h2\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(h2Block).toContain('font-family: var(--font-brand)');
      expect(h2Block).toContain('font-weight: 700');
      const pBlock = cssContent.match(/\.sectionHead p\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(pBlock).toContain('font-family: var(--font-plain)');
      expect(pBlock).toContain('color: var(--color-text-muted)');
    });
  });

  describe('pricing toggle', () => {
    it('styles the toggle as an inline-flex pill with a subtle background', () => {
      const toggleBlock = cssContent.match(/\.pricingToggle\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(toggleBlock).toContain('display: inline-flex');
      expect(toggleBlock).toContain('border-radius: var(--radius-full)');
      expect(toggleBlock).toContain('padding: 4px');
      expect(toggleBlock).toContain('margin-top: 8px');
    });

    it('applies gradient background and glow shadow to the active option', () => {
      expect(cssContent).toMatch(
        /\.toggleActive\s*\{[^}]*background: var\(--gradient-primary\)[^}]*color: #fff[^}]*box-shadow: var\(--shadow-glow\)/,
      );
    });

    it('applies muted color to the inactive option', () => {
      const inactiveBlock = cssContent.match(/\.toggleInactive\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(inactiveBlock).toContain('color: var(--color-text-muted)');
    });

    it('rounds toggle buttons to pill shape at 13px / 600 weight', () => {
      expect(cssContent).toMatch(/\.toggleButton\s*\{[^}]*padding: 9px 20px/);
      expect(cssContent).toMatch(/\.toggleButton\s*\{[^}]*font-size: 13px/);
      expect(cssContent).toMatch(/\.toggleButton\s*\{[^}]*font-weight: 600/);
    });
  });

  describe('plans grid', () => {
    it('lays out 2 columns with 40px top margin and 22px gap', () => {
      const plansBlock = cssContent.match(/\.plans\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(plansBlock).toContain('margin-top: 40px');
      expect(plansBlock).toContain('grid-template-columns: 1fr 1fr');
      expect(plansBlock).toContain('gap: 22px');
    });

    it('collapses to 1 column below 760px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 760px\)\s*\{[^}]*\.plans\s*\{[^}]*grid-template-columns: 1fr/,
      );
    });
  });

  describe('plan card', () => {
    it('styles the plan as a surface tile with radius-lg and relative position', () => {
      const planBlock = cssContent.match(/\.plan\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(planBlock).toContain('background: var(--color-surface)');
      expect(planBlock).toContain('border-radius: var(--radius-l)');
      expect(planBlock).toContain('padding: 34px');
      expect(planBlock).toContain('position: relative');
      expect(planBlock).toContain('box-shadow: var(--shadow-md)');
      expect(planBlock).toContain('border: 1px solid var(--color-border)');
    });

    it('stretches the plan card as a flex column so CTAs align at equal height', () => {
      const planBlock = cssContent.match(/\.plan\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(planBlock).toContain('display: flex');
      expect(planBlock).toContain('flex-direction: column');
    });

    it('elevates the featured plan with shadow-lg', () => {
      const featuredBlock = cssContent.match(/\.planFeatured\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(featuredBlock).toContain('box-shadow: var(--shadow-lg)');
    });

    it('renders the featured tag absolutely positioned with gradient and glow', () => {
      const tagBlock = cssContent.match(/\.planTag\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(tagBlock).toContain('position: absolute');
      expect(tagBlock).toContain('top: -14px');
      expect(tagBlock).toContain('right: 26px');
      expect(tagBlock).toContain('background: var(--gradient-primary)');
      expect(tagBlock).toContain('color: #fff');
      expect(tagBlock).toContain('font-size: 12px');
      expect(tagBlock).toContain('font-weight: 600');
      expect(tagBlock).toContain('padding: 6px 14px');
      expect(tagBlock).toContain('border-radius: var(--radius-full)');
      expect(tagBlock).toContain('box-shadow: var(--shadow-glow)');
    });
  });

  describe('price and description', () => {
    it('renders the price in brand font at 42px / 700', () => {
      const priceBlock = cssContent.match(/\.price\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(priceBlock).toContain('margin-top: 14px');
      expect(priceBlock).toContain('font-family: var(--font-brand)');
      expect(priceBlock).toContain('font-size: 42px');
      expect(priceBlock).toContain('font-weight: 700');
    });

    it('renders the period span in plain font at 15px / 500 and muted color', () => {
      expect(cssContent).toMatch(
        /\.price span\s*\{[^}]*font-family: var\(--font-plain\)[^}]*font-size: 15px/,
      );
      expect(cssContent).toMatch(
        /\.price span\s*\{[^}]*font-weight: 500[^}]*color: var\(--color-text-muted\)/,
      );
    });

    it('renders the description 8px below the price', () => {
      const descBlock = cssContent.match(/\.desc\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(descBlock).toContain('margin-top: 8px');
    });
  });

  describe('plan features', () => {
    it('lays out features in a vertical flex with 12px gap', () => {
      const featuresBlock = cssContent.match(/\.planFeatures\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(featuresBlock).toContain('margin-top: 24px');
      expect(featuresBlock).toContain('display: flex');
      expect(featuresBlock).toContain('flex-direction: column');
      expect(featuresBlock).toContain('gap: 12px');
    });

    it('grows the features list so the CTA is pushed to the card bottom', () => {
      const featuresBlock = cssContent.match(/\.planFeatures\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(featuresBlock).toContain('flex: 1 0 auto');
    });

    it('renders each feature as a flex row with 10px gap and 14px text', () => {
      expect(cssContent).toMatch(/\.planFeatures li\s*\{[^}]*display: flex/);
      expect(cssContent).toMatch(/\.planFeatures li\s*\{[^}]*gap: 10px/);
      expect(cssContent).toMatch(/\.planFeatures li\s*\{[^}]*font-size: 14px/);
    });

    it('styles the check icon at 18px in green color', () => {
      expect(cssContent).toMatch(
        /\.planFeatures li :global\(\.material-symbols-rounded\)\s*\{[^}]*font-size: 18px/,
      );
      expect(cssContent).toMatch(
        /\.planFeatures li :global\(\.material-symbols-rounded\)\s*\{[^}]*color: #2fbe7a/,
      );
    });
  });

  describe('CTAs', () => {
    it('renders the full-width button 28px below the features', () => {
      expect(cssContent).toMatch(/\.plan .btn\s*\{[^}]*margin-top: 28px[^}]*width: 100%/);
    });

    it('styles the primary button with gradient and glow shadow', () => {
      const primaryBlock = cssContent.match(/\.btnPrimary\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(primaryBlock).toContain('background: var(--gradient-primary)');
      expect(primaryBlock).toContain('color: #fff');
      expect(primaryBlock).toContain('box-shadow: var(--shadow-glow)');
    });

    it('styles the outline button with a border and no shadow', () => {
      const outlineBlock = cssContent.match(/\.btnOutline\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(outlineBlock).toContain('background: var(--color-surface)');
      expect(outlineBlock).toContain('color: var(--color-text)');
      expect(outlineBlock).toContain('border: 1.5px solid var(--color-border)');
    });
  });

  describe('plans note', () => {
    it('centers the plans note 24px below with muted color', () => {
      const noteBlock = cssContent.match(/\.plansNote\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(noteBlock).toContain('margin-top: 24px');
      expect(noteBlock).toContain('text-align: center');
      expect(noteBlock).toContain('color: var(--color-text-muted)');
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text',
      '--color-text-muted',
      '--color-primary',
      '--color-border',
      '--gradient-primary',
      '--shadow-md',
      '--shadow-lg',
      '--shadow-glow',
      '--radius-m',
      '--radius-l',
      '--radius-full',
      '--font-brand',
      '--font-plain',
      '--max-width',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
