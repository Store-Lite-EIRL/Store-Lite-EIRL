import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../StatsSection.module.css'), 'utf-8');

describe('StatsSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('stats grid', () => {
    it('lays out 4 columns with 12px top margin and 16px gap', () => {
      const gridBlock = cssContent.match(/\.statsGrid\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(gridBlock).toContain('margin-top: 12px');
      expect(gridBlock).toContain('grid-template-columns: repeat(4, 1fr)');
      expect(gridBlock).toContain('gap: 16px');
    });

    it('collapses to 2 columns below 760px', () => {
      expect(cssContent).toMatch(
        /@media \(max-width: 760px\)\s*\{[^}]*\.statsGrid\s*\{[^}]*grid-template-columns: repeat\(2, 1fr\)/,
      );
    });
  });

  describe('stat card', () => {
    it('styles the card as a surface tile with brand-font number and muted label', () => {
      const cardBlock = cssContent.match(/\.statCard\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardBlock).toContain('background: var(--color-surface)');
      expect(cardBlock).toContain('border-radius: var(--radius-m)');
      expect(cardBlock).toContain('padding: 26px');
      expect(cardBlock).toContain('box-shadow: var(--shadow-sm)');
      const numBlock = cssContent.match(/\.statNumber\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(numBlock).toContain('font-family: var(--font-brand)');
      expect(numBlock).toContain('font-size: 34px');
      expect(numBlock).toContain('font-weight: 700');
      const labelBlock = cssContent.match(/\.statLabel\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(labelBlock).toContain('margin-top: 4px');
      expect(labelBlock).toContain('color: var(--color-text-muted)');
    });
  });

  describe('stats note', () => {
    it('styles the growth note as a muted flex row with a green trending_up icon', () => {
      const noteBlock = cssContent.match(/\.statsNote\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(noteBlock).toContain('margin-top: 20px');
      expect(noteBlock).toContain('display: flex');
      expect(noteBlock).toContain('gap: 8px');
      expect(noteBlock).toContain('color: var(--color-text-muted)');
      expect(cssContent).toMatch(
        /\.statsNote\s+:global\(\.material-symbols-rounded\)\s*\{[^}]*font-size: 18px/,
      );
      expect(cssContent).toMatch(
        /\.statsNote\s+:global\(\.material-symbols-rounded\)\s*\{[^}]*color: #2fbe7a/,
      );
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--font-brand',
      '--shadow-sm',
      '--radius-m',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
