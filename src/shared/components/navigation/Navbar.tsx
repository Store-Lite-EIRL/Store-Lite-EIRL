'use client';

import '@/styles/components/navbar.css';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '../ui';
import { getBusinessBySlug } from './actions';

interface NavbarProps {
  onLogout?: () => void;
  onCloseStore?: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  logoUrl: string | null;
  storeType: string | null;
}

// ... interface definitions ...

export default function Navbar({ onLogout, onCloseStore, isCollapsed, onToggle }: NavbarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchBusiness = () => {
      if (slug) {
        getBusinessBySlug(slug)
          .then((data) => {
            if (isMounted && data) {
              setBusinessData(data);
              setTimestamp(Date.now());
            }
            return null;
          })
          .catch((error) => {
            if (isMounted && error?.name !== 'AbortError') {
              console.error('Error fetching business data:', error);
            }
          });
      }
    };

    fetchBusiness();

    if (slug) {
      localStorage.setItem('selectedBusinessSlug', slug);
    }

    // Listen for updates from other components (e.g. Hero)
    window.addEventListener('business-data-updated', fetchBusiness);
    return () => {
      isMounted = false;
      window.removeEventListener('business-data-updated', fetchBusiness);
    };
  }, [slug]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleCloseStore = () => {
    if (onCloseStore) {
      onCloseStore();
    } else {
      document.cookie = 'selected_business_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('selectedBusinessSlug');
      router.push('/list-business');
    }
  };

  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', path: `/${slug}` },
    { id: 'storage', icon: 'package_2', label: 'Almacén', path: `/${slug}/storage` },
    { id: 'chat', icon: 'chat', label: 'Mensajes', path: `/${slug}/chat` },
    { id: 'settings', icon: 'settings', label: 'Ajustes', path: `/${slug}/settings` },
  ];

  const isActive = (path: string) => {
    if (path === `/${slug}` && pathname === `/${slug}`) {
      return true;
    }
    if (path !== `/${slug}` && pathname.startsWith(path)) {
      return true;
    }
    // Specific case for storage: keep it active when viewing a product
    if (path === `/${slug}/storage` && pathname.startsWith(`/${slug}/product/`)) {
      return true;
    }
    return false;
  };

  return (
    <nav className={`navbar ${isCollapsed ? '' : 'navbar--expanded'}`}>
      <div className="navbar__content">
        {/* Toggle Button at Top */}
        <button
          className="navbar__item navbar__item--toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
          suppressHydrationWarning
        >
          <Icon slot="icon" size={24} className="navbar__item-icon">
            {isCollapsed ? 'input' : 'output'}
          </Icon>
          {!isCollapsed && (
            <span className="navbar__item-label" suppressHydrationWarning>
              Contraer
            </span>
          )}
        </button>

        <div className="navbar__divider" />

        <div className="navbar__items">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`navbar__item ${isActive(item.path) ? 'navbar__item--active' : ''}`}
              aria-label={item.label}
              title={item.label}
              suppressHydrationWarning
            >
              <md-icon className="navbar__item-icon" suppressHydrationWarning>
                {item.icon}
              </md-icon>
              {!isCollapsed && (
                <span className="navbar__item-label" suppressHydrationWarning>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="navbar__divider" />

        <div className="navbar__actions">
          {/* Close Store Button */}
          <button
            className="navbar__item navbar__item--close-store"
            onClick={handleCloseStore}
            aria-label="Cerrar tienda"
            title="Cerrar tienda"
            suppressHydrationWarning
          >
            <md-icon className="navbar__item-icon" suppressHydrationWarning>
              storefront
            </md-icon>
            {!isCollapsed && (
              <span className="navbar__item-label" suppressHydrationWarning>
                Cerrar Tienda
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            className="navbar__item navbar__item--logout"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            suppressHydrationWarning
          >
            <md-icon className="navbar__item-icon" suppressHydrationWarning>
              logout
            </md-icon>
            {!isCollapsed && (
              <span className="navbar__item-label" suppressHydrationWarning>
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
