import { useState } from 'react';
import { FEEDBACK_FORM_URL } from './GlobalFeedbackButton';
import { NotificationPanel } from './notifications/NotificationPanel';
import { useNotificationPanelActions } from './notifications/useNotificationPanelActions';
import type { NotificationItem } from './notifications/notificationTypes';

type GlobalSettingsMenuProps = {
  sessionUserName: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
};

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M10.23 4.23a1 1 0 0 1 1-.73h1.54a1 1 0 0 1 1 .73l.24.85a6.9 6.9 0 0 1 1.43.59l.78-.43a1 1 0 0 1 1.2.18l1.08 1.08a1 1 0 0 1 .18 1.2l-.43.78c.24.45.44.92.59 1.43l.85.24a1 1 0 0 1 .73 1v1.54a1 1 0 0 1-.73 1l-.85.24a6.9 6.9 0 0 1-.59 1.43l.43.78a1 1 0 0 1-.18 1.2l-1.08 1.08a1 1 0 0 1-1.2.18l-.78-.43a6.9 6.9 0 0 1-1.43.59l-.24.85a1 1 0 0 1-1 .73h-1.54a1 1 0 0 1-1-.73l-.24-.85a6.9 6.9 0 0 1-1.43-.59l-.78.43a1 1 0 0 1-1.2-.18l-1.08-1.08a1 1 0 0 1-.18-1.2l.43-.78a6.9 6.9 0 0 1-.59-1.43l-.85-.24a1 1 0 0 1-.73-1v-1.54a1 1 0 0 1 .73-1l.85-.24a6.9 6.9 0 0 1 .59-1.43l-.43-.78a1 1 0 0 1 .18-1.2l1.08-1.08a1 1 0 0 1 1.2-.18l.78.43c.45-.24.92-.44 1.43-.59z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function GlobalSettingsMenu({
  sessionUserName,
  notifications,
  unreadCount,
  onOpenNotification,
  onMarkAllNotificationsRead,
  onDeleteNotification,
}: GlobalSettingsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationActions = useNotificationPanelActions({
    onOpenNotification,
    onMarkAllNotificationsRead,
    onDeleteNotification,
    onClose: () => {
      setShowNotifications(false);
      setIsMenuOpen(false);
    },
  });

  return (
    <div className="global-settings-menu">
      <button
        type="button"
        className={isMenuOpen ? 'secondary-button icon-button global-settings-menu__trigger is-complete' : 'secondary-button icon-button global-settings-menu__trigger'}
        onClick={() => {
          setIsMenuOpen((current) => !current);
          if (isMenuOpen) {
            setShowNotifications(false);
          }
        }}
        aria-label="설정 열기"
        title="설정 열기"
      >
        <GearIcon />
        {unreadCount > 0 && <span className="notification-bell__dot" aria-hidden="true" />}
      </button>

      {isMenuOpen && (
        <div className="global-settings-menu__menu">
          <button
            type="button"
            className={showNotifications ? 'secondary-button is-complete global-settings-menu__item' : 'secondary-button global-settings-menu__item'}
            onClick={() => setShowNotifications((current) => !current)}
          >
            <span>알람</span>
            {unreadCount > 0 && <strong>{unreadCount}</strong>}
          </button>
          <a className="secondary-button global-settings-menu__item" href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">
            <span>피드백</span>
          </a>
        </div>
      )}

      {isMenuOpen && showNotifications && (
        <NotificationPanel
          sessionUserName={sessionUserName}
          notifications={notifications}
          unreadCount={unreadCount}
          actions={notificationActions}
        />
      )}
    </div>
  );
}
