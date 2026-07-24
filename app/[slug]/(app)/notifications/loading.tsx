import { Loader2 } from 'lucide-react';

export default function NotificationsLoading() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
      }}
    >
      <Loader2
        size={48}
        className="animate-spin"
        style={{ color: 'var(--md-sys-color-primary)' }}
      />
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
        Cargando notificaciones...
      </p>
    </main>
  );
}
