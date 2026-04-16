import { getNotificationLabel } from './notificationTypes';
import type { NotificationItem } from './notificationTypes';

interface NotificationListItemProps {
  notification: NotificationItem;
  busyId: string | null;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onDelete: (event: React.MouseEvent<HTMLButtonElement>, notificationId: string) => Promise<void>;
}

export function NotificationListItem({
  notification,
  busyId,
  onOpenNotification,
  onDelete,
}: NotificationListItemProps) {
  return (
    <article className={notification.isRead ? 'notification-item' : 'notification-item is-unread'}>
      <button
        type="button"
        className="notification-item__content"
        onClick={() => void onOpenNotification(notification)}
        disabled={busyId === notification.id}
      >
        <div className="notification-item__top">
          <span className="soft-tag">{getNotificationLabel(notification)}</span>
          <span className="notification-item__time">
            {notification.actorName ? `${notification.actorName} · ${notification.createdAt}` : notification.createdAt}
          </span>
        </div>
        <strong>{notification.title}</strong>
        <p>{notification.body}</p>
      </button>
      <button
        type="button"
        className="notification-item__delete"
        aria-label="알림 삭제"
        onClick={(event) => void onDelete(event, notification.id)}
        disabled={busyId === notification.id}
      >
        ×
      </button>
    </article>
  );
}
