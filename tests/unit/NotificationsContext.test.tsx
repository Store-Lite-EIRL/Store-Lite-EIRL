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

/** Renders the provider with a default mock return and an optional child. */
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
  (useNotifications as Mock).mockReturnValue(merged);

  return {
    ...render(
      <NotificationsProvider businessId={businessId}>{children ?? null}</NotificationsProvider>,
    ),
    mockReturn: merged,
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
    it('multiple subscribers register successfully and return unsubscribe functions', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
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

      const unsub1 = subscribeFn!(subscriber1);
      const unsub2 = subscribeFn!(subscriber2);

      // Both should have gotten unsubscribe functions (registered successfully)
      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');

      // Cleanup
      unsub1();
      unsub2();
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
