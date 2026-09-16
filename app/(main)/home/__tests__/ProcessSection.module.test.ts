import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../ProcessSection.module.css'), 'utf-8');

describe('ProcessSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('steps grid', () => {
    it('lays out 4 columns with 48px top margin and 22px gap', () => {
      const gridBlock = cssContent.match(/\.steps\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(gridBlock).toContain('margin-top: 48px');
      expect(gridBlock).toContain('grid-template-columns: repeat(4, 1fr)');
      expect(gridBlock).toContain('gap: 22px');
    });

    it('collapses to 2 columns below 900px and 1 column below 600px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 900px\)\s*\{[^}]*\.steps\s*\{[^}]*grid-template-columns: repeat\(2, 1fr\)/,
      );
      expect(cssContent).toMatch(
        /@media \(max-width: 600px\)\s*\{[^}]*\.steps\s*\{[^}]*grid-template-columns: 1fr/,
      );
    });
  });

  describe('step card', () => {
    it('styles the step as a surface tile with soft shadow', () => {
      const stepBlock = cssContent.match(/\.step\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(stepBlock).toContain('background: var(--color-surface)');
      expect(stepBlock).toContain('border-radius: var(--radius-md)');
      expect(stepBlock).toContain('padding: 22px');
      expect(stepBlock).toContain('box-shadow: var(--shadow-sm)');
    });

    it('styles the number badge as a 38px gradient tile in brand font', () => {
      const numBlock = cssContent.match(/\.stepNumber\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(numBlock).toContain('width: 38px');
      expect(numBlock).toContain('height: 38px');
      expect(numBlock).toContain('border-radius: 12px');
      expect(numBlock).toContain('background: var(--gradient-primary)');
      expect(numBlock).toContain('color: #fff');
      expect(numBlock).toContain('display: flex');
      expect(numBlock).toContain('justify-content: center');
      expect(numBlock).toContain('font-weight: 700');
      expect(numBlock).toContain('font-size: 14px');
      expect(numBlock).toContain('font-family: var(--font-brand)');
    });

    it('pushes the title 16px down and the description 6px down in muted text', () => {
      const titleBlock = cssContent.match(/\.step h4\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(titleBlock).toContain('margin-top: 16px');
      const descBlock = cssContent.match(/\.step p\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(descBlock).toContain('margin-top: 6px');
      expect(descBlock).toContain('color: var(--color-text-muted)');
    });

    it('renders the step title in brand typography at 17px', () => {
      const titleBlock = cssContent.match(/\.step h4\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(titleBlock).toContain('font-family: var(--font-brand)');
      expect(titleBlock).toContain('font-size: 17px');
      expect(titleBlock).toContain('font-weight: 600');
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--gradient-primary',
      '--shadow-sm',
      '--radius-md',
      '--font-brand',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
