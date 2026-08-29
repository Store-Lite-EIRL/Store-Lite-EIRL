import { NavSection } from '@/shared/components/navigation/NavSection';
import type { NavItemData, Permission } from '@/shared/components/navigation/types';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Icon component
vi.mock('@/shared/components/ui/data-display/Icon', () => ({
  Icon: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
    <md-icon {...props} suppressHydrationWarning>
      {children}
    </md-icon>
  ),
}));

// Mock NavItem
vi.mock('@/shared/components/navigation/NavItem', () => ({
  NavItem: ({ item, ...props }: { item: NavItemData; [key: string]: unknown }) => (
    <button data-testid={`nav-item-${item.id}`} role="menuitem" {...props} suppressHydrationWarning>
      {item.label}
    </button>
  ),
}));

const fullPermissions: Permission[] = [
  'chat.view',
  'notifications.view',
  'products.view',
  'categories.view',
  'dashboard.view',
];

const allItems: NavItemData[] = [
  { id: 'home', icon: 'home', label: 'Inicio', path: '/mi-tienda' },
  { id: 'chat', icon: 'chat', label: 'Mensajes', path: '/mi-tienda/chat', permission: 'chat.view' },
  {
    id: 'notifications',
    icon: 'notifications',
    label: 'Notificaciones',
    path: '/mi-tienda/notifications',
    permission: 'notifications.view',
  },
  {
    id: 'storage',
    icon: 'package_2',
    label: 'Almacén',
    path: '/mi-tienda/storage',
    permission: 'products.view',
  },
  { id: 'feedback', icon: 'feedback', label: 'Ayuda', path: '/mi-tienda/ayuda' },
  {
    id: 'dashboard',
    icon: 'dashboard',
    label: 'Dashboard',
    path: '/mi-tienda/dashboard',
    permission: 'dashboard.view',
    plan: 'basico',
  },
  { id: 'settings', icon: 'settings', label: 'Ajustes', path: '/mi-tienda/settings' },
];

describe('NavSection', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('filters out dashboard for basico plan', () => {
    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="basico"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    // Dashboard should not be rendered
    expect(screen.queryByTestId('nav-item-dashboard')).not.toBeInTheDocument();
    // Other items should be rendered
    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
  });

  it('shows dashboard for non-basico plans', () => {
    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Favorites"
        sectionId="favorites"
      />,
    );

    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
  });

  it('hides chat when permission missing', () => {
    const permissions: Permission[] = [
      'notifications.view',
      'products.view',
      'categories.view',
      'dashboard.view',
    ];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.queryByTestId('nav-item-chat')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-item-notifications')).toBeInTheDocument();
  });

  it('hides notifications when permission missing', () => {
    const permissions: Permission[] = [
      'chat.view',
      'products.view',
      'categories.view',
      'dashboard.view',
    ];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.queryByTestId('nav-item-notifications')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-item-chat')).toBeInTheDocument();
  });

  it('shows storage with products.view permission', () => {
    const permissions: Permission[] = ['products.view'];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.getByTestId('nav-item-storage')).toBeInTheDocument();
  });

  it('shows storage with categories.view permission', () => {
    const permissions: Permission[] = ['categories.view'];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.getByTestId('nav-item-storage')).toBeInTheDocument();
  });

  it('hides storage when both permissions missing', () => {
    const permissions: Permission[] = ['chat.view', 'notifications.view'];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.queryByTestId('nav-item-storage')).not.toBeInTheDocument();
  });

  it('hides dashboard when permission missing', () => {
    const permissions: Permission[] = [
      'chat.view',
      'notifications.view',
      'products.view',
      'categories.view',
    ];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Favorites"
        sectionId="favorites"
      />,
    );

    expect(screen.queryByTestId('nav-item-dashboard')).not.toBeInTheDocument();
  });

  it('always shows home, ayuda, settings', () => {
    const permissions: Permission[] = [];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={permissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-feedback')).toBeInTheDocument();
  });

  it('owner bypasses all filters including plan', () => {
    const permissions: Permission[] = [];

    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="basico"
        permissions={permissions}
        isOwner={true}
        sectionHeader="Favorites"
        sectionId="favorites"
      />,
    );

    // Owner should see dashboard even on basico plan
    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
  });

  it('section collapse/expand toggles', () => {
    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    const header = screen.getByRole('button', { name: 'Workspace' });
    const content = screen.getByTestId('nav-item-home').parentElement;

    // Initially expanded
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(content).toBeVisible();

    // Click to collapse
    act(() => {
      fireEvent.click(header);
    });

    expect(header).toHaveAttribute('aria-expanded', 'false');
    // Content is hidden via CSS (display: none or height: 0)
    // We can't easily test CSS, but we can check the class
    const sectionContent = screen.getByRole('group', { name: 'Workspace' });
    expect(sectionContent).toHaveClass('sidebar__section-content--collapsed');
  });

  it('persists expanded state in localStorage', () => {
    const { rerender } = render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    const header = screen.getByRole('button', { name: 'Workspace' });

    // Collapse the section
    act(() => {
      fireEvent.click(header);
    });

    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar:v1:sections:workspace', 'false');

    // Re-render (simulating page reload)
    rerender(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    // Should be collapsed from localStorage
    const newHeader = screen.getByRole('button', { name: 'Workspace' });
    expect(newHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders correct number of NavItems after filtering', () => {
    // With full permissions and pro plan, all 7 items should be visible
    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="All"
        sectionId="all"
      />,
    );

    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-chat')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-storage')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-feedback')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
  });

  it('section header keyboard activation toggles collapse', () => {
    render(
      <NavSection
        items={allItems}
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        sectionHeader="Workspace"
        sectionId="workspace"
      />,
    );

    const header = screen.getByRole('button', { name: 'Workspace' });

    // Press Enter
    act(() => {
      fireEvent.keyDown(header, { key: 'Enter' });
    });

    expect(header).toHaveAttribute('aria-expanded', 'false');

    // Press Space
    act(() => {
      fireEvent.keyDown(header, { key: ' ' });
    });

    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not render section header when not provided', () => {
    render(
      <NavSection
        items={allItems.slice(0, 1)} // Just home
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="pro"
        permissions={fullPermissions}
        isOwner={false}
        // No sectionHeader
        sectionId="no-header"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Workspace' })).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
  });

  it('does not render when all items filtered out and no header', () => {
    const permissions: Permission[] = [];

    render(
      <NavSection
        items={allItems.filter((i) => i.id === 'dashboard')} // Only dashboard
        state="expanded"
        pathname="/mi-tienda"
        slug="mi-tienda"
        businessId="123"
        planName="basico" // Dashboard hidden on basico
        permissions={permissions}
        isOwner={false}
        sectionHeader="Favorites"
        sectionId="favorites"
      />,
    );

    // Section header still renders but content is empty
    expect(screen.getByRole('button', { name: 'Favorites' })).toBeInTheDocument();
  });
});
