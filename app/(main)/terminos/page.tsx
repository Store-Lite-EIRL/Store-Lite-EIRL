import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio - Store.Lite',
  description:
    'Términos y condiciones de uso de la plataforma Store.Lite, un servicio SaaS de Devkittop (MAMANI TACORA ERNESTO ALONSO, RUC 10741399852, persona natural con negocio) para la creación y gestión de tiendas online.',
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Aceptación de los términos',
    content: (
      <p>
        Al acceder o utilizar la plataforma Store.Lite (&laquo;la plataforma&raquo;), Ud. acepta los
        presentes Términos de Servicio (&laquo;los Términos&raquo;) y nuestra Política de
        Privacidad. Si no está de acuerdo con estos Términos, no debe utilizar la plataforma.
      </p>
    ),
  },
  {
    title: '2. Descripción del servicio',
    content: (
      <p>
        Store.Lite es una plataforma SaaS (Software as a Service) que permite a los usuarios crear,
        administrar y operar tiendas online para la venta de productos virtuales y físicos. El
        servicio incluye herramientas de gestión de inventario, procesamiento de pagos, chat con
        clientes y funcionalidades administrativas.
      </p>
    ),
  },
  {
    title: '3. Registro y cuenta',
    content: (
      <>
        <p>Para utilizar la plataforma, Ud. debe:</p>
        <ul>
          <li>Ser mayor de 18 años o contar con autorización de un representante legal.</li>
          <li>Registrarse utilizando una cuenta de Google válida.</li>
          <li>Proporcionar información veraz, precisa y actualizada.</li>
          <li>Mantener la confidencialidad de su cuenta y credenciales.</li>
        </ul>
        <p>
          Ud. es responsable de todas las actividades que ocurran bajo su cuenta. Devkittop, marca
          de MAMANI TACORA ERNESTO ALONSO, persona natural con negocio, RUC 10741399852 no será
          responsable por pérdidas derivadas del uso no autorizado de su cuenta.
        </p>
      </>
    ),
  },
  {
    title: '4. Planes y pagos',
    content: (
      <>
        <p>
          La plataforma ofrece planes gratuitos y planes de pago. Los términos específicos de cada
          plan se describen en la sección de precios de la plataforma.
        </p>
        <ul>
          <li>Los pagos se procesan a través de nuestro proveedor de pagos Culqi.</li>
          <li>
            Los planes se pagan de forma manual cada mes, sin renovación automática ni cobro
            recurrente: cada pago mensual se inicia expresamente por el cliente.
          </li>
          <li>Los reembolsos se rigen por nuestra Política de Reembolsos.</li>
          <li>Devkittop se reserva el derecho de modificar los precios con previo aviso.</li>
        </ul>
      </>
    ),
  },
  {
    title: '5. Propiedad intelectual',
    content: (
      <>
        <p>
          La plataforma Store.Lite, incluyendo su código, diseño, logotipos y contenido original, es
          propiedad de Devkittop, marca de MAMANI TACORA ERNESTO ALONSO, persona natural con
          negocio, RUC 10741399852 y está protegida por las leyes de propiedad intelectual peruanas
          e internacionales.
        </p>
        <p>
          El contenido que Ud. publique en su tienda (productos, imágenes, descripciones) es de su
          propiedad. Al publicarlo en la plataforma, nos otorga una licencia para alojarlo,
          mostrarlo y distribuirlo con el único fin de operar el servicio.
        </p>
      </>
    ),
  },
  {
    title: '6. Conducta del usuario',
    content: (
      <>
        <p>Ud. se compromete a no utilizar la plataforma para:</p>
        <ul>
          <li>Publicar contenido ilegal, fraudulento o que infrinja derechos de terceros.</li>
          <li>
            Vender productos prohibidos por la ley peruana o por las políticas de la plataforma.
          </li>
          <li>
            Realizar actividades que puedan dañar, deshabilitar o sobrecargar la infraestructura.
          </li>
          <li>Intentar acceder a cuentas de otros usuarios sin autorización.</li>
          <li>Enviar spam, mensajes no solicitados o contenido malicioso.</li>
        </ul>
      </>
    ),
  },
  {
    title: '7. Limitación de responsabilidad',
    content: (
      <p>
        En la medida máxima permitida por la ley, Devkittop, marca de MAMANI TACORA ERNESTO ALONSO,
        persona natural con negocio, RUC 10741399852 no será responsable por daños indirectos,
        incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar la
        plataforma. La plataforma se proporciona &laquo;tal cual&raquo; y &laquo;según
        disponibilidad&raquo;, sin garantías de ningún tipo, expresas o implícitas.
      </p>
    ),
  },
  {
    title: '8. Cancelación y suspensión',
    content: (
      <>
        <p>
          Ud. puede cancelar su cuenta en cualquier momento desde la configuración de la plataforma.
          Devkittop, marca de MAMANI TACORA ERNESTO ALONSO, persona natural con negocio, RUC
          10741399852 se reserva el derecho de suspender o cancelar cuentas que violen estos
          Términos.
        </p>
        <p>
          Tras la cancelación, sus datos serán eliminados dentro del plazo establecido en nuestra
          Política de Privacidad, salvo que la ley exija su conservación.
        </p>
      </>
    ),
  },
  {
    title: '9. Modificaciones de los Términos',
    content: (
      <p>
        Devkittop, marca de MAMANI TACORA ERNESTO ALONSO, persona natural con negocio, RUC
        10741399852 se reserva el derecho de modificar estos Términos en cualquier momento. Le
        notificaremos sobre cambios significativos a través de la plataforma o por correo
        electrónico. El uso continuado de la plataforma después de dichas modificaciones constituye
        su aceptación de los nuevos Términos.
      </p>
    ),
  },
  {
    title: '10. Legislación aplicable y jurisdicción',
    content: (
      <>
        <p>
          Estos Términos se rigen por la legislación de la República del Perú. Cualquier
          controversia será sometida a la jurisdicción de los tribunales de Lima, Perú.
        </p>
        <p>
          Si alguna disposición de estos Términos fuera considerada inválida o inejecutable, las
          disposiciones restantes continuarán en pleno vigor y efecto.
        </p>
      </>
    ),
  },
  {
    title: '11. Contacto',
    content: (
      <p>
        Para consultas sobre estos Términos, puede contactarnos a través de:{' '}
        <a href="mailto:devkittopsac@gmail.com" target="_blank" rel="noopener noreferrer">
          devkittopsac@gmail.com
        </a>{' '}
        o al teléfono{' '}
        <a href="tel:+51958119418" target="_blank" rel="noopener noreferrer">
          958 119 418
        </a>
        .
      </p>
    ),
  },
];

export default function TerminosPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-container">
        <h1>Términos de Servicio</h1>
        <p className="legal-page-date">Última actualización: julio de 2026</p>

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
