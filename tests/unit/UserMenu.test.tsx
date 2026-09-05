import { UserMenu } from '@/shared/components/navigation/UserMenu';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
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

describe('UserMenu', () => {
  const onCloseStore = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders trigger button with avatar and label', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('sidebar__user-trigger');
    expect(screen.getByText('account_circle')).toBeInTheDocument(); // Avatar icon
    expect(screen.getByText('Cuenta')).toBeInTheDocument(); // Label
  });

  it('hides label in collapsed state', () => {
    render(<UserMenu state="collapsed" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });
    expect(trigger).toHaveClass('sidebar__user-trigger--collapsed');
    expect(screen.queryByText('Cuenta')).not.toBeInTheDocument();
    expect(screen.getByText('account_circle')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });
    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole('menu', { name: 'Opciones de cuenta' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes dropdown on second click', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole('menu', { name: 'Opciones de cuenta' })).toBeInTheDocument();

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders dropdown items with correct icons and labels', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    const items = menu.querySelectorAll('button[role="menuitem"]');
    expect(items).toHaveLength(2);

    // First item is "Cerrar tienda" (store icon)
    expect(items[0].querySelector('md-icon')).toHaveTextContent('store');
    expect(items[0].querySelector('.sidebar__dropdown-label')).toHaveTextContent('Cerrar tienda');

    // Second item is "Cerrar sesión" (logout icon)
    expect(items[1].querySelector('md-icon')).toHaveTextContent('logout');
    expect(items[1].querySelector('.sidebar__dropdown-label')).toHaveTextContent('Cerrar sesión');
  });

  it('closes dropdown on Escape key', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole('menu', { name: 'Opciones de cuenta' })).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    });

    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes dropdown on click outside', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole('menu', { name: 'Opciones de cuenta' })).toBeInTheDocument();

    // Click outside (on body)
    act(() => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not close when clicking inside dropdown', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    const firstItem = menu.querySelector('button[role="menuitem"]');

    act(() => {
      fireEvent.mouseDown(firstItem!);
    });

    // Menu should still be open
    expect(screen.getByRole('menu', { name: 'Opciones de cuenta' })).toBeInTheDocument();
  });

  it('calls onCloseStore when "Cerrar tienda" is clicked', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const closeStoreBtn = screen.getByRole('menuitem', { name: 'Cerrar tienda' });

    act(() => {
      fireEvent.click(closeStoreBtn);
    });

    expect(onCloseStore).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();
  });

  it('calls onLogout when "Cerrar sesión" is clicked', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const logoutBtn = screen.getByRole('menuitem', { name: 'Cerrar sesión' });

    act(() => {
      fireEvent.click(logoutBtn);
    });

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onCloseStore).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu', { name: 'Opciones de cuenta' })).not.toBeInTheDocument();
  });

  it('renders correct icons in dropdown items', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    const items = menu.querySelectorAll('button[role="menuitem"]');

    // First item: store icon
    expect(items[0].querySelector('md-icon')).toHaveTextContent('store');
    // Second item: logout icon
    expect(items[1].querySelector('md-icon')).toHaveTextContent('logout');
  });

  it('chevron icon changes based on open state', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });
    const chevron = trigger.querySelector('md-icon:last-child');

    // Initially closed - should show expand_more
    expect(chevron).toHaveTextContent('expand_more');

    act(() => {
      fireEvent.click(trigger);
    });

    // Now open - should show expand_less
    expect(trigger.querySelector('md-icon:last-child')).toHaveTextContent('expand_less');
  });

  it('applies collapsed class to dropdown in collapsed state', () => {
    render(<UserMenu state="collapsed" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    expect(menu).toHaveClass('sidebar__user-dropdown--collapsed');
  });

  it('applies mobile class to dropdown in mobile-open state', () => {
    render(<UserMenu state="mobile-open" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    expect(menu).toHaveClass('sidebar__user-dropdown--mobile');
  });

  it('restores focus to trigger on close', () => {
    render(<UserMenu state="expanded" onCloseStore={onCloseStore} onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });

    act(() => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole('menu', { name: 'Opciones de cuenta' });
    const firstItem = menu.querySelector('button[role="menuitem"]');
    firstItem!.focus();

    act(() => {
      fireEvent.keyDown(firstItem!, { key: 'Escape' });
    });

    // Focus should return to trigger (use waitFor for async focus restoration)
    waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
