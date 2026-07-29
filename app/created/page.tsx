import Link from 'next/link';
import { redirect } from 'next/navigation';

interface CreatedPageProps {
  searchParams: Promise<{ businessId?: string; name?: string }>;
}

export default async function CreatedPage({ searchParams }: CreatedPageProps) {
  const { businessId, name } = await searchParams;

  // If no params, send user back to create
  if (!businessId || !name) {
    redirect('/create-business');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--md-sys-color-surface)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Checkmark icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
          role="img"
          aria-label="Success"
        >
          ✓
        </div>

        {/* Heading */}
        <h1
          className="heading-3"
          style={{
            fontWeight: 600,
            margin: 0,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          ¡Negocio creado exitosamente!
        </h1>

        {/* Business name */}
        <p
          className="body-large"
          style={{
            margin: 0,
            color: 'var(--md-sys-color-on-surface-variant)',
            maxWidth: '360px',
          }}
        >
          Tu negocio <strong>{name}</strong> está listo. Ya podés gestionar productos, pedidos y más
          desde tu panel de administración.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          <Link
            href={`/admin/${name}`}
            className="md-button md-button--filled"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            Ir al panel de administración
          </Link>

          <Link
            href="/pricing"
            className="md-button md-button--outlined"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              border: '1px solid var(--md-sys-color-outline)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            Ver planes de precios
          </Link>
        </div>
      </div>
    </main>
  );
}
