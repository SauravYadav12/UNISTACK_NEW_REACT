import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthGaurd/AuthContextProvider';
import { NotificationItem } from '../Interfaces/notification';
import {
  deleteAllNotifications,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';

/**
 * Polls the notification API and exposes a single ready-to-render state for
 * the bell + drawer. Lives at the `<Layout>` level so polling stays alive
 * across navigations.
 *
 * Polling cadence:
 *   - 30s when the tab is focused
 *   - 60s when the tab is blurred
 *   - Instant re-fetch on tab focus, on route change, and when the drawer opens
 *
 * Toast policy: any newly-arrived notification (id we haven't seen before)
 * triggers a `toast.info(title)` unless the drawer is open (you can already
 * see it) or it's the very first load (avoids a flood on login).
 */
const POLL_FOCUSED_MS = 30_000;
const POLL_BLURRED_MS = 60_000;
const LIST_LIMIT = 50;

export interface UseNotificationsApi {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Optimistically remove a single notification + delete it
   *  server-side. UI updates immediately; the API call is
   *  fire-and-forget. */
  removeOne: (id: string) => void;
  /** Optimistically clear every notification + wipe them server-side.
   *  Same fire-and-forget pattern as removeOne. */
  clearAll: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export function useNotifications(): UseNotificationsApi {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Track ids we've already shown a toast for so polling can spot new ones.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadDoneRef = useRef(false);
  // Avoid overlapping fetches.
  const inFlightRef = useRef(false);
  // Refs for stable callbacks referenced from setInterval / event listeners.
  const drawerOpenRef = useRef(drawerOpen);
  drawerOpenRef.current = drawerOpen;
  const isAuthedRef = useRef(isAuthenticated);
  isAuthedRef.current = isAuthenticated;

  const fetchList = useCallback(async () => {
    if (!isAuthedRef.current) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await listNotifications({ limit: LIST_LIMIT });
      const data = res.data?.data;
      if (!data) return;
      const incoming = data.items || [];

      // Detect previously-unseen items for toast.
      if (firstLoadDoneRef.current && !drawerOpenRef.current) {
        const seen = seenIdsRef.current;
        for (const n of incoming) {
          if (!seen.has(n._id) && !n.readAt) {
            toast.info(n.title);
          }
        }
      }
      seenIdsRef.current = new Set(incoming.map((n) => n._id));
      firstLoadDoneRef.current = true;

      setItems(incoming);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Swallow — polling errors should not be loud. The next tick retries.
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await fetchList();
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  const checkUnreadCount = useCallback(async () => {
    if (!isAuthedRef.current) return;
    try {
      const res = await getUnreadCount();
      const next = res.data?.data?.count ?? 0;
      // If the count grew or the drawer is open, refresh the list so toasts
      // can fire / the drawer reflects the change immediately.
      setUnreadCount((prev) => {
        if (next !== prev) {
          // Full-list fetch is async and self-throttled by inFlightRef.
          void fetchList();
        }
        return next;
      });
    } catch {
      // Silent.
    }
  }, [fetchList]);

  // Bootstrap + polling loop.
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset state on logout so a new login starts clean.
      setItems([]);
      setUnreadCount(0);
      seenIdsRef.current = new Set();
      firstLoadDoneRef.current = false;
      return;
    }
    // Initial load — fetches the list so seenIds is primed (no toast spam).
    void fetchList();

    let timerId: ReturnType<typeof setInterval> | null = null;
    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      const ms =
        document.visibilityState === 'visible'
          ? POLL_FOCUSED_MS
          : POLL_BLURRED_MS;
      timerId = setInterval(checkUnreadCount, ms);
    };
    startTimer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkUnreadCount();
      }
      startTimer(); // reset cadence to match new visibility state
    };
    const handleFocus = () => {
      void checkUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, fetchList, checkUnreadCount]);

  // Re-check on every route change so a user who just navigated sees fresh
  // counts without waiting for the next tick.
  useEffect(() => {
    if (!isAuthenticated) return;
    void checkUnreadCount();
  }, [location.pathname, isAuthenticated, checkUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Best-effort — next poll will reconcile.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: now })),
      );
      setUnreadCount(0);
    } catch {
      // Best-effort.
    }
  }, []);

  /**
   * Optimistic single-row delete. The row vanishes from state
   * immediately; the API call fires in the background and we don't
   * await it. Failures are silently ignored — the next poll cycle
   * will reconcile if the server didn't actually delete (e.g. user
   * lost connectivity). We also prune the seen-id set so a re-poll
   * doesn't re-toast the deleted item.
   */
  const removeOne = useCallback((id: string) => {
    // Decrement unread counter if the doomed row was unread.
    setItems((prev) => {
      const row = prev.find((n) => n._id === id);
      if (row && !row.readAt) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n._id !== id);
    });
    seenIdsRef.current.delete(id);
    // Fire-and-forget — no spinner, no await, no toast.
    void deleteNotification(id).catch(() => {
      /* swallow */
    });
  }, []);

  /**
   * Optimistic clear-all. Local state empties immediately; the bulk
   * DELETE call goes out in the background.
   */
  const clearAll = useCallback(() => {
    setItems([]);
    setUnreadCount(0);
    seenIdsRef.current.clear();
    void deleteAllNotifications().catch(() => {
      /* swallow */
    });
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    void reload();
  }, [reload]);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return {
    items,
    unreadCount,
    loading,
    reload,
    markRead,
    markAllRead,
    removeOne,
    clearAll,
    drawerOpen,
    openDrawer,
    closeDrawer,
  };
}
