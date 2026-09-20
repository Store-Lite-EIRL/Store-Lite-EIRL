import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStorefrontViewerTheme } from '../../app/[slug]/(app)/components/useStorefrontViewerTheme';

const SLUG = 'mystore';
const STORE_KEY = `storefront-theme-${SLUG}`;

const localStorageMock = (() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const matchMediaMock = vi.fn((_query: string) => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock,
  writable: true,
});

function createMediaQueryList({ matches = false } = {}) {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

function SyncHarness({ slug, editorOpen = false }: { slug: string; editorOpen?: boolean }) {
  const { viewerTheme, effectiveTheme, handleViewerThemeToggle } = useStorefrontViewerTheme({
    slug,
    editorOpen,
  });
  return (
    <>
      <output
        data-testid="theme-state"
        data-viewer={viewerTheme ?? 'null'}
        data-effective={effectiveTheme}
      />
      <button type="button" onClick={handleViewerThemeToggle}>
        toggle-viewer
      </button>
    </>
  );
}

// Simulates the navbar/settings toggle that writes into the global ThemeContext.
function GlobalThemeControl() {
  const { theme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      toggle-global
    </button>
  );
}

function themeState() {
  const el = screen.getByTestId('theme-state');
  return { viewer: el.getAttribute('data-viewer'), effective: el.getAttribute('data-effective') };
}

describe('themeSyncConvergence', () => {
  beforeEach(() => {
    matchMediaMock.mockReset();
    matchMediaMock.mockReturnValue(createMediaQueryList());
  });

  afterEach(() => {
    localStorageMock.clear();
    document.body.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('settles on a single stable scheme when app-theme and storefront-theme seeds diverge', async () => {
    localStorageMock.setItem('app-theme', 'dark');
    localStorageMock.setItem(STORE_KEY, 'light');

    const { rerender } = render(
      <ThemeProvider>
        <SyncHarness slug={SLUG} />
      </ThemeProvider>,
    );

    // The mount resolution (global effective theme) converges into the viewer in
    // one step; there is no oscillation between the divergent seeds.
    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'dark', effective: 'dark' });
    });

    // Unrelated re-renders must never flip the scheme back and forth.
    for (let i = 0; i < 10; i += 1) {
      rerender(
        <ThemeProvider>
          <SyncHarness slug={SLUG} />
        </ThemeProvider>,
      );
      expect(themeState()).toEqual({ viewer: 'dark', effective: 'dark' });
    }

    // Exactly one data-theme attribute at all times (no dark+light churn).
    const dataTheme = document.documentElement.getAttribute('data-theme');
    expect(dataTheme).toBe('dark');
  });

  it('propagates an explicit viewer toggle exactly once and never reverts it', async () => {
    localStorageMock.setItem(STORE_KEY, 'light');

    const { rerender } = render(
      <ThemeProvider>
        <SyncHarness slug={SLUG} />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'light', effective: 'light' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-viewer' }));

    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'dark', effective: 'dark' });
    });

    // The toggle must not be reverted by the reverse-sync on later renders.
    for (let i = 0; i < 10; i += 1) {
      rerender(
        <ThemeProvider>
          <SyncHarness slug={SLUG} />
        </ThemeProvider>,
      );
      expect(themeState()).toEqual({ viewer: 'dark', effective: 'dark' });
    }
  });

  it('propagates a global (navbar) change to the viewer when the editor is closed', async () => {
    localStorageMock.setItem(STORE_KEY, 'light');

    render(
      <ThemeProvider>
        <SyncHarness slug={SLUG} />
        <GlobalThemeControl />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'light', effective: 'light' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-global' }));

    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'dark', effective: 'dark' });
    });
  });

  it('blocks reverse sync while the customize editor is open', async () => {
    localStorageMock.setItem(STORE_KEY, 'light');

    const { rerender } = render(
      <ThemeProvider>
        <SyncHarness slug={SLUG} />
        <GlobalThemeControl />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(themeState()).toEqual({ viewer: 'light', effective: 'light' });
    });

    rerender(
      <ThemeProvider>
        <SyncHarness slug={SLUG} editorOpen />
        <GlobalThemeControl />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle-global' }));

    // The global side updates, but the viewer must stay put while the editor is open.
    await waitFor(() => {
      expect(themeState().effective).toBe('dark');
    });
    expect(themeState().viewer).toBe('light');
  });
});
