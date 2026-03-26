import { create } from 'zustand';
import {
  deleteNotification as deleteNotificationRequest,
  getMyNotifications,
  getNotificationStreamUrl,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from '../api/client';
import type { SessionUser, UserNotification } from '../types';

type NotificationStore = {
  notifications: UserNotification[];
  unreadCount: number;
  connected: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  source: EventSource | null;
  reconnectTimer: number | null;
  fetchNotifications: () => Promise<void>;
  connect: (sessionUser: SessionUser | null) => void;
  disconnect: () => void;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  hydrate: (notifications: UserNotification[], unreadCount?: number) => void;
};

function countUnread(notifications: UserNotification[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

function clearReconnectTimer(timer: number | null) {
  if (timer !== null && typeof window !== 'undefined') {
    window.clearTimeout(timer);
  }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,
  status: 'idle',
  error: null,
  source: null,
  reconnectTimer: null,
  async fetchNotifications() {
    set({ status: 'loading', error: null });
    try {
      const notifications = await getMyNotifications();
      set({
        notifications,
        unreadCount: countUnread(notifications),
        status: 'ready',
        error: null,
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : '알림을 불러오지 못했어요.',
      });
    }
  },
  connect(sessionUser) {
    const currentSource = get().source;
    if (!sessionUser) {
      get().disconnect();
      return;
    }
    if (currentSource) {
      return;
    }

    clearReconnectTimer(get().reconnectTimer);
    const source = new EventSource(getNotificationStreamUrl(), { withCredentials: true });

    source.addEventListener('connected', () => {
      set({ connected: true, status: 'ready', error: null });
    });

    source.addEventListener('notification.created', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        notification: UserNotification;
        unreadCount: number;
      };
      set((state) => ({
        notifications: [payload.notification, ...state.notifications.filter((item) => item.id !== payload.notification.id)],
        unreadCount: payload.unreadCount,
        connected: true,
        status: 'ready',
        error: null,
      }));
    });

    source.addEventListener('notification.read', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        notificationId: string;
        unreadCount: number;
      };
      set((state) => ({
        notifications: state.notifications.map((notification) => (
          notification.id === payload.notificationId
            ? { ...notification, isRead: true }
            : notification
        )),
        unreadCount: payload.unreadCount,
        connected: true,
      }));
    });

    source.addEventListener('notification.all-read', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { unreadCount: number };
      set((state) => ({
        notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
        unreadCount: payload.unreadCount,
        connected: true,
      }));
    });

    source.addEventListener('notification.deleted', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        notificationId: string;
        unreadCount: number;
      };
      set((state) => ({
        notifications: state.notifications.filter((notification) => notification.id !== payload.notificationId),
        unreadCount: payload.unreadCount,
        connected: true,
      }));
    });

    source.onerror = () => {
      source.close();
      set({ source: null, connected: false });
      const reconnectTimer = window.setTimeout(() => {
        set({ reconnectTimer: null });
        get().connect(sessionUser);
      }, 3000);
      set({ reconnectTimer });
    };

    set({ source, connected: false, error: null });
  },
  disconnect() {
    clearReconnectTimer(get().reconnectTimer);
    get().source?.close();
    set({
      source: null,
      reconnectTimer: null,
      connected: false,
      notifications: [],
      unreadCount: 0,
      error: null,
      status: 'idle',
    });
  },
  async markRead(notificationId) {
    await markNotificationReadRequest(notificationId);
    set((state) => ({
      notifications: state.notifications.map((notification) => (
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )),
      unreadCount: Math.max(0, state.notifications.filter((notification) => !notification.isRead && notification.id !== notificationId).length),
    }));
  },
  async markAllRead() {
    await markAllNotificationsReadRequest();
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
      unreadCount: 0,
    }));
  },
  async deleteNotification(notificationId) {
    await deleteNotificationRequest(notificationId);
    set((state) => {
      const notifications = state.notifications.filter((notification) => notification.id !== notificationId);
      return {
        notifications,
        unreadCount: countUnread(notifications),
      };
    });
  },
  hydrate(notifications, unreadCount) {
    set({
      notifications,
      unreadCount: unreadCount ?? countUnread(notifications),
      status: 'ready',
      error: null,
    });
  },
}));
