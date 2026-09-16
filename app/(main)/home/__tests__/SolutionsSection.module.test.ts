import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../SolutionsSection.module.css'), 'utf-8');

describe('SolutionsSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('section head', () => {
    it('limits the section head to 56ch and pushes the paragraph 12px down', () => {
      const headBlock = cssContent.match(/\.sectionHead\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(headBlock).toContain('max-width: 56ch');
      expect(cssContent).toMatch(/\.sectionHead p\s*\{[^}]*margin-top: 12px/);
    });

    it('styles the eyebrow icon as a 46px gradient tile with glow shadow', () => {
      const iconBlock = cssContent.match(/\.eyebrowIcon\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(iconBlock).toContain('width: 46px');
      expect(iconBlock).toContain('height: 46px');
      expect(iconBlock).toContain('border-radius: 14px');
      expect(iconBlock).toContain('background: var(--gradient-primary)');
      expect(iconBlock).toContain('color: #fff');
      expect(iconBlock).toContain('margin-bottom: 18px');
      expect(iconBlock).toContain('box-shadow: var(--shadow-glow)');
      expect(iconBlock).toContain('display: flex');
      expect(iconBlock).toContain('justify-content: center');
    });

    it('renders the heading in brand font with a 24–34px clamp and body copy in muted plain font', () => {
      const h2Block = cssContent.match(/\.sectionHead h2\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(h2Block).toContain('font-family: var(--font-brand)');
      expect(h2Block).toContain('clamp(24px, 2.6vw, 34px)');
      expect(h2Block).toContain('font-weight: 700');
      const pBlock = cssContent.match(/\.sectionHead p\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(pBlock).toContain('font-family: var(--font-plain)');
      expect(pBlock).toContain('font-size: 17px');
      expect(pBlock).toContain('color: var(--color-text-muted)');
    });
  });

  describe('card grid', () => {
    it('lays out 3 columns with 44px top margin and 18px gap', () => {
      const gridBlock = cssContent.match(/\.cardGrid\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(gridBlock).toContain('margin-top: 44px');
      expect(gridBlock).toContain('grid-template-columns: repeat(3, 1fr)');
      expect(gridBlock).toContain('gap: 18px');
    });

    it('collapses to 2 columns below 960px and 1 column below 640px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 960px\)\s*\{[^}]*\.cardGrid\s*\{[^}]*grid-template-columns: repeat\(2, 1fr\)/,
      );
      expect(cssContent).toMatch(
        /@media \(max-width: 640px\)\s*\{[^}]*\.cardGrid\s*\{[^}]*grid-template-columns: 1fr/,
      );
    });
  });

  describe('info card', () => {
    it('styles the card as a surface tile with soft shadow that lifts on hover', () => {
      const cardBlock = cssContent.match(/\.infoCard\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardBlock).toContain('background: var(--color-surface)');
      expect(cardBlock).toContain('border-radius: var(--radius-md)');
      expect(cardBlock).toContain('padding: 24px');
      expect(cardBlock).toContain('box-shadow: var(--shadow-sm)');
      expect(cssContent).toMatch(
        /\.infoCard:hover\s*\{[^}]*box-shadow: var\(--shadow-md\)[^}]*transform: translateY\(-3px\)/,
      );
    });

    it('sizes the icon chip at 42px with a container-colored background', () => {
      const chipBlock = cssContent.match(/\.iconChip\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(chipBlock).toContain('width: 42px');
      expect(chipBlock).toContain('height: 42px');
      expect(chipBlock).toContain('border-radius: 12px');
      expect(chipBlock).toContain('background: var(--accent-blue)');
      expect(chipBlock).toContain('color: #fff');
      expect(chipBlock).toContain('display: flex');
      expect(chipBlock).toContain('justify-content: center');
    });

    it('styles the issue paragraph bold with 16px top margin and the fix row as a flex gap', () => {
      const issueBlock = cssContent.match(/\.issue\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(issueBlock).toContain('margin-top: 16px');
      expect(issueBlock).toContain('font-weight: 600');
      const fixBlock = cssContent.match(/\.fixRow\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(fixBlock).toContain('display: flex');
      expect(fixBlock).toContain('gap: 8px');
      expect(fixBlock).toContain('margin-top: 12px');
    });

    it('colors the check_circle fix icon in primary at 20px', () => {
      expect(cssContent).toMatch(
        /\.fixRow\s+:global\(\.material-symbols-rounded\)\s*\{[^}]*color: var\(--color-primary\)/,
      );
      expect(cssContent).toMatch(
        /\.fixRow\s+:global\(\.material-symbols-rounded\)\s*\{[^}]*font-size: 20px/,
      );
    });
  });

  describe('integration row', () => {
    it('lays out 5 integration chips with 32px top margin and 14px gap', () => {
      const rowBlock = cssContent.match(/\.intRow\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(rowBlock).toContain('margin-top: 32px');
      expect(rowBlock).toContain('grid-template-columns: repeat(5, 1fr)');
      expect(rowBlock).toContain('gap: 14px');
    });

    it('collapses to 3 columns below 900px and 2 columns below 560px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 900px\)\s*\{[^}]*\.intRow\s*\{[^}]*grid-template-columns: repeat\(3, 1fr\)/,
      );
      expect(cssContent).toMatch(
        /@media \(max-width: 560px\)\s*\{[^}]*\.intRow\s*\{[^}]*grid-template-columns: repeat\(2, 1fr\)/,
      );
    });

    it('styles each chip as a centered surface tile with a 40px round icon chip', () => {
      const chipBlock = cssContent.match(/\.intChip\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(chipBlock).toContain('background: var(--color-surface)');
      expect(chipBlock).toContain('border-radius: var(--radius-md)');
      expect(chipBlock).toContain('padding: 18px');
      expect(chipBlock).toContain('box-shadow: var(--shadow-sm)');
      expect(chipBlock).toContain('text-align: center');
      const iconBlock = cssContent.match(/\.intChipIcon\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(iconBlock).toContain('width: 40px');
      expect(iconBlock).toContain('height: 40px');
      expect(iconBlock).toContain('border-radius: 50%');
      expect(iconBlock).toContain('background: var(--accent-blue)');
      expect(iconBlock).toContain('color: #fff');
    });

    it('styles the chip name at 14px/600 and the category caption in muted 11.5px', () => {
      const nameBlock = cssContent.match(/\.intName\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(nameBlock).toContain('font-weight: 600');
      expect(nameBlock).toContain('font-size: 14px');
      const catBlock = cssContent.match(/\.intCat\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(catBlock).toContain('font-size: 11.5px');
      expect(catBlock).toContain('color: var(--color-text-muted)');
      expect(catBlock).toContain('margin-top: 2px');
    });

    it('centers the "more integrations" note in muted text', () => {
      const moreBlock = cssContent.match(/\.intMore\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(moreBlock).toContain('margin-top: 20px');
      expect(moreBlock).toContain('text-align: center');
      expect(moreBlock).toContain('color: var(--color-text-muted)');
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--color-primary',
      '--gradient-primary',
      '--shadow-sm',
      '--shadow-md',
      '--shadow-glow',
      '--radius-md',
      '--font-brand',
      '--font-plain',
      '--accent-blue',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
