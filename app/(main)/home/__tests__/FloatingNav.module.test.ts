import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../FloatingNav.module.css'), 'utf-8');

describe('FloatingNav.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  it('defines nav container with sticky positioning and tokens', () => {
    expect(cssContent).toContain('position: sticky');
    expect(cssContent).toContain('top: 14px');
    expect(cssContent).toContain('z-index: 50');
    expect(cssContent).toContain('var(--radius-full)');
    expect(cssContent).toContain('backdrop-filter: blur(14px)');
    expect(cssContent).toContain('var(--shadow-md)');
  });

  it('defines light/dark background via tokens', () => {
    expect(cssContent).toContain('var(--color-surface)');
    expect(cssContent).toContain("[data-theme='light']");
    expect(cssContent).toContain("[data-theme='dark']");
  });

  it('defines logo styles with brand font and gradient background', () => {
    expect(cssContent).toContain('.logoMark');
    expect(cssContent).toContain('.logoText');
    expect(cssContent).toContain('var(--font-brand)');
    expect(cssContent).toContain('var(--gradient-primary)');
  });

  it('defines nav links with pill padding and hover states', () => {
    expect(cssContent).toContain('.navLink');
    expect(cssContent).toContain('padding: 9px 16px');
    expect(cssContent).toContain('var(--radius-full)');
    expect(cssContent).toContain('.navLinkActive');
    expect(cssContent).toContain('var(--color-primary)');
    expect(cssContent).toContain('var(--glow-purple)');
  });

  it('positions nav links relatively so the active glow layer anchors correctly', () => {
    const navLinkBlock = cssContent.match(/\.navLink\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(navLinkBlock).toContain('position: relative');
  });

  it('reinforces the nav shadow after the page is scrolled', () => {
    expect(cssContent).toContain('.navScrolled');
    expect(cssContent).toContain('var(--shadow-lg)');
  });

  it('hides the mobile menu toggle by default and switches to inline-grid in the breakpoint', () => {
    const toggleBlock = cssContent.match(/\.mobileMenuToggle\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(toggleBlock).toContain('display: none');
    expect(toggleBlock).toContain('place-items: center');
    expect(cssContent).toContain('display: inline-grid');
  });

  it('defines actions area with theme toggle and buttons', () => {
    expect(cssContent).toContain('.actions');
    expect(cssContent).toContain('.themeToggle');
    expect(cssContent).toContain('.btnOutline');
    expect(cssContent).toContain('.btnPrimary');
  });

  it('includes responsive breakpoints for <900px, <767px, <480px and <380px', () => {
    expect(cssContent).toContain('max-width: 900px');
    expect(cssContent).toContain('max-width: 767px');
    expect(cssContent).toContain('max-width: 480px');
    expect(cssContent).toContain('max-width: 380px');
  });

  it('hides the login outline button below tablet width', () => {
    const match = cssContent.match(/@media \(max-width: 767px\)\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(match).toContain('.btnOutline');
    expect(match).toContain('display: none');
  });

  it('includes focus-visible styles with primary token', () => {
    expect(cssContent).toContain('focus-visible');
    expect(cssContent).toContain('var(--color-primary)');
  });

  it('includes reduced motion media query', () => {
    expect(cssContent).toContain('prefers-reduced-motion');
  });

  it('uses all required tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--shadow-md',
      '--radius-full',
      '--color-primary',
      '--color-text',
      '--color-text-muted',
      '--font-brand',
      '--color-border',
      '--gradient-primary',
      '--glow-purple',
      '--color-bg',
      '--shadow-glow',
      '--radius-m',
      '--radius-l',
      '--max-width',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
