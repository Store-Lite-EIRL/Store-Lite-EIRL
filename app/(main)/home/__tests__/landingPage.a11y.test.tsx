import { ThemeProvider } from '@/shared/context/ThemeContext';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../../../page';

/**
 * T-041 — Accessibility audit on the assembled landing page.
 *
 * Covers:
 * - :focus-visible styles for every module that renders interactive elements
 * - theme toggle aria-label / aria-pressed
 * - nav links are real <a> anchors with hash hrefs
 * - pricing toggle buttons expose aria-pressed
 * - FAQ uses native <details>/<summary> semantics
 * - StoreLogo image carries alt text
 * - WCAG AA contrast for the real token pairs used in the landing
 *   (token names mapped to this project's conventions: --on-background →
 *   --color-text/--color-bg, --on-primary → #fff on --color-primary)
 * - prefers-reduced-motion guard in every module that animates
 */

// ── Mocks ────────────────────────────────────────────

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: null, session: null, loading: false }),
}));

class MockIntersectionObserver {
  callback: (entries: IntersectionObserverEntry[]) => void;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  root = null;
  rootMargin = '';
  thresholds: number[] = [];

  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.callback = callback;
  }
}

vi.stubGlobal('IntersectionObserver', class extends MockIntersectionObserver {});

const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia, writable: true });
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

function renderHome() {
  return render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>,
  );
}

// ── CSS / tokens reading ──

const moduleDir = dirname(fileURLToPath(import.meta.url));
const homeDir = join(moduleDir, '..');
const readModule = (name: string) => readFileSync(join(homeDir, `${name}.module.css`), 'utf-8');
// Normalize CRLF (Windows) so selector blocks match regardless of line endings.
const tokensCss = readFileSync(join(homeDir, 'tokens.css'), 'utf-8').replace(/\r\n/g, '\n');

// Modules that render interactive elements must expose keyboard focus styles.
const INTERACTIVE_MODULES = [
  'FloatingNav',
  'HeroSection',
  'PricingSection',
  'ContactSection',
  'FaqSection',
  'FooterSection',
  'CtaBanner',
] as const;

// Modules that animate (transition/animation) must respect reduced motion.
const MOTION_MODULES = [
  'FloatingNav',
  'HeroSection',
  'SolutionsSection',
  'PricingSection',
  'ContactSection',
  'FaqSection',
  'FooterSection',
  'CtaBanner',
] as const;

// ── WCAG contrast helpers (pure functions) ──

function parseRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function toLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = parseRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractTokenBlock(selector: string): string {
  const match = tokensCss.match(
    new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`),
  );
  if (!match) {
    throw new Error(`Token block not found: ${selector}`);
  }
  return match[1];
}

function tokenValue(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`Token not found: --${name}`);
  }
  return match[1].trim();
}

const lightTokens = extractTokenBlock(":root,\nhtml[data-theme='light']");
const darkTokens = extractTokenBlock("html[data-theme='dark']");

// Pairs actually used on the landing (project token conventions):
// - body copy:   --color-text / --color-bg
// - muted copy:  --color-text-muted / --color-bg
// - on-primary:  #fff over --color-primary (buttons/chips use white on primary)
const CONTRAST_PAIRS = [
  {
    label: 'light body text on background',
    fg: tokenValue(lightTokens, 'color-text'),
    bg: tokenValue(lightTokens, 'color-bg'),
  },
  {
    label: 'dark body text on background',
    fg: tokenValue(darkTokens, 'color-text'),
    bg: tokenValue(darkTokens, 'color-bg'),
  },
  {
    label: 'light muted text on background',
    fg: tokenValue(lightTokens, 'color-text-muted'),
    bg: tokenValue(lightTokens, 'color-bg'),
  },
  {
    label: 'dark muted text on background',
    fg: tokenValue(darkTokens, 'color-text-muted'),
    bg: tokenValue(darkTokens, 'color-bg'),
  },
  {
    label: 'light white on primary',
    fg: '#ffffff',
    bg: tokenValue(lightTokens, 'color-primary'),
  },
  {
    label: 'dark white on primary',
    fg: '#ffffff',
    bg: tokenValue(darkTokens, 'color-primary'),
  },
] as const;

// ── Tests ────────────────────────────────────────────

describe('T-041 — accessibility audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    document.documentElement.removeAttribute('data-theme');
  });

  describe('keyboard focus visibility', () => {
    it.each(INTERACTIVE_MODULES)(
      '%s defines :focus-visible styles for its interactive elements',
      (moduleName) => {
        expect(readModule(moduleName)).toContain(':focus-visible');
      },
    );
  });

  describe('reduced motion', () => {
    it.each(MOTION_MODULES)('%s guards animations with prefers-reduced-motion', (moduleName) => {
      expect(readModule(moduleName)).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    });
  });

  describe('semantic structure on the assembled page', () => {
    it('exposes the theme toggle with an aria-label and aria-pressed', () => {
      renderHome();
      const toggle = screen.getByRole('button', { name: /Cambiar a tema (claro|oscuro)/ });
      expect(toggle).toHaveAttribute('aria-label');
      expect(toggle).toHaveAttribute('aria-pressed');
    });

    it('renders nav section links as <a> anchors with hash hrefs', () => {
      renderHome();
      const nav = screen.getByRole('navigation');
      const sectionLinks = within(nav)
        .getAllByRole('link')
        .filter((link) => (link.getAttribute('href') ?? '').startsWith('#'));
      expect(sectionLinks).toHaveLength(5);
      for (const link of sectionLinks) {
        expect(link.tagName.toLowerCase()).toBe('a');
        expect(link.getAttribute('href')).toMatch(/^#/);
      }
    });

    it('marks the pricing billing toggle buttons with aria-pressed', () => {
      renderHome();
      const group = screen.getByRole('group', { name: 'Período de facturación' });
      const buttons = within(group).getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');

      act(() => {
        fireEvent.click(buttons[1]);
      });
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    });

    it('uses native <details>/<summary> semantics for every FAQ item', () => {
      const { container } = renderHome();
      const faqSection = Array.from(container.querySelectorAll('section')).find((section) =>
        (section.textContent ?? '').includes('Preguntas frecuentes'),
      );
      expect(faqSection).toBeDefined();

      const details = faqSection!.querySelectorAll('details');
      expect(details.length).toBeGreaterThanOrEqual(6);
      for (const detail of details) {
        expect(detail.querySelector('summary')).not.toBeNull();
      }
    });

    it('renders the StoreLogo image with alt text', () => {
      renderHome();
      const footer = screen.getByRole('contentinfo');
      const logo = within(footer).getByRole('img', { name: 'Store Lite' });
      expect(logo).toHaveAttribute('alt', 'Store Lite');
    });
  });

  describe('WCAG AA color contrast from real tokens', () => {
    it.each(CONTRAST_PAIRS)('$label ($fg on $bg) meets 4.5:1', ({ fg, bg }) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
