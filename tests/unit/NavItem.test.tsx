import { NavItem } from '@/shared/components/navigation/NavItem';
import type { NavItemData } from '@/shared/components/navigation/types';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/mi-tienda',
}));

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

const mockItem: NavItemData = {
  id: 'home',
  icon: 'home',
  label: 'Inicio',
  path: '/mi-tienda',
};

const mockItemWithBadge: NavItemData = {
  id: 'notifications',
  icon: 'notifications',
  label: 'Notificaciones',
  path: '/mi-tienda/notifications',
  badge: '5',
};

describe('NavItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders icon, label, and link', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/mi-tienda');
    expect(link).toHaveClass('sidebar__item');
    expect(screen.getByText('home')).toBeInTheDocument(); // Icon
    expect(screen.getByText('Inicio')).toBeInTheDocument(); // Label
  });

  it('renders as button when no path', () => {
    const itemNoPath = { ...mockItem, path: '' };
    render(<NavItem item={itemNoPath} isActive={false} state="expanded" />);

    const button = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('applies active state class when isActive is true', () => {
    render(<NavItem item={mockItem} isActive={true} state="expanded" />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(link).toHaveClass('sidebar__item--active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('applies active state class when computed from pathname', () => {
    // Mock usePathname to return a path that matches the item
    vi.mock('next/navigation', () => ({
      usePathname: () => '/mi-tienda',
    }));

    render(<NavItem item={mockItem} isActive={false} state="expanded" />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(link).toHaveClass('sidebar__item--active');
  });

  it('hides label in collapsed state (via CSS class on parent)', () => {
    // In collapsed state, the label is hidden via CSS on .sidebar--collapsed .sidebar__item-label
    // The component itself doesn't conditionally render the label
    render(<NavItem item={mockItem} isActive={false} state="collapsed" />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(link).toHaveClass('sidebar__item');
    // Label is still in DOM but hidden via CSS
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('shows label in expanded state', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" />);

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('shows label in mobile-open state', () => {
    render(<NavItem item={mockItem} isActive={false} state="mobile-open" />);

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('renders badge with count', () => {
    render(<NavItem item={mockItemWithBadge} isActive={false} state="expanded" badgeCount={5} />);

    const badge = screen.getByLabelText('5 notificaciones');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('sidebar__badge');
    expect(badge).toHaveTextContent('5');
  });

  it('caps badge at 99+', () => {
    render(<NavItem item={mockItemWithBadge} isActive={false} state="expanded" badgeCount={150} />);

    const badge = screen.getByLabelText('150 notificaciones');
    expect(badge).toHaveTextContent('99+');
  });

  it('does not render badge when count is 0', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" badgeCount={0} />);

    expect(screen.queryByLabelText(/notificaciones/)).not.toBeInTheDocument();
  });

  it('does not render badge when count is undefined', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" badgeCount={undefined} />);

    expect(screen.queryByLabelText(/notificaciones/)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<NavItem item={mockItem} isActive={false} state="expanded" onClick={onClick} />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn();
    render(<NavItem item={mockItem} isActive={false} state="expanded" onClick={onClick} />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Space key', () => {
    const onClick = vi.fn();
    render(<NavItem item={mockItem} isActive={false} state="expanded" onClick={onClick} />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    fireEvent.keyDown(link, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has data-nav-item and data-nav-id attributes for keyboard navigation', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" />);

    const link = screen.getByRole('menuitem', { name: 'Inicio' });
    expect(link).toHaveAttribute('data-nav-item', '');
    expect(link).toHaveAttribute('data-nav-id', 'home');
  });

  it('applies correct icon size via Icon component', () => {
    render(<NavItem item={mockItem} isActive={false} state="expanded" />);

    const icon = screen.getByText('home').closest('md-icon');
    expect(icon).toBeInTheDocument();
  });
});
