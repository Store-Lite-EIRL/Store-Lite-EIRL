import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ajustes | Store Lite',
  description: 'Configuración de la aplicación',
};

export default function SettingsPage() {
  return (
    <div>
      <h1
        style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--md-sys-color-on-surface)' }}
      >
        Ajustes
      </h1>
      <div style={{ marginTop: '2rem' }}>
        <ThemeSettings />
      </div>
    </div>
  );
}
