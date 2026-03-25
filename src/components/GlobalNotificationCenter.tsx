import { useState } from 'react';
import type { MyPageResponse } from '../types';

type NotificationItem = NonNullable<MyPageResponse>['notifications'][number];

interface GlobalNotificationCenterProps {
  sessionUserName: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M12 4.75a4.25 4.25 0 0 0-4.25 4.25v2.23c0 .92-.3 1.81-.86 2.54l-1.1 1.47a1 1 0 0 0 .8 1.6h11.82a1 1 0 0 0 .8-1.6l-1.1-1.47a4.24 4.24 0 0 1-.86-2.54V9A4.25 4.25 0 0 0 12 4.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 18.25a2 2 0 0 0 3.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getNotificationLabel(notification: NotificationItem) {
  switch (notification.type) {
    case 'review-created':
      return '피드';
    case 'route-published':
      return '코스';
    case 'review-comment':
      return '댓글';
    case 'comment-reply':
      return '답글';
    default:
      return '알림';
  }
}

export function GlobalNotificationCenter({
  sessionUserName,
  notifications,
  unreadCount,
  onOpenNotification,
  onMarkAllNotificationsRead,
  onDeleteNotification,
}: GlobalNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenNotification(notification: NotificationItem) {
    try {
      setBusyId(notification.id);
      setError(null);
      await onOpenNotification(notification);
      setIsOpen(false);
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

  return (
    <div className="global-notification-center">
      <button
        type="button"
        className={isOpen ? 'secondary-button icon-button notification-bell is-complete' : 'secondary-button icon-button notification-bell'}
        onClick={() => setIsOpen((current) => !current)}
        aria-label="알림 열기"
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notification-bell__dot" aria-hidden="true" />}
      </button>
      {isOpen && (
        <section className="global-notification-panel">
          <div className="notification-panel__header">
            <div>
              <p className="eyebrow">ALERT</p>
              <h3>{sessionUserName ? `${sessionUserName}님의 새 알림` : '새 알림'}</h3>
              <p className="section-copy">어느 탭에 있든 여기서 바로 확인하고 이동할 수 있어요.</p>
            </div>
            <button type="button" className="secondary-button notification-panel__mark-all" onClick={() => void handleMarkAll()} disabled={busyAll || unreadCount === 0}>
              {busyAll ? '처리 중' : '모두 읽음'}
            </button>
          </div>
          {error && <p className="form-error-copy">{error}</p>}
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={notification.isRead ? 'notification-item' : 'notification-item is-unread'}
              >
                <button
                  type="button"
                  className="notification-item__content"
                  onClick={() => void handleOpenNotification(notification)}
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
                  onClick={(event) => void handleDelete(event, notification.id)}
                  disabled={busyId === notification.id}
                >
                  ×
                </button>
              </article>
            ))}
            {notifications.length === 0 && <p className="empty-copy">새로운 알림이 아직 없어요.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
