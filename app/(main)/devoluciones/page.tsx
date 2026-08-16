import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Reembolsos - Store.Lite',
  description:
    'Política de reembolsos de Store.Lite: plazo de 7 días calendario por pago de plan, reembolso por el mismo método de pago y solicitudes por WhatsApp.',
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Plazo del reembolso',
    content: (
      <p>
        Los pagos de planes se pueden reembolsar dentro de un plazo de{' '}
        <strong>7 días calendario</strong> contados desde la fecha de pago del plan. Pasado ese
        plazo ya no se otorga reembolso.
      </p>
    ),
  },
  {
    title: '2. Exclusión por consumo del servicio',
    content: (
      <p>
        No se otorgará reembolso cuando, dentro del plazo de 7 días, el cliente haya realizado
        ventas o utilizado cualquiera de las funciones o servicios incluidos en el plan contratado
        (es decir, cuando el servicio haya sido consumido).
      </p>
    ),
  },
  {
    title: '3. Método de reembolso',
    content: (
      <p>
        El reembolso se realiza mediante el mismo método de pago utilizado para la compra del plan
        (reversión a través del proveedor de pagos Culqi).
      </p>
    ),
  },
  {
    title: '4. Pago mensual manual',
    content: (
      <p>
        Los planes se pagan de forma manual cada mes. No existe renovación automática ni cobro
        recurrente: cada pago mensual se inicia expresamente por el cliente.
      </p>
    ),
  },
  {
    title: '5. Cómo solicitar un reembolso',
    content: (
      <p>
        Los reembolsos se solicitan de forma manual, únicamente a través de WhatsApp:{' '}
        <a href="https://wa.me/958119418" target="_blank" rel="noopener noreferrer">
          Solicitar reembolso por WhatsApp
        </a>
        .
      </p>
    ),
  },
];

export default function DevolucionesPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-container">
        <h1>Política de Reembolsos</h1>
        <p className="legal-page-date">Última actualización: agosto de 2026</p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}
      </div>
    </article>
  );
}
