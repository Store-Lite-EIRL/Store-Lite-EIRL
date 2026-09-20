'use client';

import { useTheme } from '@/shared/context/ThemeContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './FloatingNav.module.css';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'pricing', label: 'Planes' },
  { id: 'footer', label: 'Contacto' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

export default function FloatingNav() {
  const { setTheme, effectiveTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('inicio');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let currentSection: SectionId = 'inicio';

        for (const entry of entries) {
          if (entry.isIntersecting) {
            currentSection = entry.target.id as SectionId;
          }
        }

        setActiveSection(currentSection);
      },
      {
        rootMargin: '-50% 0px -50% 0px',
        threshold: [0, 0.5, 1],
      },
    );

    NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll handler for scrolled state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Trap focus in mobile menu
  useEffect(() => {
    if (!isMenuOpen) return;

    const nav = navRef.current;
    if (!nav) return;

    const focusableElements = nav.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    nav.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => nav.removeEventListener('keydown', handleTab);
  }, [isMenuOpen]);

  const handleThemeToggle = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const scrollToSection = (id: SectionId) => {
    setIsMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 64;
      const top = Math.max(element.offsetTop - navHeight, 0);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const navLinkClass = (id: SectionId) =>
    `${styles.navLink} ${activeSection === id ? styles.navLinkActive : ''}`;

  return (
    <nav
      ref={navRef}
      className={`${styles.nav} ${isScrolled ? styles.navScrolled : ''}`}
      aria-label="Navegación principal"
    >
      <div className={styles.navContainer}>
        <div className={styles.navInner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="Ir al inicio de Store Lite">
            <div className={styles.logoMark}>
              <md-icon>store</md-icon>
            </div>
            <span className={styles.logoText}>Store Lite</span>
          </Link>

          {/* Desktop Section Links */}
          <div className={styles.navLinks}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={navLinkClass(item.id)}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(item.id);
                }}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className={styles.actions}>
            <Link href="/auth" className={styles.btnOutline}>
              Iniciar sesión
            </Link>
            <Link href="/auth" className={styles.btnPrimary}>
              Crear mi tienda
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>

            {/* Theme Toggle */}
            <button
              className={styles.themeToggle}
              onClick={handleThemeToggle}
              aria-label={
                effectiveTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
              }
              aria-pressed={effectiveTheme === 'dark'}
            >
              <md-icon>{effectiveTheme === 'dark' ? 'light_mode' : 'dark_mode'}</md-icon>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className={styles.mobileMenuToggle}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <md-icon>{isMenuOpen ? 'close' : 'menu'}</md-icon>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
          aria-hidden={!isMenuOpen}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`${styles.mobileMenuLink} ${activeSection === item.id ? styles.mobileMenuLinkActive : ''}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(item.id);
              }}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
          <div className={styles.mobileMenuActions}>
            <Link
              href="/auth"
              className={`${styles.mobileMenuAction} ${styles.mobileMenuActionOutline}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth"
              className={`${styles.mobileMenuAction} ${styles.mobileMenuActionPrimary}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Crear mi tienda
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
