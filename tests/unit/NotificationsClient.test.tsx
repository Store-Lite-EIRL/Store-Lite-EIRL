import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock useNotifications hook BEFORE any imports that use it
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

import type { NotificationWithMeta } from '@/hooks/useNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import type { Mock } from 'vitest';
import NotificationsClient from '../../app/[slug]/notifications/NotificationsClient';

// ── Fixtures ──────────────────────────────────────────────

function createNotification(overrides: Partial<NotificationWithMeta> = {}): NotificationWithMeta {
  return {
    id: `notif-${Math.random().toString(36).slice(2, 9)}`,
    businessId: 'biz_123',
    type: 'general' as const,
    category: 'sistema' as const,
    title: 'Test Notification',
    message: 'This is a test notification message.',
    data: {},
    isRead: false,
    isDismissed: false,
    createdAt: new Date(),
    readAt: null,
    isNew: false,
    ...overrides,
  };
}

const fiveNotifications = [
  createNotification({
    id: 'n1',
    category: 'chat',
    title: 'Nuevo mensaje',
    message: 'Tienes un nuevo mensaje en el chat',
    createdAt: new Date(),
  }),
  createNotification({
    id: 'n2',
    category: 'almacen',
    title: 'Stock bajo',
    message: 'El producto X tiene bajo stock',
    createdAt: new Date(Date.now() - 86_400_000),
    isRead: true,
  }),
  createNotification({
    id: 'n3',
    category: 'plan',
    title: 'Plan actualizado',
    message: 'Tu plan ha sido actualizado',
    createdAt: new Date(Date.now() - 172_800_000),
  }),
  createNotification({
    id: 'n4',
    category: 'pedidos',
    title: 'Nuevo pedido',
    message: 'Se ha registrado un nuevo pedido',
    createdAt: new Date(Date.now() - 259_200_000),
  }),
  createNotification({
    id: 'n5',
    category: 'sistema',
    title: 'Mantenimiento',
    message: 'Mantenimiento programado',
    createdAt: new Date(Date.now() - 345_600_000),
  }),
];

