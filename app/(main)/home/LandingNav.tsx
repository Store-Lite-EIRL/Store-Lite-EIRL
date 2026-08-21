'use client';

import { StoreLogo } from '@/shared/components/ui/data-display/StoreLogo';
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
        <Link href="/" className="landing-nav-logo" aria-label="Ir al inicio de Store Lite">
          <StoreLogo size={32} variant="white" />
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
