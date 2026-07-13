'use client';

interface NotificationsClientProps {
  businessId: string;
  businessName: string;
}

/**
 * NotificationsClient — full-page notifications center.
 * @remarks Will be fully implemented in Phase 3.
 */
export default function NotificationsClient({
  businessId,
  businessName,
}: NotificationsClientProps) {
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
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 64,
          color: 'var(--md-sys-color-primary)',
        }}
      >
        notifications
      </span>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'var(--md-sys-color-on-surface)',
          margin: 0,
        }}
      >
        Centro de Notificaciones
      </h1>
      <p
        style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0, textAlign: 'center' }}
      >
        Esta sección está en construcción.
      </p>
    </main>
  );
}
