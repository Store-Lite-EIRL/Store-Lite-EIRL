'use client';

import { clearBusinessSessionData, STORAGE_KEY } from '@/hooks/useBusinessSession';
import { createClient } from '@/lib/supabase/client';
import { getBusinessPath } from '@/shared/utils/url';
import '@/styles/components/navbar.css';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { usePermissions } from '../../../../app/[slug]/context/PermissionsContext';
import { Icon } from '../ui';

interface NavbarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  planName?: string;
}

export default function Navbar({ isCollapsed, onToggle, planName = 'Básico' }: NavbarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { can, isOwner } = usePermissions();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (slug) {
      localStorage.setItem('selectedBusinessSlug', slug);
      // Also set the active business session
      const session = {
        slug,
        openedAt: Date.now(),
        tabId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [slug]);

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      router.push('/login');
    }
  };

  const handleCloseStore = () => {
    clearBusinessSessionData();
    router.push('/list-business');
  };

  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', path: getBusinessPath(slug) },
    { id: 'chat', icon: 'chat', label: 'Mensajes', path: getBusinessPath(slug, '/chat') },
    { id: 'storage', icon: 'package_2', label: 'Almacén', path: getBusinessPath(slug, '/storage') },
    {
      id: 'dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      path: getBusinessPath(slug, '/dashboard'),
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Ajustes',
      path: getBusinessPath(slug, '/settings'),
    },
  ];

  const isActive = (path: string) => {
    if (path === `/${slug}` && pathname === `/${slug}`) {
      return true;
    }
    if (path !== `/${slug}` && pathname.startsWith(path)) {
      return true;
    }
    if (path === `/${slug}/storage` && pathname.startsWith(`/${slug}/product/`)) {
      return true;
    }
    return false;
  };

  return (
    <nav className={`navbar ${isCollapsed ? 'navbar--collapsed' : 'navbar--expanded'}`}>
      <div className="navbar__content">
        <div className="navbar__header-actions">
          {!isCollapsed && (
            <div className="navbar__plan-badge">
              <span className="navbar__plan-label">{planName}</span>
            </div>
          )}
          <button
            className={`navbar__item--toggle-small ${isCollapsed ? 'collapsed' : ''}`}
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
            title={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            <Icon size={isCollapsed ? 24 : 18}>
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </Icon>
          </button>
        </div>

        <div className="navbar__divider" />

        <div className="navbar__items">
          {navItems
            .filter((item) => {
              // 1. Plan-based filtering
              if (item.id === 'dashboard' && planName === 'basico') return false;

              // 2. Permission-based filtering
              if (isOwner) return true;

              if (item.id === 'chat') return can('chat.view');
              if (item.id === 'storage') return can('products.view') || can('categories.view');
              if (item.id === 'dashboard') return can('dashboard.view');

              return true; // home, settings always visible
            })
            .map((item) => (
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
          <div className="navbar__account-actions" ref={dropdownRef}>
            <button
              className="navbar__item navbar__item--account"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Salir"
            >
              <Icon size={24} className="navbar__item-icon">
                login
              </Icon>
              {!isCollapsed && (
                <span className="navbar__item-label" suppressHydrationWarning>
                  Salir
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="navbar__dropdown-menu">
                <button onClick={handleCloseStore} className="navbar__dropdown-item">
                  <Icon size={20}>store</Icon>
                  <span className="navbar__dropdown-label">Cerrar tienda</span>
                </button>
                <button onClick={handleLogout} className="navbar__dropdown-item">
                  <Icon size={20}>logout</Icon>
                  <span className="navbar__dropdown-label">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
