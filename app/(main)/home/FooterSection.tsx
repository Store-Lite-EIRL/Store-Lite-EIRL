import { StoreLogo } from '@/shared/components/ui/data-display/StoreLogo';
import Link from 'next/link';
import styles from './FooterSection.module.css';

export default function FooterSection() {
  return (
    <footer className={styles.landingFooter} id="footer">
      <div className={styles.footerContainer}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <StoreLogo size={36} variant="white" />
            </div>
            <p className={styles.footerTagline}>
              La plataforma que hace crecer tu negocio. Crea tu tienda online en minutos y empieza a
              vender.
            </p>
            <div className={styles.footerContact}>
              <a href="mailto:devkittopsac@gmail.com" className={styles.contactItem}>
                <span className="material-symbols-outlined">mail</span>
                devkittopsac@gmail.com
              </a>
              <a href="tel:+51958119418" className={styles.contactItem}>
                <span className="material-symbols-outlined">call</span>
                958 119 418
              </a>
              <span className={styles.contactItem}>
                <span className="material-symbols-outlined">place</span>
                Arequipa, Arequipa, Ciudad de Dios
              </span>
            </div>
          </div>

          <div className={styles.footerLinksWrapper}>
            <div className={styles.footerColumn}>
              <h4>Producto</h4>
              <Link href="/pricing">Planes y precios</Link>
              <Link href="/auth">Comenzar</Link>
              <Link href="#procesos">Cómo funciona</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Empresa</h4>
              <Link href="#soluciones">Soluciones</Link>
              <Link href="#pricing">Precios</Link>
              <Link href="#footer">Contacto</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <Link href="/terminos">Términos de servicio</Link>
              <Link href="/privacidad">Política de privacidad</Link>
              <Link href="/devoluciones">Política de reembolsos</Link>
              <Link href="/libro-reclamaciones">Libro de Reclamaciones</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomLeft}>
            <p>&copy; 2026 Devkittop. Todos los derechos reservados.</p>
            <p className={styles.footerCompany}>
              Desarrollado por <strong>Devkittop</strong> · Perú
            </p>
          </div>
          <div className={styles.footerBottomRight}>
            <Link href="/auth" className={styles.footerCta}>
              Crear mi tienda
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
