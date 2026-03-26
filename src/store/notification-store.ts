import { create } from 'zustand';
import type { UserNotification } from '../types';

type SetterValue<T> = T | ((current: T) => T);

function resolveValue<T>(value: SetterValue<T>, current: T): T {
  return typeof value === 'function' ? (value as (current: T) => T)(current) : value;
}

type NotificationState = {
  notifications: UserNotification[];
  unreadCount: number;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  setNotifications: (value: SetterValue<UserNotification[]>) => void;
  setUnreadCount: (value: SetterValue<number>) => void;
  setPollingIntervalId: (value: SetterValue<ReturnType<typeof setInterval> | null>) => void;
  fetchNotifications: () => Promise<void>;
  subscribe: (fetchFn: () => Promise<{ notifications: UserNotification[]; unreadNotificationCount: number } | null>, intervalMs?: number) => () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  pollingIntervalId: null,

  setNotifications: (value) =>
    set((state) => ({ notifications: resolveValue(value, state.notifications) })),

  setUnreadCount: (value) =>
    set((state) => ({ unreadCount: resolveValue(value, state.unreadCount) })),

  setPollingIntervalId: (value) =>
    set((state) => ({ pollingIntervalId: resolveValue(value, state.pollingIntervalId) })),

  fetchNotifications: async () => {
    // Intentionally no-op here; actual fetch is wired through subscribe()
  },

  subscribe: (fetchFn, intervalMs = 30_000) => {
    const existing = get().pollingIntervalId;
    if (existing !== null) {
      clearInterval(existing);
    }

    async function poll() {
      try {
        const result = await fetchFn();
        if (result) {
          set({
            notifications: result.notifications,
            unreadCount: result.unreadNotificationCount,
          });
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    const id = setInterval(() => void poll(), intervalMs);
    set({ pollingIntervalId: id });

    return () => {
      clearInterval(id);
      set({ pollingIntervalId: null });
    };
  },
}));
