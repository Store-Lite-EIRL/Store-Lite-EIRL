import styles from './FAQSection.module.css';

const FAQS = [
  {
    question: '¿Es realmente gratis empezar?',
    answer:
      'Sí. Puedes crear tu tienda y ver las funciones básicas sin pagar nada. Solo pagas cuando eliges un plan superior.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer:
      'No. Store Lite está pensado para que la arme cualquier dueño de negocio, sin programar nada.',
  },
  {
    question: '¿Cómo recibo mis ventas?',
    answer:
      'Los pagos llegan directo a tu cuenta a través de Culqi, con la misma seguridad que usan los bancos.',
  },
  {
    question: '¿Puedo cambiar de plan después?',
    answer:
      'Sí, puedes subir o bajar de plan cuando quieras desde tu panel, sin perder tu información.',
  },
  {
    question: '¿Qué pasa con mis productos si cancelo?',
    answer: 'Tu catálogo queda guardado. Si vuelves más adelante, todo sigue tal como lo dejaste.',
  },
  {
    question: '¿Hay soporte en español?',
    answer: 'Sí, todo el soporte de Store Lite es en español y pensado para negocios peruanos.',
  },
] as const;

export default function FAQSection() {
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
            <details key={faq.question} open={index === 0}>
              <summary>
                {faq.question}
                <span className="material-symbols-rounded">add</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
