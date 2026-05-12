'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import { Icon } from './data-display';
import { Select, SelectOption, Switch } from './inputs';

export function ThemeSettings() {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();

  return (
    <div
      className="theme-settings-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* SECCIÓN DE TEMA */}
      <section
        className="section"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <h3
          className="theme-settings-header"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface-variant)',
            margin: 0,
          }}
        >
          Modo y Apariencia
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '16px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            overflow: 'hidden',
          }}
        >
          {/* Opción Auto */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20}>brightness_auto</Icon>
              </div>
              <div style={{ paddingRight: '12px' }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  Tema automático
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Sincronizar con el sistema.
                </p>
              </div>
            </div>
            <Switch
              selected={theme === 'system'}
              onInput={(e) => {
                const target = e.target as HTMLElement & { selected: boolean };
                if (target.selected) {
                  setTheme('system');
                } else {
                  // Fallback a claro si el usuario desactiva el automático y no está forzado en oscuro
                  const isSystemDark =
                    typeof window !== 'undefined' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                  setTheme(isSystemDark ? 'dark' : 'light');
                }
              }}
            />
          </div>

          {/* Opción Oscuro Forzado */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              opacity: theme === 'system' ? 0.6 : 1,
              pointerEvents: theme === 'system' ? 'none' : 'auto',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent)',
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20}>dark_mode</Icon>
              </div>
              <div style={{ paddingRight: '12px' }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  Forzar modo oscuro
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Activar la apariencia oscura manualmente.
                </p>
              </div>
            </div>
            <Switch
              selected={theme === 'dark'}
              onInput={(e) => {
                const target = e.target as HTMLElement & { selected: boolean };
                setTheme(target.selected ? 'dark' : 'light');
              }}
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN DE CONTRASTE */}
      <section
        className="section"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <h3
          className="theme-settings-header"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface-variant)',
            margin: 0,
          }}
        >
          Accesibilidad Visual
        </h3>
        <div
          style={{
            padding: '16px 20px 24px',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '16px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--md-sys-color-tertiary-container)',
                color: 'var(--md-sys-color-on-tertiary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20}>contrast</Icon>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                Nivel de contraste
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Ajusta la intensidad visual para mejorar la legibilidad de bordes y textos.
              </p>
            </div>
          </div>
          <Select
            value={colorScheme}
            onChange={(
              e: Event & { target?: { value?: string }; currentTarget?: { value?: string } },
            ) => {
              const value = (e.target as any)?.value || (e.currentTarget as any)?.value;
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
