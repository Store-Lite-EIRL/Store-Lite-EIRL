import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../FaqSection.module.css'), 'utf-8');

describe('FAQSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  describe('section head', () => {
    it('offsets the section head 64px and styles the eyebrow icon as a gradient tile', () => {
      const headBlock = cssContent.match(/\.sectionHead\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(headBlock).toContain('margin-top: 64px');
      const iconBlock = cssContent.match(/\.eyebrowIcon\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(iconBlock).toContain('width: 46px');
      expect(iconBlock).toContain('height: 46px');
      expect(iconBlock).toContain('background: var(--gradient-primary)');
      expect(iconBlock).toContain('box-shadow: var(--shadow-glow)');
    });
  });

  describe('faq list', () => {
    it('lets the faq list use the full wrap width with 32px top margin', () => {
      const faqBlock = cssContent.match(/\.faq\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(faqBlock).toContain('max-width: 100%');
      expect(faqBlock).toContain('margin-top: 32px');
    });
  });

  describe('details item', () => {
    it('styles each details as a surface tile with soft shadow and 12px spacing', () => {
      const detailsBlock = cssContent.match(/\.faq details\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(detailsBlock).toContain('background: var(--color-surface)');
      expect(detailsBlock).toContain('border-radius: var(--radius-m)');
      expect(detailsBlock).toContain('padding: 20px 22px');
      expect(detailsBlock).toContain('box-shadow: var(--shadow-sm)');
      expect(detailsBlock).toContain('margin-bottom: 12px');
    });

    it('styles the summary as a flex row with 600 weight and pointer cursor', () => {
      const summaryBlock = cssContent.match(/\.faq summary\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(summaryBlock).toContain('list-style: none');
      expect(summaryBlock).toContain('display: flex');
      expect(summaryBlock).toContain('justify-content: space-between');
      expect(summaryBlock).toContain('align-items: center');
      expect(summaryBlock).toContain('font-weight: 600');
      expect(summaryBlock).toContain('font-size: 15.5px');
      expect(summaryBlock).toContain('cursor: pointer');
    });

    it('hides the native details marker', () => {
      expect(cssContent).toContain('summary::-webkit-details-marker');
      expect(cssContent).toMatch(/summary::-webkit-details-marker\s*\{[^}]*display: none/);
    });

    it('colors the add icon primary with a smooth transform transition', () => {
      expect(cssContent).toMatch(
        /\.faq summary :global\(\.material-symbols-rounded\)\s*\{[^}]*color: var\(--color-primary\)/,
      );
      expect(cssContent).toMatch(
        /\.faq summary :global\(\.material-symbols-rounded\)\s*\{[^}]*transition: transform 0\.15s ease/,
      );
    });

    it('rotates the icon 45deg when the details is open', () => {
      expect(cssContent).toMatch(
        /\.faq details\[open\] summary :global\(\.material-symbols-rounded\)\s*\{[^}]*transform: rotate\(45deg\)/,
      );
    });

    it('styles the answer 12px below the summary with 60ch max width', () => {
      expect(cssContent).toMatch(/\.faq details p\s*\{[^}]*margin-top: 12px/);
      expect(cssContent).toMatch(/\.faq details p\s*\{[^}]*max-width: 60ch/);
      expect(cssContent).toMatch(/\.faq details p\s*\{[^}]*color: var\(--color-text-muted\)/);
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--color-primary',
      '--gradient-primary',
      '--shadow-sm',
      '--shadow-glow',
      '--radius-m',
      '--font-brand',
      '--font-plain',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
