import type { MyPageResponse } from '../../types';

export type NotificationItem = NonNullable<MyPageResponse>['notifications'][number];

export interface NotificationPanelActions {
  busyAll: boolean;
  busyId: string | null;
  error: string | null;
  handleDelete: (event: React.MouseEvent<HTMLButtonElement>, notificationId: string) => Promise<void>;
  handleMarkAll: () => Promise<void>;
  handleOpenNotification: (notification: NotificationItem) => Promise<void>;
}

export function getNotificationLabel(notification: NotificationItem) {
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
