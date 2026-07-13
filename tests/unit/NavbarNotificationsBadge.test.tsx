import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavbarNotificationsBadge } from '../../src/shared/components/navigation/NavbarNotificationsBadge';

// Mock useNotifications hook
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

import { useNotifications } from '@/hooks/useNotifications';
import type { Mock } from 'vitest';

describe('NavbarNotificationsBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('badge visibility', () => {
    it('renders badge with count when unreadCount > 0', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 5,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('does NOT render badge when unreadCount is 0', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 0,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('renders no DOM element at all when unreadCount is 0', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 0,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      // The wrapper should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe('badge truncation', () => {
    it('shows "99+" when unreadCount exceeds 99', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 150,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99+');
    });

    it('shows "99+" when unreadCount is exactly 100', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 100,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('shows exact count when unreadCount is 99', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 99,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveTextContent('99');
    });
  });

  describe('accessibility', () => {
    it('has aria-label with unread count', () => {
      (useNotifications as Mock).mockReturnValue({
        unreadCount: 3,
        notifications: [],
        unreadCountByCategory: {},
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        dismiss: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<NavbarNotificationsBadge businessId="biz_123" />);
      const badge = container.querySelector('.navbar__badge');
      expect(badge).toHaveAttribute('aria-label', '3 notificaciones sin leer');
    });
  });
});
