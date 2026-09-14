import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock useNotifications — the internal implementation used by the provider
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

import { useNotifications } from '@/hooks/useNotifications';
import type { Mock } from 'vitest';

// Import AFTER mocks
import type { Notification } from '@/types/notifications';
import type { NotificationsContextValue } from '../../app/[slug]/(app)/context/NotificationsContext';
import {
  NotificationsProvider,
  useNotificationsContext,
} from '../../app/[slug]/(app)/context/NotificationsContext';

// ── Helpers ──────────────────────────────────────────────

type SubscribeFn = NotificationsContextValue['subscribeToNewNotifications'];

function createDefaultMockReturn() {
  return {
    notifications: [],
    unreadCount: 0,
    unreadCountByCategory: { chat: 0, almacen: 0, plan: 0, pedidos: 0, sistema: 0 },
    isLoading: false,
    error: null,
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
}

/** Stub child that reads from context and exposes values via a render prop. */
function ContextReader({ onValue }: { onValue: (value: NotificationsContextValue) => void }) {
  const value = useNotificationsContext();
  onValue(value);
  return null;
}

/**
 * Renders the provider with a default mock return and an optional child.
 * Captures the onNewNotification callback passed to useNotifications so tests
 * can dispatch real notification events through the provider's pub/sub path.
 */
function renderProvider({
  businessId = 'biz_1',
  children,
  mockReturn,
}: {
  businessId?: string;
  children?: ReactNode;
  mockReturn?: ReturnType<typeof useNotifications>;
} = {}) {
  const defaults = createDefaultMockReturn();
  const merged = { ...defaults, ...mockReturn };
  let capturedOnNewNotification: ((notification: Notification) => void) | undefined;

  (useNotifications as Mock).mockImplementation(
    (opts: { onNewNotification?: (notification: Notification) => void }) => {
      capturedOnNewNotification = opts.onNewNotification;
      return merged;
    },
  );

  return {
    ...render(
      <NotificationsProvider businessId={businessId}>{children ?? null}</NotificationsProvider>,
    ),
    mockReturn: merged,
    /** Fires a new notification through the provider's internal onNewNotification. */
    dispatchNewNotification: (notification: Notification) => {
      capturedOnNewNotification?.(notification);
    },
  };
}

// ── Tests ────────────────────────────────────────────────

describe('NotificationsContext', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Context shape', () => {
    it('exposes all 9 state fields from useNotifications', () => {
      const received: Record<string, unknown> = {};
      renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              received.notifications = v.notifications;
              received.unreadCount = v.unreadCount;
              received.unreadCountByCategory = v.unreadCountByCategory;
              received.isLoading = v.isLoading;
              received.error = v.error;
              received.markAsRead = v.markAsRead;
              received.markAllAsRead = v.markAllAsRead;
              received.dismiss = v.dismiss;
              received.refresh = v.refresh;
            }}
          />
        ),
      });

      expect(received.notifications).toEqual([]);
      expect(received.unreadCount).toBe(0);
      expect(received.isLoading).toBe(false);
      expect(received.error).toBeNull();
      expect(typeof received.markAsRead).toBe('function');
      expect(typeof received.markAllAsRead).toBe('function');
      expect(typeof received.dismiss).toBe('function');
      expect(typeof received.refresh).toBe('function');
    });

    it('exposes subscribeToNewNotifications as a function', () => {
      let subscribeFn: SubscribeFn | undefined;
      renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              subscribeFn = v.subscribeToNewNotifications;
            }}
          />
        ),
      });

      expect(typeof subscribeFn).toBe('function');
    });
  });

  describe('Dedup: single hook call per provider', () => {
    it('calls useNotifications exactly once regardless of consumer count', () => {
      renderProvider({
        children: (
          <>
            <ContextReader onValue={() => {}} />
            <ContextReader onValue={() => {}} />
            <ContextReader onValue={() => {}} />
          </>
        ),
      });

      expect(useNotifications).toHaveBeenCalledTimes(1);
    });

    it('passes businessId to useNotifications', () => {
      renderProvider({ businessId: 'biz_42' });
      expect(useNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'biz_42' }),
      );
    });
  });

  describe('Subscriber add/remove', () => {
    it('subscribe returns an unsubscribe function', () => {
      const subscriber = vi.fn();
      let subscribeFn: SubscribeFn | undefined;

      renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              subscribeFn = v.subscribeToNewNotifications;
            }}
          />
        ),
      });

      const unsubscribe = subscribeFn!(subscriber);
      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    it('unsubscribe returns a callable function', () => {
      const subscriber = vi.fn();
      let subscribeFn: SubscribeFn | undefined;

      renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              subscribeFn = v.subscribeToNewNotifications;
            }}
          />
        ),
      });

      const unsubscribe = subscribeFn!(subscriber);
      // Unsubscribe should be idempotent — calling it twice should not throw
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Subscriber dispatch', () => {
    it('dispatches a new notification to every subscribed listener', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      let subscribeFn: SubscribeFn | undefined;

      const { dispatchNewNotification } = renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              subscribeFn = v.subscribeToNewNotifications;
            }}
          />
        ),
      });

      subscribeFn!(subscriber1);
      subscribeFn!(subscriber2);

      const notification = {
        id: 'n1',
        businessId: 'biz_1',
        type: 'new_order',
        category: 'pedidos',
        title: 'Nuevo pedido',
        message: 'Pedido #1',
        data: {},
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
        readAt: null,
      } as Notification;

      dispatchNewNotification(notification);

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber1).toHaveBeenCalledWith(notification);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledWith(notification);
    });

    it('stops dispatching to a subscriber after unsubscribe (removal from registry)', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      let subscribeFn: SubscribeFn | undefined;

      const { dispatchNewNotification } = renderProvider({
        children: (
          <ContextReader
            onValue={(v) => {
              subscribeFn = v.subscribeToNewNotifications;
            }}
          />
        ),
      });

      const unsubscribe = subscribeFn!(subscriber1);
      subscribeFn!(subscriber2);

      const firstNotification = {
        id: 'n1',
        businessId: 'biz_1',
        type: 'new_order',
        category: 'pedidos',
        title: 'Nuevo pedido',
        message: 'Pedido #1',
        data: {},
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
        readAt: null,
      } as Notification;

      dispatchNewNotification(firstNotification);
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);

      // Remove subscriber1 — it must no longer receive future events
      unsubscribe();

      const secondNotification = {
        ...firstNotification,
        id: 'n2',
        title: 'Otro pedido',
      } as Notification;

      dispatchNewNotification(secondNotification);

      expect(subscriber1).toHaveBeenCalledTimes(1); // unchanged after removal
      expect(subscriber1).not.toHaveBeenCalledWith(secondNotification);
      expect(subscriber2).toHaveBeenCalledTimes(2);
      expect(subscriber2).toHaveBeenLastCalledWith(secondNotification);
    });
  });

  describe('Provider passes hook options through', () => {
    it('forwards businessId to useNotifications on each render', () => {
      const { rerender } = render(
        <NotificationsProvider businessId="biz_A">{null}</NotificationsProvider>,
      );
      expect(useNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'biz_A' }),
      );

      rerender(<NotificationsProvider businessId="biz_B">{null}</NotificationsProvider>);
      expect(useNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'biz_B' }),
      );
    });
  });
});
