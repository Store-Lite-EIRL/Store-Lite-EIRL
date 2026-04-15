import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="landing-footer" id="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-box-footer">
                <svg
                  className="logo-svg-footer"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                  <path
                    clipRule="evenodd"
                    d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <span className="logo-text">
                Store<span className="logo-dot">.Lite</span>
              </span>
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
