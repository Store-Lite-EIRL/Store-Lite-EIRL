'use client';

import { Icon } from '@/shared/components/ui';
import styles from '../settings.module.css';

export type Section =
  | 'business'
  | 'appearance'
  | 'storefront'
  | 'plan'
  | 'team'
  | 'legal'
  | 'complaints'
  | 'seo'
  | 'payments'
  | 'social';

export interface NavItem {
  id: Section;
  label: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Información del Negocio',
    items: [
      { id: 'business', label: 'Mi Negocio', icon: 'store' },
      { id: 'social', label: 'Redes Sociales', icon: 'share' },
      { id: 'legal', label: 'Legal', icon: 'gavel' },
      { id: 'complaints', label: 'Libro de Reclamaciones', icon: 'contact_support' },
    ],
  },
  {
    label: 'Personalización',
    items: [
      { id: 'appearance', label: 'Apariencia', icon: 'palette' },
      { id: 'storefront', label: 'Storefront', icon: 'view_quilt' },
    ],
  },
  {
    label: 'Crecimiento',
    items: [
      { id: 'seo', label: 'SEO y Ubicación', icon: 'travel_explore' },
      { id: 'payments', label: 'Pagos', icon: 'payments' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { id: 'team', label: 'Equipo', icon: 'group' },
      { id: 'plan', label: 'Plan y Límites', icon: 'workspace_premium' },
    ],
  },
];

interface AccessibleNavItem extends NavItem {
  hasAccess: boolean;
}

interface SettingsNavProps {
  items: AccessibleNavItem[];
  active: Section;
  onChange: (id: Section) => void;
}

export function SettingsNav({ items, active, onChange }: SettingsNavProps) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarGroupLabel}>Ajustes</p>
      </div>
      {NAV_GROUPS.map((group) => {
        const groupItems = group.items.filter((gi) => items.some((i) => i.id === gi.id));
        if (groupItems.length === 0) return null;

        return (
          <div key={group.label} className={styles.sidebarGroup}>
            <p className={styles.sidebarGroupLabel}>{group.label}</p>
            <div className={styles.sidebarNav}>
              {groupItems.map((item) => {
                const accessItem = items.find((i) => i.id === item.id)!;
                const isActive = active === item.id && accessItem.hasAccess;
                return (
                  <button
                    key={item.id}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => accessItem.hasAccess && onChange(item.id)}
                    disabled={!accessItem.hasAccess}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      opacity: accessItem.hasAccess ? 1 : 0.6,
                      cursor: accessItem.hasAccess ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Icon size={20}>{accessItem.hasAccess ? item.icon : 'lock'}</Icon>
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
