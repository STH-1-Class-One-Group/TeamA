import { useState } from 'react';
import { NotificationPanel } from './notifications/NotificationPanel';
import { useNotificationPanelActions } from './notifications/useNotificationPanelActions';
import type { NotificationItem } from './notifications/notificationTypes';

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

export function GlobalNotificationCenter({
  sessionUserName,
  notifications,
  unreadCount,
  onOpenNotification,
  onMarkAllNotificationsRead,
  onDeleteNotification,
}: GlobalNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const actions = useNotificationPanelActions({
    onOpenNotification,
    onMarkAllNotificationsRead,
    onDeleteNotification,
    onClose: () => setIsOpen(false),
  });

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
      {isOpen && <NotificationPanel sessionUserName={sessionUserName} notifications={notifications} unreadCount={unreadCount} actions={actions} />}
    </div>
  );
}
