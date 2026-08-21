// =====================================================
// HOOKS — useNotifications
// =====================================================
// Client-side hook for real-time notifications with Supabase
// =====================================================

'use client';

import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationCategory } from '@/types/notifications';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

export interface NotificationWithMeta extends Notification {
  isNew?: boolean;
}

export interface UseNotificationsOptions {
  businessId: string;
  autoFetch?: boolean;
  enableRealtime?: boolean;
  onNewNotification?: (notification: Notification) => void;
}

export interface UseNotificationsReturn {
  notifications: NotificationWithMeta[];
  unreadCount: number;
  unreadCountByCategory: Record<NotificationCategory, number>;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications({
  businessId,
  autoFetch = true,
  enableRealtime = true,
  onNewNotification,
}: UseNotificationsOptions): UseNotificationsReturn {
  const hookId = useId().replace(/:/g, '');
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<NotificationWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead && !n.isDismissed).length,
    [notifications],
  );

  const unreadCountByCategory = useMemo(() => {
    const counts: Record<NotificationCategory, number> = {
      chat: 0,
      almacen: 0,
      plan: 0,
      pedidos: 0,
      sistema: 0,
    };

    notifications
      .filter((n) => !n.isRead && !n.isDismissed)
      .forEach((n) => {
        if (counts[n.category] !== undefined) {
          counts[n.category]++;
        }
      });

    return counts;
  }, [notifications]);

  const fetchNotifications = useCallback(
    async (showLoader = false) => {
      if (!businessId) return;

      // Solo mostrar loader si es la primera carga y se pide explícitamente
      if (showLoader) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({ businessId, limit: '50' });
        const response = await fetch(`/api/notifications?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        const result = await response.json();
        setNotifications(result.notifications || []);
      } catch (err) {
        // Solo mostrar error si no hay notificaciones aún
        if (notifications.length === 0) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [businessId, notifications.length],
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)),
        );
      }
    } catch (err) {
      console.error('[useNotifications] Mark as read error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const params = new URLSearchParams({ businessId });
      const response = await fetch(`/api/notifications/read-all?${params}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt ? new Date(n.readAt) : new Date(),
          })),
        );
      }
    } catch (err) {
      console.error('[useNotifications] Mark all as read error:', err);
    }
  }, [businessId]);

  const dismiss = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n)),
        );
      }
    } catch (err) {
      console.error('[useNotifications] Dismiss error:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNotifications(false);
  }, [fetchNotifications]);

  // Initial fetch - con spinner
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(true);
    }
  }, [autoFetch, fetchNotifications]);

  // Keep mutable references of callbacks to avoid tearing down/rebuilding realtime subscription
  const onNewNotificationRef = useRef(onNewNotification);
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Real-time subscription + fallback polling optimizado
  useEffect(() => {
    if (!enableRealtime || !businessId) {
      return () => {};
    }

    const channelName = `notifications:${businessId}-${hookId}`;

    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const newNotification = payload.new as Notification;

          const notificationWithMeta: NotificationWithMeta = {
            ...newNotification,
            isNew: true,
          };

          setNotifications((prev) => {
            if (prev.find((n) => n.id === newNotification.id)) {
              return prev;
            }
            return [notificationWithMeta, ...prev];
          });

          if (onNewNotificationRef.current) {
            onNewNotificationRef.current(newNotification);
          }

          setTimeout(() => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === newNotification.id ? { ...n, isNew: false } : n)),
            );
          }, 5000);
        },
      )
      .subscribe();

    // FALLBACK OPTIMIZADO: Polling silencioso cada 30 seg (sin spinner)
    const pollingInterval = setInterval(() => {
      if (fetchNotificationsRef.current) {
        fetchNotificationsRef.current(false);
      }
    }, 30000);

    return () => {
      supabase.removeChannel(newChannel);
      clearInterval(pollingInterval);
    };
  }, [businessId, supabase, enableRealtime, hookId]);

  return {
    notifications,
    unreadCount,
    unreadCountByCategory,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
  };
}
