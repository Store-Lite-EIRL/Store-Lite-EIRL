import styles from './TrustSection.module.css';

const TRUST_ITEMS = [
  {
    icon: 'lock',
    title: 'Pagos seguros',
    description: 'Procesado por Culqi (PCI DSS).',
  },
  {
    icon: 'shield',
    title: 'Datos seguros',
    description: 'Encriptación SSL y almacenamiento seguro.',
  },
  {
    icon: 'verified',
    title: 'Legalizado',
    description: 'Cumple con normativas SUNAT.',
  },
  {
    icon: 'autorenew',
    title: 'Sin permanencia',
    description: 'Cancela cuando quieras.',
  },
] as const;

export default function TrustSection() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2>
            <span className="material-symbols-rounded" aria-hidden="true">
              verified_user
            </span>
            Confía tranquilo
          </h2>
          <p>
            Tu negocio y tus clientes están protegidos. Usamos estándares de seguridad bancaria y
            cumplimos con la ley.
          </p>
        </div>

        <div className={styles.trustRow}>
          {TRUST_ITEMS.map((item) => (
            <div className={styles.trustItem} key={item.title}>
              <div className={styles.trustIcon}>
                <span className="material-symbols-rounded">{item.icon}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
