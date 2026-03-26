import { create } from 'zustand';
import type { UserNotification } from '../types';

type SetterValue<T> = T | ((current: T) => T);

function resolveValue<T>(value: SetterValue<T>, current: T): T {
  return typeof value === 'function' ? (value as (current: T) => T)(current) : value;
}

type NotificationState = {
  notifications: UserNotification[];
  unreadCount: number;
  setNotifications: (value: SetterValue<UserNotification[]>) => void;
  setUnreadCount: (value: SetterValue<number>) => void;
  prependNotification: (notification: UserNotification) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (value) =>
    set((state) => ({ notifications: resolveValue(value, state.notifications) })),

  setUnreadCount: (value) =>
    set((state) => ({ unreadCount: resolveValue(value, state.unreadCount) })),

  /** Add a newly-arrived SSE notification to the front of the list. */
  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
}));
