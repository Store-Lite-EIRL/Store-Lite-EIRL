'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'pricing', label: 'Planes' },
  { id: 'footer', label: 'Contacto' },
] as const;

type SectionId = (typeof navItems)[number]['id'];

export default function LandingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('inicio');

  useEffect(() => {
    const updateNavState = () => {
      setIsScrolled(window.scrollY > 50);

      const navOffset = 120;
      const scrollPosition = window.scrollY + navOffset;
      let currentSection: SectionId = 'inicio';

      for (const item of navItems) {
        const section = document.getElementById(item.id);
        if (!section) {
          continue;
        }

        if (scrollPosition >= section.offsetTop) {
          currentSection = item.id;
        }
      }

      setActiveSection(currentSection);
    };

    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState);

    return () => {
      window.removeEventListener('scroll', updateNavState);
      window.removeEventListener('resize', updateNavState);
    };
  }, []);

  const scrollToSection = (id: SectionId) => {
    setIsMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = window.innerWidth <= 768 ? 88 : 96;
      const top = Math.max(element.offsetTop - navHeight, 0);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-logo" aria-label="Ir al inicio de Store.Lite">
          <div className="logo-box-landing">
            <svg
              className="logo-svg-landing"
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
        </Link>

        <div className={`landing-nav-links ${isMenuOpen ? 'show' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}

          <div className="mobile-only-actions">
            <Link href="/auth" className="login-link">
              Iniciar sesión
            </Link>
            <Link href="/auth" className="btn-primary-glow">
              Crear mi tienda <span className="arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="landing-nav-actions">
          <Link href="/auth" className="login-link">
            Iniciar sesión
          </Link>
          <Link href="/auth" className="btn-primary-glow nav-cta">
            Crear mi tienda <span className="arrow">→</span>
          </Link>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
        >
          <md-icon>{isMenuOpen ? 'close' : 'menu'}</md-icon>
        </button>
      </div>
    </nav>
  );
}
