'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import { Icon } from './data-display';
import styles from './ThemeSettings.module.css';

type ThemeMode = 'system' | 'light' | 'dark';

const MODE_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: string;
}[] = [
  { value: 'system', label: 'Sistema', icon: 'brightness_auto' },
  { value: 'light', label: 'Claro', icon: 'light_mode' },
  { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const currentMode: ThemeMode =
    theme === 'system' ? 'system' : theme === 'dark' ? 'dark' : 'light';

  const handleModeChange = (mode: ThemeMode) => {
    setTheme(mode);
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Modo del panel</h3>

        <div className={styles.modeGroup}>
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.modeOption} ${currentMode === opt.value ? styles.modeOptionActive : ''}`}
              onClick={() => handleModeChange(opt.value)}
              aria-pressed={currentMode === opt.value}
            >
              <Icon size={18}>{opt.icon}</Icon>
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
