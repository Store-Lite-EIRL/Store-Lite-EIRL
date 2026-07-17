import { resolveBusinessSlug } from '@/core/business/slug';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComplaintForm } from './ComplaintForm';

interface ComplaintPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ComplaintPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) return { title: 'Libro de Reclamaciones' };

  return {
    title: `Libro de Reclamaciones — ${business.name}`,
    description: 'Presentá un reclamo o queja formal según el DS 011-2011-PCM.',
    robots: { index: true, follow: true },
  };
}

export default async function ComplaintBookPage({ params }: ComplaintPageProps) {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) {
    return notFound();
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 16px' }}>
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        Libro de Reclamaciones
      </h1>
      <p
        style={{
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: '0.9375rem',
          marginBottom: '32px',
          lineHeight: '1.5',
        }}
      >
        Completá el formulario con tus datos y los detalles del reclamo. La empresa tiene 15 días
        hábiles para responder, según lo establecido por el DS 011-2011-PCM y la Ley 29571.
      </p>

      <ComplaintForm slug={slug} />
    </div>
  );
}
