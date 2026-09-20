import styles from './SolutionsSection.module.css';

const CARDS = [
  {
    icon: 'rocket_launch',
    issue: 'Crear una tienda online cuesta caro y toma semanas.',
    fix: 'Es gratis empezar. Sin mensualidad ni sorpresas.',
  },
  {
    icon: 'payments',
    issue: 'Te complicas con pagos y cobros.',
    fix: 'Pagos directos y seguros, integrados con Culqi.',
  },
  {
    icon: 'local_shipping',
    issue: 'Gestionar envíos es un dolor de cabeza.',
    fix: 'Todo desde la app. Control total sin salir de casa.',
  },
  {
    icon: 'inventory_2',
    issue: 'Pierdes productos y stock en hojas de cálculo.',
    fix: 'Tu catálogo siempre al día, sin esfuerzo.',
  },
  {
    icon: 'insights',
    issue: 'No sabes qué está funcionando o qué no.',
    fix: 'Datos reales. Decisiones basadas en info, no en intuición.',
  },
  {
    icon: 'hub',
    issue: 'Vender a la vez por redes y por web se vuelve un caos.',
    fix: 'Conecta Instagram y WhatsApp a la misma tienda.',
  },
] as const;

const INTEGRATIONS = [
  { icon: 'credit_card', name: 'Culqi', cat: 'Pagos' },
  { icon: 'photo_camera', name: 'Instagram', cat: 'Ventas' },
  { icon: 'chat', name: 'WhatsApp', cat: 'Atención' },
  { icon: 'travel_explore', name: 'Google', cat: 'Dominio' },
  { icon: 'query_stats', name: 'Analytics', cat: 'Datos' },
] as const;

export default function SolutionsSection() {
  return (
    <section className={styles.section} id="soluciones">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.eyebrowIcon}>
            <span className="material-symbols-rounded">bolt</span>
          </div>
          <h2>Deja de complicarte. Enfócate en vender.</h2>
          <p>
            Crear y mantener un ecommerce no debería ser un proyecto de ingeniería. Store Lite te da
            lo que necesitas, sin lo que no.
          </p>
        </div>

        <div className={styles.cardGrid}>
          {CARDS.map((card) => (
            <article className={styles.infoCard} key={card.issue}>
              <div className={styles.iconChip}>
                <span className="material-symbols-rounded">{card.icon}</span>
              </div>
              <p className={styles.issue}>{card.issue}</p>
              <div className={styles.fixRow}>
                <span className="material-symbols-rounded">check_circle</span>
                <p>{card.fix}</p>
              </div>
            </article>
          ))}
        </div>

        <h3 className={styles.intTitle}>Todo lo que necesitas, conectado</h3>

        <div className={styles.intRow}>
          {INTEGRATIONS.map((int) => (
            <div className={styles.intChip} key={int.name}>
              <div className={styles.intChipIcon}>
                <span className="material-symbols-rounded">{int.icon}</span>
              </div>
              <div className={styles.intName}>{int.name}</div>
              <div className={styles.intCat}>{int.cat}</div>
            </div>
          ))}
        </div>

        <p className={styles.intMore}>+ Más integraciones próximamente</p>
      </div>
    </section>
  );
}
