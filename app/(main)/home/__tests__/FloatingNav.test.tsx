import { ThemeProvider } from '@/shared/context/ThemeContext';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloatingNav from '../FloatingNav';

// Section ids must match the real DOM ids used by the landing page sections.
const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'pricing', label: 'Planes' },
  { id: 'footer', label: 'Contacto' },
] as const;

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

// --- Mocks (IntersectionObserver, matchMedia, localStorage, scrollTo) ---

class MockIntersectionObserver {
  callback: (entries: IntersectionObserverEntry[]) => void;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.callback = callback;
  }

  simulateIntersection(entries: IntersectionObserverEntry[]) {
    this.callback(entries);
  }
}

let observerInstance: MockIntersectionObserver;

// The component constructs `new IntersectionObserver(...)`; the factory returns
// a fresh MockIntersectionObserver and records it for test assertions.
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

const scrollToMock = vi.fn();
Object.defineProperty(window, 'scrollTo', { value: scrollToMock, writable: true });

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function mountSections() {
  const elements: HTMLElement[] = [];
  SECTION_IDS.forEach((id) => {
    const el = document.createElement('section');
    el.id = id;
    document.body.appendChild(el);
    elements.push(el);
  });
  return elements;
}

describe('FloatingNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    scrollToMock.mockClear();
  });

  it('renders a semantic <nav> landmark with an accessible label', () => {
    renderWithTheme(<FloatingNav />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('renders the brand as a link to the home page', () => {
    renderWithTheme(<FloatingNav />);
    const brandLink = screen.getByRole('link', { name: 'Ir al inicio de Store Lite' });
    expect(brandLink).toHaveAttribute('href', '/');
    expect(brandLink).toHaveTextContent('Store Lite');
  });

  it('renders the 5 section links as anchors with real hrefs', () => {
    renderWithTheme(<FloatingNav />);
    const links = screen.getAllByRole('link', {
      name: /Inicio|Soluciones|Proceso|Planes|Contacto/,
    });
    expect(links).toHaveLength(5);
    const expectedHrefs = new Set(SECTION_IDS.map((id) => `#${id}`));
    links.forEach((link) => {
      expect(link.tagName.toLowerCase()).toBe('a');
      expect(expectedHrefs.has(link.getAttribute('href') ?? '')).toBe(true);
    });
  });

  it('marks the active section with aria-current=page and moves it on click', async () => {
    mountSections();
    renderWithTheme(<FloatingNav />);

    const inicioLink = screen.getByRole('link', { name: 'Inicio' });
    expect(inicioLink).toHaveAttribute('aria-current', 'page');

    const solucionesLink = screen.getByRole('link', { name: 'Soluciones' });
    await act(async () => {
      fireEvent.click(solucionesLink);
    });

    expect(solucionesLink).toHaveAttribute('aria-current', 'page');
    expect(inicioLink).not.toHaveAttribute('aria-current');
  });

  it('smooth-scrolls to the section when a nav link is clicked', async () => {
    mountSections();
    renderWithTheme(<FloatingNav />);

    const solucionesLink = screen.getByRole('link', { name: 'Soluciones' });
    await act(async () => {
      fireEvent.click(solucionesLink);
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('closes the mobile menu and scrolls when a link is selected from the menu', async () => {
    mountSections();
    renderWithTheme(<FloatingNav />);

    const hamburger = screen.getByRole('button', { name: 'Abrir menú' });
    await act(async () => {
      fireEvent.click(hamburger);
    });

    const mobileProcessLink = screen.getAllByRole('link', { name: 'Proceso' })[1];
    await act(async () => {
      fireEvent.click(mobileProcessLink);
    });

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

describe('FloatingNav — theme toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('starts in light mode (per system preference mock) and toggles to dark on click', async () => {
    renderWithTheme(<FloatingNav />);
    const themeToggle = screen.getByRole('button', { name: 'Cambiar a tema oscuro' });

    await act(async () => {
      fireEvent.click(themeToggle);
    });

    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeInTheDocument();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark');
  });
});

describe('FloatingNav — mobile menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('toggles the menu and updates aria-expanded', async () => {
    renderWithTheme(<FloatingNav />);
    const hamburger = screen.getByRole('button', { name: 'Abrir menú' });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    expect(hamburger).toHaveAttribute('aria-controls', 'mobile-menu');

    await act(async () => {
      fireEvent.click(hamburger);
    });

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('closes the mobile menu when Escape is pressed', async () => {
    renderWithTheme(<FloatingNav />);
    const hamburger = screen.getByRole('button', { name: 'Abrir menú' });

    await act(async () => {
      fireEvent.click(hamburger);
    });
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('traps focus inside the nav while the mobile menu is open', async () => {
    renderWithTheme(<FloatingNav />);
    const nav = screen.getByRole('navigation');
    const hamburger = screen.getByRole('button', { name: 'Abrir menú' });

    await act(async () => {
      fireEvent.click(hamburger);
    });

    const focusable = Array.from(
      nav.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Tab forward from the last element wraps to the first
    last.focus();
    await act(async () => {
      fireEvent.keyDown(nav, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(first);

    // Shift+Tab from the first element wraps to the last
    first.focus();
    await act(async () => {
      fireEvent.keyDown(nav, { key: 'Tab', shiftKey: true });
    });
    expect(document.activeElement).toBe(last);
  });
});

describe('FloatingNav — scroll-spy (IntersectionObserver)', () => {
  it('observes every section id referenced by the nav links', () => {
    mountSections();
    renderWithTheme(<FloatingNav />);

    expect(observerInstance).toBeDefined();
    expect(observerInstance!.observe).toHaveBeenCalledTimes(SECTION_IDS.length);
    const observedIds = observerInstance!.observe.mock.calls.map((call) => call[0].id);
    expect(observedIds).toEqual(SECTION_IDS);
  });

  it('updates the active section (aria-current) when a different section intersects', () => {
    mountSections();
    renderWithTheme(<FloatingNav />);

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
});

describe('FloatingNav — auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('renders login and CTA actions pointing to /auth', () => {
    renderWithTheme(<FloatingNav />);
    const loginLinks = screen.getAllByRole('link', { name: 'Iniciar sesión' });
    const ctaLinks = screen.getAllByRole('link', { name: /Crear mi tienda/ });

    loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/auth'));
    ctaLinks.forEach((link) => expect(link).toHaveAttribute('href', '/auth'));
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the theme toggle with material symbols icon', () => {
    renderWithTheme(<FloatingNav />);
    const themeToggle = screen.getByRole('button', { name: /tema/i });
    expect(themeToggle.querySelector('md-icon')).toBeInTheDocument();
  });
});
