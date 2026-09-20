import styles from './ProcessSection.module.css';

const STEPS = [
  {
    number: 1,
    title: 'Tu cuenta en 30 segundos',
    description: 'Entra con Google. Sin formularios largos ni verificación complicada.',
  },
  {
    number: 2,
    title: 'Tu tienda, tu estilo',
    description: 'Sube tu logo, elige colores y carga tu catálogo.',
  },
  {
    number: 3,
    title: 'Comparte y empieza a vender',
    description: 'Tu link listo. Instagram y redes conectadas para compartir sin esfuerzo.',
  },
  {
    number: 4,
    title: 'Pagos seguros con Culqi',
    description: 'El comprador paga, el dinero llega directo a tu cuenta.',
  },
] as const;

export default function ProcessSection() {
  return (
    <section className={styles.section} id="procesos">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2>Tu tienda online en 4 pasos</h2>
          <p>Empieza en minutos. Vende tú, nosotros nos encargamos del resto.</p>
        </div>

        <div className={styles.steps}>
          {STEPS.map((step) => (
            <article className={styles.step} key={step.number}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
