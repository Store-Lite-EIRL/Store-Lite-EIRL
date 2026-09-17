import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(join(moduleDir, '../ProductFrame.module.css'), 'utf-8');

describe('ProductFrame.module.css — token usage and structure', () => {
  it('imports tokens.css', () => {
    expect(cssContent).toContain("@import './tokens.css';");
  });

  it('styles the frame as a rounded, shadowed surface card', () => {
    const frameBlock = cssContent.match(/\.productFrame\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(frameBlock).toContain('border-radius: var(--radius-l)');
    expect(frameBlock).toContain('background: var(--color-surface)');
    expect(frameBlock).toContain('overflow: hidden');
    expect(frameBlock).toContain('box-shadow: var(--shadow-lg)');
  });

  describe('topbar', () => {
    it('spreads title and dots with a token border below', () => {
      const topbarBlock = cssContent.match(/\.topbar\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(topbarBlock).toContain('display: flex');
      expect(topbarBlock).toContain('justify-content: space-between');
      expect(topbarBlock).toContain('padding: 14px 18px');
      expect(topbarBlock).toContain('border-bottom: 1px solid var(--color-border)');
    });

    it('renders three 8px round dots in the outline color', () => {
      const dotsBlock = cssContent.match(/\.dots\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(dotsBlock).toContain('display: flex');
      expect(dotsBlock).toContain('gap: 6px');
      const dotBlock = cssContent.match(/\.dot\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(dotBlock).toContain('width: 8px');
      expect(dotBlock).toContain('height: 8px');
      expect(dotBlock).toContain('border-radius: 50%');
      expect(dotBlock).toContain('background: var(--color-border)');
    });

    it('styles the title in 13px semibold muted text', () => {
      const titleBlock = cssContent.match(/\.title\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(titleBlock).toContain('font-size: 13px');
      expect(titleBlock).toContain('font-weight: 600');
      expect(titleBlock).toContain('color: var(--color-text-muted)');
    });

    it('sizes the trailing material-symbols icon at 18px muted', () => {
      const iconBlock =
        cssContent.match(/\.topbar\s+:global\(\.material-symbols-rounded\)\s*\{([^}]*)\}/)?.[1] ??
        '';
      expect(iconBlock).toContain('font-size: 18px');
      expect(iconBlock).toContain('color: var(--color-text-muted)');
    });
  });

  describe('body layout', () => {
    it('lays the side rail next to the main area (76px + rest) with 460px min height', () => {
      const bodyBlock = cssContent.match(/\.body\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(bodyBlock).toContain('display: grid');
      expect(bodyBlock).toContain('grid-template-columns: 76px 1fr');
      expect(bodyBlock).toContain('min-height: 460px');
    });

    it('styles the side rail as a centered column on a low-surface background', () => {
      const sideBlock = cssContent.match(/\.side\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(sideBlock).toContain('background: var(--color-bg)');
      expect(sideBlock).toContain('display: flex');
      expect(sideBlock).toContain('flex-direction: column');
      expect(sideBlock).toContain('align-items: center');
      expect(sideBlock).toContain('gap: 18px');
      expect(sideBlock).toContain('padding: 20px 0');
    });

    it('renders 40px icon tiles with 12px radius in muted color and 26px icons', () => {
      const iconWrapBlock = cssContent.match(/\.iconWrap\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(iconWrapBlock).toContain('width: 40px');
      expect(iconWrapBlock).toContain('height: 40px');
      expect(iconWrapBlock).toContain('border-radius: 12px');
      expect(iconWrapBlock).toContain('color: var(--color-text-muted)');
      expect(cssContent).toMatch(
        /\.side :global\(\.material-symbols-rounded\)\s*\{[^}]*font-size: 26px/,
      );
    });

    it('highlights the active tile with gradient, white icon and glow', () => {
      const activeBlock = cssContent.match(/\.iconActive\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(activeBlock).toContain('background: var(--gradient-primary)');
      expect(activeBlock).toContain('color: #fff');
      expect(activeBlock).toContain('box-shadow: var(--shadow-glow)');
    });
  });

  describe('metric cards', () => {
    it('arranges the cards in a 3-column grid', () => {
      const cardsBlock = cssContent.match(/\.cards\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardsBlock).toContain('display: grid');
      expect(cardsBlock).toContain('grid-template-columns: repeat(3, 1fr)');
      expect(cardsBlock).toContain('gap: 12px');
    });

    it('styles each card on a low-surface background with brand-font numbers', () => {
      const cardBlock = cssContent.match(/\.card\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(cardBlock).toContain('background: var(--color-bg)');
      expect(cardBlock).toContain('border-radius: var(--radius-m)');
      expect(cardBlock).toContain('padding: 16px');

      const numberBlock = cssContent.match(/\.cardNumber\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(numberBlock).toContain('font-family: var(--font-brand)');
      expect(numberBlock).toContain('font-size: 25px');
      expect(numberBlock).toContain('font-weight: 700');

      const labelBlock = cssContent.match(/\.cardLabel\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(labelBlock).toContain('font-size: 12px');
      expect(labelBlock).toContain('color: var(--color-text-muted)');
    });
  });

  describe('chart', () => {
    it('renders a 150px flex chart with token-colored bars', () => {
      const chartBlock = cssContent.match(/\.chart\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(chartBlock).toContain('margin-top: 14px');
      expect(chartBlock).toContain('background: var(--color-bg)');
      expect(chartBlock).toContain('border-radius: var(--radius-m)');
      expect(chartBlock).toContain('display: flex');
      expect(chartBlock).toContain('align-items: flex-end');
      expect(chartBlock).toContain('gap: 8px');
      expect(chartBlock).toContain('height: 150px');
    });

    it('styles bars with rounded tops, flexible width and a gradient highlight variant', () => {
      const barBlock = cssContent.match(/\.bar\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(barBlock).toContain('flex: 1');
      expect(barBlock).toContain('background: var(--accent-blue)');
      expect(barBlock).toContain('border-radius: 6px 6px 0 0');

      const barHiBlock = cssContent.match(/\.barHi\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(barHiBlock).toContain('background: var(--gradient-primary)');
    });
  });

  describe('order list', () => {
    it('renders rows spaced with space-between and 14px/14px/16px padding at 14px text', () => {
      const rowBlock = cssContent.match(/\.row\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(rowBlock).toContain('display: flex');
      expect(rowBlock).toContain('justify-content: space-between');
      expect(rowBlock).toContain('padding: 14px 14px 16px');
      expect(rowBlock).toContain('font-size: 14px');
    });

    it('styles the status badge as a small rounded primary-container pill', () => {
      const statusBlock = cssContent.match(/\.status\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(statusBlock).toContain('font-size: 11px');
      expect(statusBlock).toContain('font-weight: 600');
      expect(statusBlock).toContain('padding: 3px 9px');
      expect(statusBlock).toContain('border-radius: var(--radius-full)');
      expect(statusBlock).toContain('background: var(--accent-blue)');
      expect(statusBlock).toContain('color: #fff');
    });
  });

  it('uses only existing design tokens', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-bg',
      '--color-border',
      '--color-text-muted',
      '--gradient-primary',
      '--shadow-lg',
      '--shadow-glow',
      '--radius-m',
      '--radius-l',
      '--radius-full',
      '--font-brand',
      '--accent-blue',
    ];
    requiredTokens.forEach((token) => {
      expect(cssContent).toContain(token);
    });
  });
});
