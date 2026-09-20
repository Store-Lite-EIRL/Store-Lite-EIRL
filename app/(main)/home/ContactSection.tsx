import styles from './ContactSection.module.css';

export default function ContactSection() {
  return (
    <section className={styles.section} id="contacto">
      <div className={styles.wrap}>
        <div className={styles.contactCard}>
          <div>
            <h3>¿Tienes dudas antes de empezar?</h3>
            <p>Escríbenos y te ayudamos a elegir el plan correcto para tu negocio.</p>
          </div>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="https://wa.me/51958119418">
            <span className="material-symbols-rounded">chat</span>
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
