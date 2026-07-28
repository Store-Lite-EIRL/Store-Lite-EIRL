import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Store.Lite',
  description:
    'Política de privacidad de Store.Lite conforme a la Ley 29733 de Protección de Datos Personales en Perú.',
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Identificación del responsable del tratamiento',
    content: (
      <>
        <p>
          <strong>Devkittop SAC</strong> (en adelante, &laquo;Devkittop&raquo; o &laquo;el
          responsable&raquo;) es el responsable del tratamiento de los datos personales recabados a
          través de la plataforma Store.Lite.
        </p>
        <ul>
          <li>
            <strong>Correo electrónico:</strong>{' '}
            <a href="mailto:devkittopsac@gmail.com" target="_blank" rel="noopener noreferrer">
              devkittopsac@gmail.com
            </a>
          </li>
          <li>
            <strong>Teléfono:</strong>{' '}
            <a href="tel:+51978775813" target="_blank" rel="noopener noreferrer">
              +51 978 775 813
            </a>
          </li>
          <li>
            <strong>País:</strong> Perú
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Datos personales que recopilamos',
    content: (
      <>
        <p>
          Podemos recopilar los siguientes datos personales según el uso que Ud. haga de la
          plataforma:
        </p>
        <ul>
          <li>
            <strong>Datos de cuenta:</strong> nombre completo, correo electrónico, foto de perfil y
            preferencias de idioma.
          </li>
          <li>
            <strong>Datos de la tienda:</strong> nombre comercial, logo, descripción, productos
            publicados, precios y configuraciones.
          </li>
          <li>
            <strong>Datos de pago:</strong> información de transacciones procesadas a través de
            nuestro proveedor de pagos (Culqi). No almacenamos números de tarjeta ni datos bancarios
            completos.
          </li>
          <li>
            <strong>Datos de uso:</strong> páginas visitadas, interacciones, dirección IP, tipo de
            navegador y sistema operativo.
          </li>
          <li>
            <strong>Datos de comunicación:</strong> mensajes enviados a través del chat de la
            plataforma y correos electrónicos de soporte.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Finalidad del tratamiento',
    content: (
      <>
        <p>Sus datos personales serán tratados con las siguientes finalidades:</p>
        <ul>
          <li>Operar, mantener y mejorar la plataforma Store.Lite.</li>
          <li>Autenticar su identidad mediante proveedores OAuth (Google).</li>
          <li>Procesar pagos y gestionar suscripciones.</li>
          <li>Brindar soporte técnico y atención al cliente.</li>
          <li>Enviar comunicaciones operativas y notificaciones de la plataforma.</li>
          <li>Cumplir con obligaciones legales y regulatorias aplicables.</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. Base legal del tratamiento',
    content: (
      <>
        <p>El tratamiento de sus datos personales se sustenta en las siguientes bases legales:</p>
        <ul>
          <li>
            <strong>Consentimiento (Art. 13 de la Ley 29733):</strong> al aceptar los términos y
            condiciones y la presente política de privacidad.
          </li>
          <li>
            <strong>Ejecución de un contrato:</strong> para la prestación de los servicios de la
            plataforma.
          </li>
          <li>
            <strong>Obligación legal:</strong> para cumplir con disposiciones tributarias,
            comerciales y de protección al consumidor.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '5. Período de conservación de los datos',
    content: (
      <p>
        Conservamos sus datos personales durante el tiempo necesario para cumplir con las
        finalidades descritas en esta política, o durante el plazo mínimo exigido por la legislación
        peruana aplicable. Una vez que ya no sean necesarios, procederemos a su eliminación segura.
      </p>
    ),
  },
  {
    title: '6. Derechos ARCO-PD',
    content: (
      <>
        <p>
          De conformidad con la Ley 29733 y su Reglamento (DS 003-2013-JUS), Ud. tiene derecho a
          ejercer los siguientes derechos:
        </p>
        <ul>
          <li>
            <strong>Acceso:</strong> conocer qué datos personales nuestros estamos tratando y para
            qué fines.
          </li>
          <li>
            <strong>Rectificación:</strong> solicitar la corrección de datos inexactos o
            desactualizados.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la eliminación de sus datos cuando ya no sean
            necesarios.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse al tratamiento de sus datos para fines específicos.
          </li>
          <li>
            <strong>Portabilidad:</strong> solicitar una copia de sus datos en formato estructurado
            (cuando sea técnicamente factible).
          </li>
        </ul>
        <p>
          Para ejercer sus derechos ARCO-PD, envíe una solicitud a{' '}
          <a href="mailto:devkittopsac@gmail.com" target="_blank" rel="noopener noreferrer">
            devkittopsac@gmail.com
          </a>{' '}
          indicando el derecho que desea ejercer y los datos necesarios para su identificación.
          Responderemos a su solicitud dentro del plazo legal establecido.
        </p>
      </>
    ),
  },
  {
    title: '7. Oficial de Protección de Datos',
    content: (
      <p>
        Para consultas relacionadas con el tratamiento de sus datos personales, puede contactar a
        nuestro Oficial de Protección de Datos (DPO) a través del correo electrónico{' '}
        <a href="mailto:devkittopsac@gmail.com" target="_blank" rel="noopener noreferrer">
          devkittopsac@gmail.com
        </a>
        .
      </p>
    ),
  },
  {
    title: '8. Transferencia de datos a terceros',
    content: (
      <>
        <p>
          Podemos compartir sus datos personales con los siguientes proveedores de servicios
          esenciales para el funcionamiento de la plataforma:
        </p>
        <ul>
          <li>
            <strong>Supabase (Estados Unidos):</strong> hosting de base de datos y autenticación.{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Supabase
            </a>
          </li>
          <li>
            <strong>Google (Estados Unidos):</strong> autenticación OAuth.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Google
            </a>
          </li>
          <li>
            <strong>Culqi (Perú):</strong> procesamiento de pagos.{' '}
            <a href="https://www.culqi.com/privacidad/" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Culqi
            </a>
          </li>
          <li>
            <strong>Resend (Estados Unidos):</strong> envío de correos electrónicos.{' '}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de privacidad de Resend
            </a>
          </li>
        </ul>
        <p>
          No vendemos sus datos personales a terceros. Toda transferencia se realiza bajo las
          garantías y salvaguardas exigidas por la Ley 29733.
        </p>
      </>
    ),
  },
  {
    title: '9. Cookies y tecnologías similares',
    content: (
      <>
        <p>
          Utilizamos cookies y tecnologías similares para el funcionamiento de la plataforma. Las
          cookies que utilizamos incluyen:
        </p>
        <ul>
          <li>
            <strong>Cookies de autenticación:</strong> necesarias para mantener su sesión iniciada.
            (Duración: hasta el cierre de sesión)
          </li>
          <li>
            <strong>Cookies de seguridad:</strong> para proteger contra actividades fraudulentas.
            (Duración: sesión)
          </li>
          <li>
            <strong>Cookies analíticas:</strong> para comprender el uso de la plataforma (PostHog).
            (Duración: hasta 12 meses)
          </li>
          <li>
            <strong>Cookies de preferencias:</strong> para recordar su configuración de idioma y
            tema. (Duración: hasta 12 meses)
          </li>
        </ul>
        <p>
          Puede gestionar o deshabilitar las cookies desde la configuración de su navegador. Sin
          embargo, algunas funcionalidades de la plataforma podrían verse afectadas.
        </p>
      </>
    ),
  },
  {
    title: '10. Medidas de seguridad',
    content: (
      <>
        <p>
          Implementamos medidas de seguridad técnicas, organizativas y legales para proteger sus
          datos personales, incluyendo:
        </p>
        <ul>
          <li>Encriptación en tránsito mediante TLS 1.3.</li>
          <li>Encriptación en reposo de datos sensibles.</li>
          <li>Control de acceso basado en roles (RBAC).</li>
          <li>Monitoreo continuo de seguridad y detección de intrusiones.</li>
          <li>Políticas internas de tratamiento de datos y capacitación del personal.</li>
          <li>Evaluaciones periódicas de vulnerabilidades.</li>
        </ul>
      </>
    ),
  },
  {
    title: '11. Actualizaciones de esta política',
    content: (
      <p>
        Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre
        cambios significativos a través de la plataforma o por correo electrónico. La versión
        actualizada entrará en vigor desde su publicación.
      </p>
    ),
  },
  {
    title: '12. Legislación aplicable',
    content: (
      <>
        <p>
          Esta política de privacidad se rige por la legislación peruana, en particular por la Ley
          N&deg; 29733 &mdash; Ley de Protección de Datos Personales, su Reglamento (DS
          003-2013-JUS) y normas modificatorias.
        </p>
        <p>
          En caso de controversia, nos sometemos a la jurisdicción de los tribunales de Lima, Perú.
        </p>
      </>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-container">
        <h1>Política de Privacidad</h1>
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
