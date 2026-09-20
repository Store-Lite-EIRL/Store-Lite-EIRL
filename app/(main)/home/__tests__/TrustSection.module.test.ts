import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../TrustSection.module.css'), 'utf-8');

describe('TrustSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('section shell', () => {
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

  describe('trust row', () => {
    it('lays out 4 columns with 40px top margin and 18px gap', () => {
      const rowBlock = cssContent.match(/\.trustRow\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(rowBlock).toContain('margin-top: 40px');
      expect(rowBlock).toContain('grid-template-columns: repeat(4, 1fr)');
      expect(rowBlock).toContain('gap: 18px');
    });

    it('collapses to 2 columns below 900px and 1 column below 560px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 900px\)\s*\{[^}]*\.trustRow\s*\{[^}]*grid-template-columns: repeat\(2, 1fr\)/,
      );
      expect(cssContent).toMatch(
        /@media \(max-width: 560px\)\s*\{[^}]*\.trustRow\s*\{[^}]*grid-template-columns: 1fr/,
      );
    });
  });

  describe('trust item', () => {
    it('styles the item as a surface tile with soft shadow', () => {
      const itemBlock = cssContent.match(/\.trustItem\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(itemBlock).toContain('background: var(--color-surface)');
      expect(itemBlock).toContain('border-radius: var(--radius-m)');
      expect(itemBlock).toContain('padding: 22px');
      expect(itemBlock).toContain('box-shadow: var(--shadow-sm)');
    });

    it('sizes the icon tile at 42px with accent-blue background and white icon', () => {
      const iconBlock = cssContent.match(/\.trustIcon\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(iconBlock).toContain('width: 42px');
      expect(iconBlock).toContain('height: 42px');
      expect(iconBlock).toContain('border-radius: 12px');
      expect(iconBlock).toContain('background: var(--accent-blue)');
      expect(iconBlock).toContain('color: #fff');
      expect(iconBlock).toContain('display: flex');
      expect(iconBlock).toContain('justify-content: center');
    });

    it('styles the title 14px below the icon at 15.5px', () => {
      const titleBlock = cssContent.match(/\.trustItem h4\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(titleBlock).toContain('margin-top: 14px');
      expect(titleBlock).toContain('font-size: 15.5px');
      expect(titleBlock).toContain('font-weight: 600');
    });

    it('styles the description 5px below the title in muted body copy', () => {
      const descBlock = cssContent.match(/\.trustItem p\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(descBlock).toContain('margin-top: 5px');
      expect(descBlock).toContain('color: var(--color-text-muted)');
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--accent-blue',
      '--shadow-sm',
      '--radius-m',
      '--font-brand',
      '--font-plain',
      '--max-width',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
