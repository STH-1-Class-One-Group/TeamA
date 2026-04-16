import { useState } from 'react';
import type { NotificationItem } from './notificationTypes';

interface UseNotificationPanelActionsParams {
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onClose: () => void;
}

export function useNotificationPanelActions({
  onOpenNotification,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  onClose,
}: UseNotificationPanelActionsParams) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenNotification(notification: NotificationItem) {
    try {
      setBusyId(notification.id);
      setError(null);
      await onOpenNotification(notification);
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '알림을 열지 못했어요.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAll() {
    try {
      setBusyAll(true);
      setError(null);
      await onMarkAllNotificationsRead();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '알림 상태를 바꾸지 못했어요.');
    } finally {
      setBusyAll(false);
    }
  }

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>, notificationId: string) {
    event.stopPropagation();
    try {
      setBusyId(notificationId);
      setError(null);
      await onDeleteNotification(notificationId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '알림을 삭제하지 못했어요.');
    } finally {
      setBusyId(null);
    }
  }

  return {
    busyId,
    busyAll,
    error,
    handleOpenNotification,
    handleMarkAll,
    handleDelete,
  };
}
