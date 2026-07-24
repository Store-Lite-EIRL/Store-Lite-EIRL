import { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: '¿Es realmente gratis?',
      answer:
        'Sí, puedes crear tu tienda gratis y usar todas las funciones básicas sin pagar nada. Solo pagás cuando vendés y elegís un plan superior. No hay costos ocultos ni letras chiquitas.',
    },
    {
      question: '¿Necesito conocimientos técnicos?',
      answer:
        'No. Store.Lite está diseñado para que qualquer persona pueda crear su tienda. No sabés código? No hay problema. En minutos tenés tu tienda lista.',
    },
    {
      question: '¿Cómo recibo mis ventas?',
      answer:
        'Culqi Procesa los pagos directamente a tu cuenta. El dinero llega en 24-48 horas. Vos cobrás y el cliente recibe su producto. Todo automático.',
    },
    {
      question: '¿Puedo cambiar de plan después?',
      answer:
        'Claro. Arrancá gratis y subí cuando quieras. Sin penalidades ni procesos complicate. El plan se adapta a tu negocio.',
    },
    {
      question: '¿Qué pasa con mis productos?',
      answer:
        'Sonetos. Tu catálogo queda guardado y podés usarlo cuando actives un plan de pago. No Perdés nada de lo que cargaste.',
    },
    {
      question: '¿Hay soporte en español?',
      answer:
        'Sí, todo el soporte es en español y dirigido por nuestro equipo. Te ayudamos con lo que necesites, sin Bots ni colas complicate.',
    },
  ];

  return (
    <section className="landing-section" id="faq">
      <div className="section-container">
        <div className="faq-header">
          <span className="section-eyebrow">FAQ</span>
          <h2 className="section-title-landing">Preguntas frecuentes</h2>
          <p className="section-description">
            Resolvemos las dudas más comunes antes de que preguntes.
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${openIndex === index ? 'open' : ''}`} key={index}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="material-symbols-outlined faq-icon">
                  {openIndex === index ? 'remove' : 'add'}
                </span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-footer">
          <p>
            <span className="material-symbols-outlined">help</span>
            ¿Tienes otra pregunta? <a href="mailto:devkittopsac@gmail.com">Escríbenos</a>
          </p>
        </div>
      </div>
    </section>
  );
}