function mockUseNotifications(overrides: Partial<ReturnType<typeof useNotifications>> = {}) {
  const defaults: ReturnType<typeof useNotifications> = {
    notifications: fiveNotifications,
    unreadCount: 4,
    unreadCountByCategory: { chat: 1, almacen: 0, plan: 1, pedidos: 1, sistema: 1 },
    isLoading: false,
    error: null,
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  (useNotifications as Mock).mockReturnValue(defaults);
  return defaults;
}

// ── Tests ─────────────────────────────────────────────────

describe('NotificationsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockUseNotifications({ isLoading: true, notifications: [] });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.getByText('Cargando notificaciones...')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when there are no notifications at all', () => {
      mockUseNotifications({
        notifications: [],
        unreadCount: 0,
        unreadCountByCategory: { chat: 0, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
    });

    it('shows filtered empty message when no notifications match selected category', () => {
      mockUseNotifications({
        notifications: [createNotification({ id: 'n1', category: 'chat', title: 'Solo chat' })],
        unreadCount: 1,
        unreadCountByCategory: { chat: 1, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      // Click on "Almacén" tab — should show filtered empty
      fireEvent.click(screen.getByText('Almacén'));

      expect(screen.getByText('No hay notificaciones en esta categoría.')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when error is set and no cached notifications exist', () => {
      mockUseNotifications({
        notifications: [],
        unreadCount: 0,
        error: 'Failed to fetch',
        isLoading: false,
        unreadCountByCategory: { chat: 0, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.getByText('Error al cargar las notificaciones')).toBeInTheDocument();
    });
  });

  describe('Populated state', () => {
    it('renders all notification titles when data is available', () => {
      mockUseNotifications();
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
      expect(screen.getByText('Stock bajo')).toBeInTheDocument();
      expect(screen.getByText('Plan actualizado')).toBeInTheDocument();
      expect(screen.getByText('Nuevo pedido')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });

    it('renders header with title and unread summary', () => {
      mockUseNotifications();
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText(/4 sin leer/)).toBeInTheDocument();
    });
  });

  describe('Category filter', () => {
    it('shows only matching notifications when a category tab is selected', () => {
      mockUseNotifications();
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      // Use getAllByText and pick the second match, or getByRole with name
      const chatTab = screen.getByRole('button', { name: /Chat/ });
      fireEvent.click(chatTab);

      expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
      expect(screen.queryByText('Stock bajo')).not.toBeInTheDocument();
      expect(screen.queryByText('Plan actualizado')).not.toBeInTheDocument();
      expect(screen.queryByText('Nuevo pedido')).not.toBeInTheDocument();
      expect(screen.queryByText('Mantenimiento')).not.toBeInTheDocument();
    });

    it('shows all notifications when "Todas" tab is active', () => {
      mockUseNotifications();
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      // "Todas" should be the default — verify all 5 are visible
      expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
      expect(screen.getByText('Stock bajo')).toBeInTheDocument();
      expect(screen.getByText('Plan actualizado')).toBeInTheDocument();
      expect(screen.getByText('Nuevo pedido')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });
  });

  describe('Mark as read', () => {
    it('calls markAsRead with the notification id when checkbox is clicked', () => {
      const mockMarkAsRead = vi.fn().mockResolvedValue(undefined);
      mockUseNotifications({
        markAsRead: mockMarkAsRead,
        notifications: [
          createNotification({
            id: 'n1',
            category: 'chat',
            title: 'Test',
            isRead: false,
          }),
        ],
        unreadCount: 1,
        unreadCountByCategory: { chat: 1, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      const { container } = render(
        <NotificationsClient businessId="biz_123" businessName="Test Business" />,
      );

      // md-checkbox is a web component — fire change event directly
      const checkbox = container.querySelector('md-checkbox');
      expect(checkbox).toBeInTheDocument();
      fireEvent.change(checkbox!, { target: { checked: true } });

      expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
      expect(mockMarkAsRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mark all as read', () => {
    it('calls markAllAsRead when "Marcar todas" button is clicked', () => {
      const mockMarkAllAsRead = vi.fn().mockResolvedValue(undefined);
      mockUseNotifications({
        markAllAsRead: mockMarkAllAsRead,
        unreadCount: 4,
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      fireEvent.click(screen.getByText('Marcar todas'));

      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('does NOT show "Marcar todas" button when unreadCount is 0', () => {
      mockUseNotifications({
        unreadCount: 0,
        unreadCountByCategory: { chat: 0, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      expect(screen.queryByText('Marcar todas')).not.toBeInTheDocument();
    });
  });

  describe('Dismiss', () => {
    it('calls dismiss with the notification id when dismiss button is clicked', () => {
      const mockDismiss = vi.fn().mockResolvedValue(undefined);
      mockUseNotifications({
        dismiss: mockDismiss,
        notifications: [
          createNotification({
            id: 'n1',
            category: 'chat',
            title: 'Dismissable',
            isRead: false,
          }),
        ],
        unreadCount: 1,
        unreadCountByCategory: { chat: 1, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
      });
      render(<NotificationsClient businessId="biz_123" businessName="Test Business" />);

      // Dismiss button should have aria-label "Descartar notificación"
      const dismissBtn = screen.getByLabelText('Descartar notificación');
      fireEvent.click(dismissBtn);

      expect(mockDismiss).toHaveBeenCalledWith('n1');
      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Viewport', () => {
    it('renders the notification list without a max-height cap', () => {
      mockUseNotifications();
      const { container } = render(
        <NotificationsClient businessId="biz_123" businessName="Test Business" />,
      );

      // The list container should be rendered inside the component — no inline max-height
      const listItems = container.querySelectorAll('[role="listitem"]');
      expect(listItems.length).toBeGreaterThan(0);

      // Verify the list container does not have max-height set inline
      const listElements = container.querySelectorAll('ul, [role="list"]');
      for (const el of listElements) {
        const htmlEl = el as HTMLElement;
        expect(htmlEl.style.maxHeight).not.toBe('55vh');
      }
    });
  });
});
