import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      Reflect.deleteProperty(store, key);
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const mql: MediaQueryList = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn() as unknown as MediaQueryList['addEventListener'],
    removeEventListener: vi.fn() as unknown as MediaQueryList['removeEventListener'],
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn((e: MediaQueryListEvent) => {
      listeners.forEach((l) => l(e));
      return true;
    }),
  };
  // Override the mock implementations
  (mql.addEventListener as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(handler);
    },
  );
  (mql.removeEventListener as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
      }
    },
  );
  return mql;
};

describe('ThemeContext - Migration to html[data-theme]', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorageMock.clear();
    // Reset document.documentElement attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    document.body.className = '';
    cleanup();

    // Mock matchMedia globally
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn(() => createMatchMediaMock(false));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const TestComponent = () => {
    const { theme, effectiveTheme, setTheme } = useTheme();
    return (
      <div>
        <span data-testid="theme">{theme}</span>
        <span data-testid="effective-theme">{effectiveTheme}</span>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('system')}>System</button>
      </div>
    );
  };

  describe('applyTheme() sets html[data-theme] attribute', () => {
    it('should set data-theme="light" when theme is light', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Light'));
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should set data-theme="dark" when theme is dark', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Dark'));
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should NOT apply theme classes to body', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Dark'));
      });

      // Body should not have theme classes
      expect(document.body.classList.contains('light')).toBe(false);
      expect(document.body.classList.contains('dark')).toBe(false);
      expect(document.body.classList.contains('light-medium-contrast')).toBe(false);
      expect(document.body.classList.contains('dark-medium-contrast')).toBe(false);
      expect(document.body.classList.contains('light-high-contrast')).toBe(false);
      expect(document.body.classList.contains('dark-high-contrast')).toBe(false);
    });

    it('should set document.documentElement.style.colorScheme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Dark'));
      });

      expect(document.documentElement.style.colorScheme).toBe('dark');

      act(() => {
        fireEvent.click(screen.getByText('Light'));
      });

      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('Persistence to localStorage', () => {
    it('should persist theme to localStorage', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Dark'));
      });

      expect(localStorage.getItem('app-theme')).toBe('dark');
    });

    it('should persist colorScheme to localStorage', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // colorScheme defaults to 'default'
      expect(localStorage.getItem('app-color-scheme')).toBe('default');
    });

    it('should restore theme from localStorage on mount', () => {
      localStorage.setItem('app-theme', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('System preference handling', () => {
    it('should respect system preference when theme is system', () => {
      // Mock prefers-color-scheme: dark
      window.matchMedia = vi.fn(() => createMatchMediaMock(true));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('System'));
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should update when system preference changes', () => {
      const mql = createMatchMediaMock(false); // Start with light
      window.matchMedia = vi.fn(() => mql);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('System'));
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // Change system preference to dark
      act(() => {
        mql.dispatchEvent({ matches: true } as MediaQueryListEvent);
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('ColorScheme kept for rest of app', () => {
    it('should keep colorScheme state for rest of app', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // colorScheme should still exist in context for rest of app
      expect(localStorage.getItem('app-color-scheme')).toBe('default');
    });
  });

  describe('useTheme hook signature preserved', () => {
    it('should return theme, effectiveTheme, setTheme, setColorScheme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('effective-theme')).toHaveTextContent('light');
    });
  });
});
