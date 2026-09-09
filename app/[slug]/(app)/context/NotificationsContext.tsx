'use client';

import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/notifications';
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export interface NotificationsContextValue {
  // State (from useNotifications)
  notifications: ReturnType<typeof useNotifications>['notifications'];
  unreadCount: number;
  unreadCountByCategory: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;

  // Pub/sub
  subscribeToNewNotifications: (fn: (notification: Notification) => void) => () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
  businessId: string;
}

/**
 * Provides a single realtime notification source for the business.
 *
 * Lifecycle:
 * - **Mount**: calls `useNotifications` once for the given `businessId`, which
 *   does the initial fetch (limit 50), starts the polling interval, and opens
 *   the realtime channel. All state (notifications, unreadCount, loading,
 *   errors) is exposed through the context value.
 * - **Subscriptions**: consumers register listeners via
 *   `subscribeToNewNotifications`. Listeners live in a `useRef` Set, so
 *   register/unregister never triggers re-renders.
 * - **Events**: when the hook receives a realtime notification it invokes the
 *   internal `onNewNotification`, which dispatches the event synchronously to
 *   every registered listener.
 * - **Unmount**: the provider has no explicit cleanup — `useNotifications`
 *   tears down polling/realtime internally, and the subscriber Set is
 *   discarded with the ref. Consumers must call the unsubscribe function
 *   returned by `subscribeToNewNotifications` in their own effect cleanup.
 */
export function NotificationsProvider({ children, businessId }: NotificationsProviderProps) {
  // Pub/sub subscriber registry — Set in useRef to avoid re-renders on subscriber changes
  const subscribers = useRef(new Set<(notification: Notification) => void>());

  /**
   * Registers a listener for realtime notifications.
   *
   * @param fn - Called synchronously with each new notification.
   * @returns An unsubscribe function. It is idempotent: calling it more than
   *   once does nothing.
   */
  const subscribeToNewNotifications = useCallback((fn: (notification: Notification) => void) => {
    subscribers.current.add(fn);
    return () => {
      subscribers.current.delete(fn);
    };
  }, []);

  // Internal onNewNotification: dispatches to all subscribers.
  // Passed to useNotifications; the hook's onNewNotificationRef pattern
  // means this callback updates via ref without causing re-subscription.
  const onNewNotification = useCallback((notif: Notification) => {
    for (const fn of subscribers.current) {
      fn(notif);
    }
  }, []);

  // Mount useNotifications once per businessId. Pass onNewNotification
  // for the pub/sub dispatch. After Phase 3 removes onNewNotification
  // from the exported UseNotificationsOptions type, the provider still
  // passes it because the hook function parameter is retained internally.
  const hookReturn = useNotifications({ businessId, onNewNotification });

  const value: NotificationsContextValue = {
    notifications: hookReturn.notifications,
    unreadCount: hookReturn.unreadCount,
    unreadCountByCategory: hookReturn.unreadCountByCategory,
    isLoading: hookReturn.isLoading,
    error: hookReturn.error,
    markAsRead: hookReturn.markAsRead,
    markAllAsRead: hookReturn.markAllAsRead,
    dismiss: hookReturn.dismiss,
    refresh: hookReturn.refresh,
    subscribeToNewNotifications,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/**
 * Reads the notification context.
 *
 * Must be used within a `<NotificationsProvider>`; throws otherwise so
 * misplacement fails loudly instead of silently returning `undefined`.
 */
export function useNotificationsContext(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}
