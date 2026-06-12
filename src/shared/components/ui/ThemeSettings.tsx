'use client';

import { useTheme, type ColorScheme } from '@/shared/context/ThemeContext';
import type { MaterialSelectEvent } from '@/shared/utils';
import { Icon } from './data-display';
import { Select, SelectOption } from './inputs';
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
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();

  const currentMode: ThemeMode =
    theme === 'system' ? 'system' : theme === 'dark' ? 'dark' : 'light';

  const handleModeChange = (mode: ThemeMode) => {
    if (mode === 'system') {
      setTheme('system');
    } else {
      // Si venía de system, fuerza al modo elegido
      setTheme(mode);
    }
  };

  return (
    <div className={styles.panel}>
      {/* ── Modo del panel ── */}
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

      {/* ── Accesibilidad Visual ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Accesibilidad visual</h3>

        <div className={styles.contrastRow}>
          <div className={styles.contrastIcon}>
            <Icon size={18}>contrast</Icon>
          </div>
          <div className={styles.contrastInfo}>
            <p className={styles.contrastLabel}>Nivel de contraste</p>
            <p className={styles.contrastDescription}>
              Ajustá la intensidad visual para mejorar la legibilidad de bordes y textos.
            </p>
          </div>
        </div>

        <div className={styles.selectWrapper}>
          <Select
            value={colorScheme}
            onChange={(e: MaterialSelectEvent) => {
              const value = (e.target.value ?? e.detail?.value ?? '') as ColorScheme;
              if (value) setColorScheme(value);
            }}
          >
            <SelectOption value="default">Estándar (Recomendado)</SelectOption>
            <SelectOption value="medium">Medio (Alta legibilidad)</SelectOption>
            <SelectOption value="high">Alto (Máxima accesibilidad)</SelectOption>
          </Select>
        </div>
      </section>
    </div>
  );
}
