import type { Metadata } from 'next';
import { ComplaintForm } from './ComplaintForm';

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones - Store.Lite',
  description:
    'Libro de Reclamaciones de Store.Lite: presentá un reclamo o queja formal según el DS 011-2011-PCM. Respuesta en 15 días hábiles.',
  robots: { index: true, follow: true },
};

export default function ComplaintBookPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-container">
        <h1>Libro de Reclamaciones</h1>
        <p className="legal-page-date">Última actualización: agosto de 2026</p>

        <p>
          Completá el formulario con tus datos y los detalles del reclamo. La empresa tiene{' '}
          <strong>15 días hábiles</strong> para responder, según lo establecido por el{' '}
          <strong>DS 011-2011-PCM</strong> y la Ley 29571.
        </p>

        <ComplaintForm />
      </div>
    </article>
  );
}
