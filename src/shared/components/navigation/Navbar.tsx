/* eslint-disable max-lines-per-function */
'use client';

import { Menu, MenuItem } from '@/shared/components/ui/surfaces/Menu';
import { getSectorIcon } from '@/shared/utils/business';
import '@/styles/components/navbar.css';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  // Menu States for Mobile
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    setUserMenuOpen(false);
  };

  const handleCloseStore = () => {
    if (onCloseStore) {
      onCloseStore();
    } else {
      document.cookie = 'selected_business_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('selectedBusinessSlug');
      router.push('/list-business');
    }
    setUserMenuOpen(false);
  };

  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', path: `/${slug}` },
    { id: 'storage', icon: 'package_2', label: 'Almacén', path: `/${slug}/storage` },
    { id: 'chat', icon: 'chat', label: 'Mensajes', path: `/${slug}/chat` },
    { id: 'settings', icon: 'settings', label: 'Ajustes', path: `/${slug}/settings` },
  ];

  const adminItems = [
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

  const isAdminActive = () => {
    return adminItems.some((item) => isActive(item.path));
  };

  return (
    <nav className={`navbar ${isCollapsed ? '' : 'navbar--expanded'}`}>
      <div className="navbar__header">
        <div className="navbar__logo">
          {businessData?.coverImageUrl ? (
            <img
              src={`${businessData.coverImageUrl}?t=${timestamp}`}
              alt={businessData.name}
              className="navbar__logo-img"
            />
          ) : (
            <md-icon suppressHydrationWarning>{getSectorIcon(businessData?.storeType)}</md-icon>
          )}
        </div>

        {!isCollapsed && (
          <div className="navbar__label-container">
            <span className="navbar__label">
              {businessData?.name ||
                slug?.split('-')[0].charAt(0).toUpperCase() + slug?.split('-')[0].slice(1) ||
                'Store'}
            </span>
            <p className="navbar__powered-by">Powered for Store-Lite</p>
          </div>
        )}

        <button
          className="navbar__toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
          suppressHydrationWarning
        >
          <md-icon className="navbar__toggle-icon" suppressHydrationWarning>
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </md-icon>
        </button>
      </div>

      <div className="navbar__center">
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
            <span className="navbar__item-label" suppressHydrationWarning>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="navbar__bottom">
        {/* Close Store Button */}
        <button
          className="navbar__item navbar__item--close-store"
          onClick={handleCloseStore}
          aria-label="Cerrar tienda"
          title="Cerrar tienda"
          suppressHydrationWarning
          style={{ marginBottom: '0.5rem' }}
        >
          <md-icon className="navbar__item-icon" suppressHydrationWarning>
            storefront
          </md-icon>
          <span className="navbar__item-label" suppressHydrationWarning>
            Cerrar Tienda
          </span>
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
          <span className="navbar__item-label" suppressHydrationWarning>
            Cerrar Sesión
          </span>
        </button>
      </div>

      {/* Mobile Navigation (<= 425px) */}
      <div className="navbar__mobile">
        {/* 1. Inicio */}
        <Link
          href={`/${slug}`}
          className={`navbar__item ${isActive('/' + slug) ? 'navbar__item--active' : ''}`}
          aria-label="Inicio"
          suppressHydrationWarning
        >
          <md-icon className="navbar__item-icon" suppressHydrationWarning>
            home
          </md-icon>
          <span className="navbar__item-label" suppressHydrationWarning>
            Inicio
          </span>
        </Link>

        {/* 2. Administración (Menu) */}
        <div className="navbar__menu-container">
          <button
            className={`navbar__item ${isAdminActive() ? 'navbar__item--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setAdminMenuOpen(!adminMenuOpen);
            }}
            id="admin-menu-trigger"
            aria-label="Administración"
            suppressHydrationWarning
          >
            <md-icon className="navbar__item-icon" suppressHydrationWarning>
              business
            </md-icon>
            <span className="navbar__item-label" suppressHydrationWarning>
              Admin
            </span>
          </button>
          <Menu
            anchor="admin-menu-trigger"
            open={adminMenuOpen}
            anchor-corner="start-start"
            menu-corner="end-start"
            positioning="fixed"
            onClosed={() => setAdminMenuOpen(false)}
          >
            {adminItems.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  router.push(item.path);
                  setAdminMenuOpen(false);
                }}
              >
                <md-icon slot="start">{item.icon}</md-icon>
                <div slot="headline">{item.label}</div>
              </MenuItem>
            ))}
          </Menu>
        </div>

        {/* 3. Usuario (Menu) */}
        <div className="navbar__menu-container">
          <button
            className="navbar__item"
            onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen(!userMenuOpen);
            }}
            id="user-menu-trigger"
            aria-label="Usuario"
            suppressHydrationWarning
          >
            <md-icon className="navbar__item-icon" suppressHydrationWarning>
              account_circle
            </md-icon>
            <span className="navbar__item-label" suppressHydrationWarning>
              Usuario
            </span>
          </button>
          <Menu
            anchor="user-menu-trigger"
            open={userMenuOpen}
            anchor-corner="start-end"
            menu-corner="end-end"
            positioning="fixed"
            onClosed={() => setUserMenuOpen(false)}
          >
            <MenuItem onClick={handleCloseStore}>
              <md-icon slot="start">storefront</md-icon>
              <div slot="headline">Cerrar Tienda</div>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <md-icon slot="start">logout</md-icon>
              <div slot="headline">Cerrar Sesión</div>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
