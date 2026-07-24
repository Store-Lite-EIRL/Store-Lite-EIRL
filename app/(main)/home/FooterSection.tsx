import { StoreLogo } from '@/shared/components/ui/data-display/StoreLogo';
import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="landing-footer" id="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <StoreLogo size={36} variant="white" />
            </div>
            <p className="footer-tagline">
              La plataforma que hace crecer tu negocio. Creá tu tienda online en minutos y empezá a
              vender.
            </p>
            <div className="footer-contact">
              <a href="mailto:devkittopsac@gmail.com" className="contact-item">
                <span className="material-symbols-outlined">mail</span>
                devkittopsac@gmail.com
              </a>
              <a href="tel:+51978775813" className="contact-item">
                <span className="material-symbols-outlined">call</span>
                +51 978 775 813
              </a>
            </div>
          </div>

          <div className="footer-links-wrapper">
            <div className="footer-column">
              <h4>Producto</h4>
              <Link href="/pricing">Planes y precios</Link>
              <Link href="/auth">Comenzar</Link>
              <Link href="#proceso">Cómo funciona</Link>
            </div>
            <div className="footer-column">
              <h4>Empresa</h4>
              <Link href="#soluciones">Soluciones</Link>
              <Link href="#pricing">Precios</Link>
              <Link href="#footer">Contacto</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link href="#">Términos de servicio</Link>
              <Link href="#">Política de privacidad</Link>
              <Link href="#">Política de reembolsos</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>&copy; 2026 Devkittop. Todos los derechos reservados.</p>
            <p className="footer-company">
              Desarrollado por <strong>Devkittop</strong> · Perú
            </p>
          </div>
          <div className="footer-bottom-right">
            <Link href="/auth" className="footer-cta">
              Crear mi tienda
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
