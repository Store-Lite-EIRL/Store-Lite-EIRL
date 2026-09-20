'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import styles from './ThemeToggle.module.css';

/**
 * Fixed top-right theme toggle for /auth.
 * Delegates to the global ThemeContext so the flip persists app-wide
 * (design D4). The icon shows the mode the user switches *to*.
 */
export default function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label="Cambiar tema"
      onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        {effectiveTheme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
