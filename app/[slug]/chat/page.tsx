import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mensajes | Store Lite',
  description: 'Centro de mensajes',
};

export default function ChatPage() {
  return (
    <div>
      <h1
        style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--md-sys-color-on-surface)' }}
      >
        Mensajes
      </h1>
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bandeja de entrada y chat.</p>
    </div>
  );
}
