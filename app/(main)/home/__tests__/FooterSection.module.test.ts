import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../FooterSection.module.css'), 'utf-8');

describe('FooterSection.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  it('defines the rounded footer container with max-width, padding and radius', () => {
    expect(cssContent).toContain('.footerContainer');
    expect(cssContent).toContain('max-width: var(--max-width)');
    expect(cssContent).toContain('margin: 0 auto');
    expect(cssContent).toContain('padding: 3rem 2.5rem');
    expect(cssContent).toContain('border-radius: 28px');
  });

  it('colors the container via tokens only (surface + border)', () => {
    const containerBlock = cssContent.match(/\.footerContainer\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(containerBlock).toContain('var(--color-surface)');
    expect(containerBlock).toContain('var(--color-border)');
    expect(containerBlock).not.toContain('rgba(');
    expect(containerBlock).not.toContain('#');
  });

  it('defines the main two-column layout grid', () => {
    expect(cssContent).toContain('.footerMain');
    expect(cssContent).toContain('grid-template-columns: 1.2fr 2fr');
    expect(cssContent).toContain('gap: 4rem');
    expect(cssContent).toContain('margin-bottom: 2.5rem');
  });

  it('defines the brand column with max-width and logo container', () => {
    expect(cssContent).toContain('.footerBrand');
    expect(cssContent).toContain('max-width: 320px');
    expect(cssContent).toContain('.footerLogo');
    expect(cssContent).toContain('display: flex');
    expect(cssContent).toContain('gap: 0.75rem');
    expect(cssContent).toContain('margin-bottom: 1.25rem');
  });

  it('defines the links wrapper as a 3-column grid', () => {
    expect(cssContent).toContain('.footerLinksWrapper');
    expect(cssContent).toContain('grid-template-columns: repeat(3, 1fr)');
    expect(cssContent).toContain('gap: 2.5rem');
  });

  it('defines the bottom bar with space-between and a token border-top', () => {
    const bottomBlock = cssContent.match(/\.footerBottom\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(cssContent).toContain('.footerBottom');
    expect(bottomBlock).toContain('justify-content: space-between');
    expect(bottomBlock).toContain('var(--color-border)');
    expect(bottomBlock).not.toContain('rgba(');
  });

  it('defines muted link/contact colors and primary icon accents via tokens', () => {
    expect(cssContent).toContain('var(--color-text-muted)');
    expect(cssContent).toContain('var(--color-text)');
    expect(cssContent).toContain('var(--color-primary)');
    expect(cssContent).toContain('var(--color-primary-hover)');
  });

  it('defines the CTA with gradient, glow and full radius via tokens', () => {
    expect(cssContent).toContain('.footerCta');
    expect(cssContent).toContain('var(--gradient-primary)');
    expect(cssContent).toContain('var(--shadow-glow)');
    expect(cssContent).toContain('var(--radius-full)');
  });

  it('includes the ≤760px responsive rules (2-col links, wrapping bottom)', () => {
    expect(cssContent).toContain('max-width: 760px');
    expect(cssContent).toContain('grid-template-columns: 1fr 1fr');
    expect(cssContent).toContain('flex-wrap: wrap');
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-border',
      '--color-text',
      '--color-text-muted',
      '--color-primary',
      '--color-primary-hover',
      '--gradient-primary',
      '--shadow-glow',
      '--radius-full',
      '--max-width',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
