import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../ContactSection.module.css'), 'utf-8');

describe('ContactSection.module.css — token usage and structure', () => {
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

  describe('contact card', () => {
    it('styles the card as a flex row spaced between with surface background and shadow-md', () => {
      const cardBlock = cssContent.match(/\.contactCard\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardBlock).toContain('margin-top: 40px');
      expect(cardBlock).toContain('background: var(--color-surface)');
      expect(cardBlock).toContain('border-radius: var(--radius-l)');
      expect(cardBlock).toContain('padding: 38px');
      expect(cardBlock).toContain('display: flex');
      expect(cardBlock).toContain('justify-content: space-between');
      expect(cardBlock).toContain('align-items: center');
      expect(cardBlock).toContain('gap: 24px');
      expect(cardBlock).toContain('flex-wrap: wrap');
      expect(cardBlock).toContain('box-shadow: var(--shadow-md)');
    });

    it('renders the headline in brand font with a responsive clamp', () => {
      const h3Block = cssContent.match(/\.contactCard h3\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(h3Block).toContain('font-family: var(--font-brand)');
      expect(h3Block).toContain('clamp(24px, 2.6vw, 34px)');
      expect(h3Block).toContain('font-weight: 700');
    });

    it('renders the description 8px below the headline in muted body copy', () => {
      expect(cssContent).toMatch(/\.contactCard p\s*\{[^}]*margin-top: 8px/);
      expect(cssContent).toMatch(/\.contactCard p\s*\{[^}]*color: var\(--color-text-muted\)/);
    });

    it('styles the WhatsApp button with gradient background and glow shadow', () => {
      const btnBlock = cssContent.match(/\.btnPrimary\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(btnBlock).toContain('background: var(--gradient-primary)');
      expect(btnBlock).toContain('color: #fff');
      expect(btnBlock).toContain('box-shadow: var(--shadow-glow)');
    });

    it('sizes the chat icon at 20px inside the WhatsApp button', () => {
      expect(cssContent).toMatch(
        /\.btnPrimary :global\(\.material-symbols-rounded\)\s*\{[^}]*font-size: 20px/,
      );
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-text-muted',
      '--gradient-primary',
      '--shadow-md',
      '--shadow-glow',
      '--radius-m',
      '--radius-l',
      '--font-brand',
      '--font-plain',
      '--max-width',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
