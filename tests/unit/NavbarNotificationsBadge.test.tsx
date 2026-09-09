import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavbarNotificationsBadge } from '../../src/shared/components/navigation/NavbarNotificationsBadge';

// Mock useNotificationsContext hook
vi.mock('@app/[slug]/(app)/context/NotificationsContext', () => ({
  useNotificationsContext: vi.fn(),
}));

import { useNotificationsContext } from '@app/[slug]/(app)/context/NotificationsContext';
import type { Mock } from 'vitest';

describe('NavbarNotificationsBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('badge visibility', () => {
    it('renders badge with count when unreadCount > 0', () => {
      (useNotificationsContext as Mock).mockReturnValue({
        unreadCount: 5,
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('does NOT render badge when unreadCount is 0', () => {
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('renders no DOM element at all when unreadCount is 0', () => {
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

      const { container } = render(<NavbarNotificationsBadge />);
      // The wrapper should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe('badge truncation', () => {
    it('shows "99+" when unreadCount exceeds 99', () => {
      (useNotificationsContext as Mock).mockReturnValue({
        unreadCount: 150,
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99+');
    });

    it('shows "99+" when unreadCount is exactly 100', () => {
      (useNotificationsContext as Mock).mockReturnValue({
        unreadCount: 100,
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('shows exact count when unreadCount is 99', () => {
      (useNotificationsContext as Mock).mockReturnValue({
        unreadCount: 99,
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveTextContent('99');
    });
  });

  describe('accessibility', () => {
    it('has aria-label with unread count', () => {
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

      const { container } = render(<NavbarNotificationsBadge />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveAttribute('aria-label', '3 notificaciones sin leer');
    });
  });
});
