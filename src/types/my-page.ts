import type { Place } from './core';
import type { Review, StampLog, TravelSession, UserRoute } from './review';
import type { SessionUser } from './auth';

export interface MyComment {
  id: string;
  reviewId: string;
  placeId: string;
  placeName: string;
  body: string;
  isDeleted: boolean;
  parentId: string | null;
  createdAt: string;
  reviewBody: string;
}

export interface MyCommentPageResponse {
  items: MyComment[];
  nextCursor: string | null;
}

export interface MyStats {
  reviewCount: number;
  stampCount: number;
  uniquePlaceCount: number;
  totalPlaceCount: number;
  routeCount: number;
}

export type UserNotificationType =
  | 'review-created'
  | 'route-published'
  | 'review-comment'
  | 'comment-reply';

export interface UserNotification {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  reviewId: string | null;
  commentId: string | null;
  routeId: string | null;
  actorName: string | null;
}

export interface MyPageResponse {
  user: SessionUser;
  stats: MyStats;
  reviews: Review[];
  comments: MyComment[];
  notifications: UserNotification[];
  unreadNotificationCount: number;
  stampLogs: StampLog[];
  travelSessions: TravelSession[];
  visitedPlaces: Place[];
  unvisitedPlaces: Place[];
  collectedPlaces: Place[];
  routes: UserRoute[];
}

export interface NotificationReadResponse {
  notificationId: string;
  read: boolean;
}

export interface NotificationDeleteResponse {
  notificationId: string;
  deleted: boolean;
}

export interface NotificationRealtimeChannelResponse {
  topic: string;
}
