import { NotificationListItem } from './NotificationListItem';
import type { NotificationItem } from './notificationTypes';
import type { NotificationPanelActions } from './notificationTypes';

interface NotificationPanelProps {
  sessionUserName: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  actions: NotificationPanelActions;
}

export function NotificationPanel({
  sessionUserName,
  notifications,
  unreadCount,
  actions,
}: NotificationPanelProps) {
  const {
    busyAll,
    busyId,
    error,
    handleDelete,
    handleMarkAll,
    handleOpenNotification,
  } = actions;

  return (
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
          <NotificationListItem
            key={notification.id}
            notification={notification}
            busyId={busyId}
            onOpenNotification={handleOpenNotification}
            onDelete={handleDelete}
          />
        ))}
        {notifications.length === 0 && <p className="empty-copy">새로운 알림이 아직 없어요.</p>}
      </div>
    </section>
  );
}
