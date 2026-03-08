'use client';

import { useTheme } from '@/shared/context/ThemeContext';

export function ThemeSettings() {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();

  return (
    <div className="theme-settings-panel">
      <section className="section">
        <h3 className="theme-settings-header">Tema</h3>
        <md-chip-set suppressHydrationWarning>
          <md-filter-chip
            label="Claro"
            selected={theme === 'light'}
            onClick={() => setTheme('light')}
            suppressHydrationWarning
          >
            <md-icon slot="icon" suppressHydrationWarning>
              light_mode
            </md-icon>
          </md-filter-chip>
          <md-filter-chip
            label="Oscuro"
            selected={theme === 'dark'}
            onClick={() => setTheme('dark')}
            suppressHydrationWarning
          >
            <md-icon slot="icon" suppressHydrationWarning>
              dark_mode
            </md-icon>
          </md-filter-chip>
        </md-chip-set>
      </section>

      <section className="section">
        <h3 className="theme-settings-header">Contraste</h3>
        <md-chip-set suppressHydrationWarning>
          <md-filter-chip
            label="Estándar"
            selected={colorScheme === 'default'}
            onClick={() => setColorScheme('default')}
            suppressHydrationWarning
          />
          <md-filter-chip
            label="Medio"
            selected={colorScheme === 'medium'}
            onClick={() => setColorScheme('medium')}
            suppressHydrationWarning
          />
          <md-filter-chip
            label="Alto"
            selected={colorScheme === 'high'}
            onClick={() => setColorScheme('high')}
            suppressHydrationWarning
          />
        </md-chip-set>
      </section>
    </div>
  );
}
