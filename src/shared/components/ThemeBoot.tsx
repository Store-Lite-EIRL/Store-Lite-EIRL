'use client';

import { useEffect } from 'react';

export function ThemeBoot() {
  useEffect(() => {
    try {
      const classes = [
        'light',
        'light-medium-contrast',
        'light-high-contrast',
        'dark',
        'dark-medium-contrast',
        'dark-high-contrast',
      ];

      const storedTheme = localStorage.getItem('app-theme') || 'system';
      const storedScheme = localStorage.getItem('app-color-scheme') || 'default';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolvedTheme =
        storedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : storedTheme;
      const suffix =
        storedScheme === 'medium'
          ? '-medium-contrast'
          : storedScheme === 'high'
            ? '-high-contrast'
            : '';
      const nextClass = resolvedTheme + suffix;

      document.body.classList.remove(...classes);
      document.body.classList.add(nextClass);
      document.documentElement.style.colorScheme = resolvedTheme;
    } catch (error) {
      console.warn('Theme boot script failed', error);
    }
  }, []);

  return null;
}
