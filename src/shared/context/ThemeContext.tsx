'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'medium' | 'high';

interface ThemeContextProps {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Default to system
  const [theme, setThemeState] = useState<Theme>('system');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('default');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('app-theme') as Theme;
      const storedScheme = localStorage.getItem('app-color-scheme') as ColorScheme;

      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme);
      }

      if (storedScheme && ['default', 'medium', 'high'].includes(storedScheme)) {
        setColorSchemeState(storedScheme);
      }
    } catch (e) {
      console.warn('Failed to load theme settings from localStorage', e);
    }
    setMounted(true);
  }, []);

  // Update localStorage and document body
  useEffect(() => {
    if (!mounted) {
      return;
    }

    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-color-scheme', colorScheme);

    // Helper to apply theme
    const applyTheme = (currentTheme: 'light' | 'dark') => {
      // Remove all previous theme classes
      document.body.classList.remove(
        'light',
        'light-medium-contrast',
        'light-high-contrast',
        'dark',
        'dark-medium-contrast',
        'dark-high-contrast',
      );

      // Determine new class name
      let className = '';

      if (currentTheme === 'light') {
        if (colorScheme === 'default') {
          className = 'light';
        } else if (colorScheme === 'medium') {
          className = 'light-medium-contrast';
        } else if (colorScheme === 'high') {
          className = 'light-high-contrast';
        }
      } else {
        if (colorScheme === 'default') {
          className = 'dark';
        } else if (colorScheme === 'medium') {
          className = 'dark-medium-contrast';
        } else if (colorScheme === 'high') {
          className = 'dark-high-contrast';
        }
      }

      if (className) {
        document.body.classList.add(className);
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      handleSystemThemeChange(mediaQuery);
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      applyTheme(theme);
    }
  }, [theme, colorScheme, mounted]);

  // Prevent flash of incorrect theme by rendering nothing until mounted (optional, but good for heavy changes)
  // Or just render children and let the effect update the class.
  // For 'use client' in nextjs, 'mounted' check is good for hydration mismatch avoidance if we rendered class on server.
  // But here we manipulate DOM in effect.

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setTheme: setThemeState,
        setColorScheme: setColorSchemeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
