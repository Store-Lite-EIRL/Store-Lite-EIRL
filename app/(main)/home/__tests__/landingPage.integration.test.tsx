import { ThemeProvider } from '@/shared/context/ThemeContext';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../../../page';

/**
 * T-040 — Full-page integration test.
 * Renders the real `HomePage` from app/page.tsx with ThemeProvider and the
 * session-redirect mocks, then proves:
 * - section order matches the mockup (nav → hero → solutions → CTA banner →
 *   stats → process → pricing → trust → contact → faq → footer)
 * - CTA banner sits between Solutions and Stats
 * - theme toggle drives html[data-theme]
 * - scroll-spy responds to IntersectionObserver on the assembled page
 * - no legacy global landing classes leak into the rendered DOM
 * - section CSS modules carry the responsive breakpoints
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

  simulateIntersection(entries: IntersectionObserverEntry[]) {
    this.callback(entries);
  }
}

let observerInstance: MockIntersectionObserver;

const observerFactory = function observerFactory(
  callback: (entries: IntersectionObserverEntry[]) => void,
): MockIntersectionObserver {
  const instance = new MockIntersectionObserver(callback);
  observerInstance = instance;
  return instance;
};

vi.stubGlobal('IntersectionObserver', observerFactory);

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

// ── CSS module reads (responsive assertions) ──

const moduleDir = dirname(fileURLToPath(import.meta.url));
const homeDir = join(moduleDir, '..');
const readModule = (name: string) => readFileSync(join(homeDir, `${name}.module.css`), 'utf-8');

// ── Helpers ──

function renderHome() {
  return render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>,
  );
}

function sectionIndexByText(sections: Element[], text: string): number {
  return sections.findIndex((section) => (section.textContent ?? '').includes(text));
}

describe('T-040 — landing page integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders every section in the mockup order with its scroll-spy id', () => {
    const { container } = renderHome();

    const sectionIds = Array.from(container.querySelectorAll('section[id]')).map((s) => s.id);
    expect(sectionIds).toEqual(['inicio', 'soluciones', 'procesos', 'pricing', 'contacto']);

    const footer = container.querySelector('footer#footer');
    expect(footer).not.toBeNull();

    // Headline of the hero proves the new HeroSection replaced HeroLanding.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tu vitrina digital, lista para vender desde el día uno',
      }),
    ).toBeInTheDocument();
  });

  it('places the "Tu tienda lista para vender" CTA banner between Solutions and Stats', () => {
    const { container } = renderHome();
    const sections = Array.from(container.querySelectorAll('section'));
    const bannerText = 'Tu tienda lista para vender, sin esperar';

    const bannerIndex = sectionIndexByText(sections, bannerText);
    expect(bannerIndex).toBeGreaterThan(sectionIndexByText(sections, 'Deja de complicarte'));
    expect(bannerIndex).toBeLessThan(sectionIndexByText(sections, 'Lo que va generando'));

    const bannerSection = sections[bannerIndex];
    const bannerLink = bannerSection.querySelector('a[href="/auth"]');
    expect(bannerLink).not.toBeNull();
    expect(bannerLink?.textContent).toContain('Crear mi tienda gratis');
  });

  it('renders the conversion sections: pricing, trust, contact card and FAQ', () => {
    renderHome();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Encuentra el plan que hace crecer tu negocio',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Confía tranquilo' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: '¿Tienes dudas antes de empezar?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Preguntas frecuentes' }),
    ).toBeInTheDocument();
  });

  it('toggles the theme on the full page and persists via html[data-theme]', async () => {
    renderHome();

    // Initial resolve: stored theme = null + mock matchMedia dark=true → system → 'dark'.
    // Label flips accordingly: effective dark → "Cambiar a tema claro".
    const toggle = screen.getByRole('button', { name: /Cambiar a tema/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await act(async () => {
      fireEvent.click(toggle);
    });

    // effective dark → toggle sets theme 'light'
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'light');
    expect(screen.getByRole('button', { name: /Cambiar a tema/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('updates the scroll-spy active section when IntersectionObserver fires', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');

    act(() => {
      observerInstance!.simulateIntersection([
        {
          target: { id: 'pricing' },
          isIntersecting: true,
          intersectionRatio: 1,
        } as IntersectionObserverEntry,
      ]);
    });

    expect(screen.getByRole('link', { name: 'Planes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('renders no legacy global landing classes in the DOM (all CSS Modules)', () => {
    const { container } = renderHome();
    const html = container.innerHTML;

    expect(html).not.toContain('landing-page-root');
    expect(html).not.toContain('hero-proof');
    expect(html).not.toContain('spotlight');
    expect(html).not.toContain('landing-hero');
    expect(html).not.toContain('glow-');
  });

  it('keeps the pricing scroll-spy target available for nav links that anchor to it', () => {
    renderHome();
    const pricingSection = document.getElementById('pricing');
    expect(pricingSection).not.toBeNull();
    const nav = screen.getByRole('navigation');
    const planesLink = within(nav).getByRole('link', { name: 'Planes' });
    expect(planesLink.getAttribute('href')).toBe('#pricing');
  });

  it('every FloatingNav link target resolves to an existing landing anchor (T-044)', () => {
    const { container } = renderHome();
    const nav = screen.getByRole('navigation');
    const targets = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => href !== null && href.startsWith('#'));
    // Non-empty guard so the loop below really executes (no ghost loop).
    expect(targets).toHaveLength(5);
    for (const target of targets) {
      // '#proceso' (stale singular) would fail here: ProcessSection renders id="procesos".
      expect(container.querySelector(target)).not.toBeNull();
    }
  });

  it('the scroll-spy observes the corrected procesos id and activates the Proceso link (T-044)', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Proceso' })).not.toHaveAttribute('aria-current');

    act(() => {
      observerInstance!.simulateIntersection([
        {
          target: { id: 'procesos' },
          isIntersecting: true,
          intersectionRatio: 1,
        } as IntersectionObserverEntry,
      ]);
    });

    expect(screen.getByRole('link', { name: 'Proceso' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  describe('responsive breakpoints exist per section module', () => {
    const responsiveModules: readonly [string, RegExp][] = [
      ['FloatingNav', /@media\s*\(max-width: 900px\)/],
      ['HeroSection', /@media\s*\(min-width: 1024px\)/],
      ['SolutionsSection', /@media\s*\(max-width: 640px\)/],
      ['StatsSection', /@media\s*\(max-width: 760px\)/],
      ['ProcessSection', /@media\s*\(max-width: 600px\)/],
      ['PricingSection', /@media\s*\(max-width: 760px\)/],
      ['TrustSection', /@media\s*\(max-width: 560px\)/],
      ['ContactSection', /@media\s*\(min-width: 1024px\)/],
      ['FaqSection', /@media\s*\(min-width: 1024px\)/],
      ['FooterSection', /@media\s*\(max-width: 760px\)/],
    ];

    it.each(responsiveModules)('%s defines its responsive breakpoint', (moduleName, pattern) => {
      expect(readModule(moduleName)).toMatch(pattern);
    });
  });
});
