'use client';

import { useLayoutEffect, useRef } from 'react';
import styles from './FaqSection.module.css';

const FAQS = [
  {
    question: '¿Cuánto cuesta y hay comisiones ocultas?',
    answer:
      'Puedes crear tu tienda gratis y sin límite de tiempo. Los planes de pago tienen un precio fijo mensual o anual, con IGV incluido, y sin comisiones por venta ni costos de hosting.',
  },
  {
    question: '¿Necesito saber de programación o diseño?',
    answer:
      'No. Store Lite está pensado para cualquier dueño de negocio: eliges una plantilla, subes tus productos con foto y precio, y tu tienda queda lista. Sin código y sin diseñador.',
  },
  {
    question: '¿Cómo se verá mi tienda y qué link tendrá?',
    answer: 'Tu tienda recibe su propio subdominio desde el inicio, por ejemplo ',
  },
  {
    question: '¿Cómo recibo los pagos de mis clientes?',
    answer:
      'Conectamos tu tienda con Culqi: tus clientes pagan con tarjeta de crédito o débito y el dinero va directo a tu cuenta. También puedes ofrecer recojo o entrega a domicilio.',
  },
  {
    question: '¿Ofrezco envío a domicilio o recojo en tienda?',
    answer:
      'Tú decides: configurar entrega a domicilio por departamento, provincia y distrito, o recojo en tu local. Tus clientes eligen al momento de comprar.',
  },
  {
    question: '¿Cuánto demora tener mi tienda lista?',
    answer:
      'Puedes armar tu tienda el mismo día. No necesitas hosting, dominio ni mantenimiento aparte: todo está incluido en la plataforma.',
  },
  {
    question: '¿Puedo cambiar de plan o cancelar cuando quiera?',
    answer:
      'Sí. Puedes subir o bajar de plan desde tu panel sin perder tu información, y cancelar cuando quieras, sin contratos de permanencia.',
  },
  {
    question: '¿Hay soporte mientras empiezo?',
    answer:
      'Sí. Un asistente real de Store Lite te responde por WhatsApp en español, te ayuda a elegir plan y a resolver cualquier duda de tu tienda.',
  },
] as const;

export default function FAQSection() {
  const firstDetailsRef = useRef<HTMLDetailsElement>(null);

  // Set open attribute on mount for jsdom compatibility (defaultOpen doesn't set attribute in jsdom)
  useLayoutEffect(() => {
    if (firstDetailsRef.current) {
      firstDetailsRef.current.open = true;
    }
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.eyebrowIcon}>
            <span className="material-symbols-rounded">help</span>
          </div>
          <h2>Preguntas frecuentes</h2>
          <p>Resolvemos las dudas más comunes antes de que preguntes.</p>
        </div>

        <div className={styles.faq}>
          {FAQS.map((faq, index) => (
            <details key={faq.question} ref={index === 0 ? firstDetailsRef : undefined}>
              <summary>
                {faq.question}
                <span className="material-symbols-rounded">add</span>
              </summary>
              {index === 2 ? (
                <p>
                  Tu tienda recibe su propio subdominio desde el inicio, por ejemplo{' '}
                  <code className={styles.subdomain}>mitienda.storelite.app</code>. Cuando quieras,
                  puedes conectar tu propio dominio (por ejemplo tustienda.com.pe).
                </p>
              ) : (
                <p>{faq.answer}</p>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
