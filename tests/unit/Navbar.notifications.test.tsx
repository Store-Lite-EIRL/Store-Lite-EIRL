import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock the useNotificationsContext hook for the badge
vi.mock('@app/[slug]/(app)/context/NotificationsContext', () => ({
  useNotificationsContext: vi.fn(),
}));

// Mock the theme context hook
vi.mock('@/shared/context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '@/shared/context/ThemeContext';
import { useNotificationsContext } from '@app/[slug]/(app)/context/NotificationsContext';
import type { Mock } from 'vitest';

// Mock the permissions context
const mockCan = vi.fn();
const mockIsOwner = vi.fn();
vi.mock('../../app/[slug]/(app)/context/PermissionsContext', () => ({
  usePermissions: () => ({
    can: mockCan,
    isOwner: mockIsOwner(),
    permissions: [],
    role: 'member',
  }),
}));

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'test-business' }),
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, 'aria-label': ariaLabel, title, ...props }: any) =>
    React.createElement(
      'a',
      { href, className, 'aria-label': ariaLabel, title, ...props },
      children,
    ),
}));

import Navbar from '../../src/shared/components/navigation/Navbar';

function renderNavbar(businessId?: string) {
  return render(
    <Navbar isCollapsed={false} onToggle={vi.fn()} planName="basico" businessId={businessId} />,
  );
}

describe('Navbar notifications item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/test-business');
    mockIsOwner.mockReturnValue(false);
    (useNotificationsContext as Mock).mockReturnValue({
      unreadCount: 0,
      notifications: [],
      unreadCountByCategory: {},
      isLoading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      dismiss: vi.fn(),
      refresh: vi.fn(),
      subscribeToNewNotifications: vi.fn().mockReturnValue(vi.fn()),
    });
    (useTheme as Mock).mockReturnValue({
      theme: 'light',
      colorScheme: 'default',
      effectiveTheme: 'light',
      setTheme: vi.fn(),
      setColorScheme: vi.fn(),
    });
  });

  it('renders notifications item when user has notifications.view permission', () => {
    mockCan.mockImplementation((perm: string) => perm === 'notifications.view');

    renderNavbar();

    const notificationsLink = screen.getByLabelText('Notificaciones');
    expect(notificationsLink).toBeInTheDocument();
    expect(notificationsLink).toHaveAttribute('href', '/test-business/notifications');
  });

  it('renders notifications item when user is owner (regardless of permission)', () => {
    mockIsOwner.mockReturnValue(true);
    mockCan.mockReturnValue(false);

    renderNavbar();

    const notificationsLink = screen.getByLabelText('Notificaciones');
    expect(notificationsLink).toBeInTheDocument();
  });

  it('does NOT render notifications item when user lacks permission and is not owner', () => {
    mockIsOwner.mockReturnValue(false);
    mockCan.mockImplementation((perm: string) => perm !== 'notifications.view');

    renderNavbar();

    const notificationsLink = screen.queryByLabelText('Notificaciones');
    expect(notificationsLink).not.toBeInTheDocument();
  });

  it('positions notifications between chat and storage in navItems', () => {
    mockCan.mockReturnValue(true);

    renderNavbar();

    const links = screen.getAllByRole('link');
    const labels = links.map((l) => l.getAttribute('aria-label'));

    const chatIndex = labels.indexOf('Mensajes');
    const notificationsIndex = labels.indexOf('Notificaciones');
    const storageIndex = labels.indexOf('Almacén');

    expect(chatIndex).toBeGreaterThanOrEqual(0);
    expect(notificationsIndex).toBeGreaterThanOrEqual(0);
    expect(storageIndex).toBeGreaterThanOrEqual(0);

    // notifications should be between chat and storage
    expect(notificationsIndex).toBeGreaterThan(chatIndex);
    expect(notificationsIndex).toBeLessThan(storageIndex);
  });

  it('renders badge component near the notifications icon', () => {
    mockCan.mockReturnValue(true);
    (useNotificationsContext as Mock).mockReturnValue({
      unreadCount: 3,
      notifications: [],
      unreadCountByCategory: {},
      isLoading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      dismiss: vi.fn(),
      refresh: vi.fn(),
      subscribeToNewNotifications: vi.fn().mockReturnValue(vi.fn()),
    });

    renderNavbar('biz_123');

    const notificationsLink = screen.getByLabelText('Notificaciones');
    const badge = notificationsLink.querySelector('.navbar__badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('renders theme toggle button in Configuración and switches to dark on click', () => {
    mockCan.mockReturnValue(true);
    const mockSetTheme = vi.fn();
    (useTheme as Mock).mockReturnValue({
      theme: 'light',
      colorScheme: 'default',
      effectiveTheme: 'light',
      setTheme: mockSetTheme,
      setColorScheme: vi.fn(),
    });

    renderNavbar();

    const themeButton = screen.getByLabelText('Tema');
    expect(themeButton).toBeInTheDocument();
    expect(themeButton).toBeInstanceOf(HTMLButtonElement);

    themeButton.click();
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('renders theme toggle inside the mobile "Más" popup and switches theme', async () => {
    mockCan.mockReturnValue(true);
    const mockSetTheme = vi.fn();
    (useTheme as Mock).mockReturnValue({
      theme: 'light',
      colorScheme: 'default',
      effectiveTheme: 'light',
      setTheme: mockSetTheme,
      setColorScheme: vi.fn(),
    });

    // Simulate mobile viewport (<= 768px)
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    renderNavbar();

    const moreButton = await screen.findByLabelText('Más');
    fireEvent.click(moreButton);

    const themeButton = await screen.findByLabelText('Tema');
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });
});
