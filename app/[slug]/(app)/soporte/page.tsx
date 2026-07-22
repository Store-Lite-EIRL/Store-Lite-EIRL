import { SupportForm } from './SupportForm';

export const metadata = {
  title: 'Soporte — Store Lite',
};

export default function SupportPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 16px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
        Contactar a Soporte
      </h1>
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '32px' }}>
        ¿Tenés un problema o consulta? Mandanos un mensaje y te respondemos a la brevedad.
      </p>
      <SupportForm />
    </div>
  );
}
