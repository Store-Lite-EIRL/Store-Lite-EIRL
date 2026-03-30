'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import { Icon } from './data-display';

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
            <Icon slot="icon" size={21}>
              light_mode
            </Icon>
          </md-filter-chip>
          <md-filter-chip
            label="Oscuro"
            selected={theme === 'dark'}
            onClick={() => setTheme('dark')}
            suppressHydrationWarning
          >
            <Icon slot="icon" size={21}>
              dark_mode
            </Icon>
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
