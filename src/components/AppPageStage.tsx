import { memo } from 'react';
import { EventTab } from './EventTab';
import { PageStageCourseView } from './page-stage/PageStageCourseView';
import { PageStageFeedView } from './page-stage/PageStageFeedView';
import { PageStageMyView } from './page-stage/PageStageMyView';
import type {
  AdminSummaryResponse,
  ApiStatus,
  AuthProvider,
  Comment,
  CommunityRouteSort,
  Course,
  FestivalItem,
  MyPageResponse,
  MyPageTabKey,
  Review,
  ReviewMood,
  RoutePreview,
  SessionUser,
  Tab,
  UserRoute,
} from '../types';

export interface AppPageStageProps {
  activeTab: Exclude<Tab, 'map'>;
  sharedData: {
    sessionUser: SessionUser | null;
    placeNameById: Record<string, string>;
    festivals: FestivalItem[];
  };
  feedData: {
    reviews: Review[];
    reviewLikeUpdatingId: string | null;
    feedPlaceFilterId: string | null;
    commentSubmittingReviewId: string | null;
    commentMutatingId: string | null;
    deletingReviewId: string | null;
    activeCommentReviewId: string | null;
    activeCommentReviewComments: Comment[];
    activeCommentReviewStatus: ApiStatus;
    highlightedCommentId: string | null;
    highlightedReviewId: string | null;
    feedHasMore: boolean;
    feedLoadingMore: boolean;
  };
  courseData: {
    courses: Course[];
    communityRoutes: UserRoute[];
    communityRouteSort: CommunityRouteSort;
    routeLikeUpdatingId: string | null;
    highlightedRouteId: string | null;
  };
  myPageData: {
    myPage: MyPageResponse | null;
    providers: AuthProvider[];
    myPageError: string | null;
    myPageTab: MyPageTabKey;
    isLoggingOut: boolean;
    profileSaving: boolean;
    profileError: string | null;
    routeSubmitting: boolean;
    routeError: string | null;
    adminSummary: AdminSummaryResponse | null;
    adminBusyPlaceId: string | null;
    adminLoading: boolean;
    commentsHasMore: boolean;
    commentsLoadingMore: boolean;
  };
  sharedActions: {
    onRequestLogin: () => void;
    onOpenPlace: (placeId: string) => void;
  };
  feedActions: {
    onLoadMoreFeed: () => Promise<void>;
    onToggleReviewLike: (reviewId: string) => Promise<void>;
    onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
    onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
    onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
    onDeleteReview: (reviewId: string) => Promise<void>;
    onClearPlaceFilter: () => void;
    onOpenComments: (reviewId: string, commentId?: string | null) => void;
    onCloseComments: () => void;
  };
  courseActions: {
    onChangeRouteSort: (sort: CommunityRouteSort) => void;
    onToggleRouteLike: (routeId: string) => Promise<void>;
    onOpenRoutePreview: (route: RoutePreview) => void;
  };
  myPageActions: {
    onChangeMyPageTab: (tab: MyPageTabKey) => void;
    onLogin: (provider: 'naver' | 'kakao') => void;
    onRetryMyPage: () => Promise<void>;
    onLogout: () => Promise<void>;
    onSaveNickname: (nickname: string) => Promise<void>;
    onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
    onOpenCommentFromMyPage: (reviewId: string, commentId: string) => void;
    onOpenRouteFromMyPage: (routeId: string) => Promise<void>;
    onOpenReview: (reviewId: string) => Promise<void>;
    onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean }) => Promise<void>;
    onDeleteReview: (reviewId: string) => Promise<void>;
    onLoadMoreComments: (initial?: boolean) => Promise<void>;
    onRefreshAdmin: () => Promise<void>;
    onToggleAdminPlace: (placeId: string, nextValue: boolean) => Promise<void>;
    onToggleAdminManualOverride: (placeId: string, nextValue: boolean) => Promise<void>;
  };
}

export const AppPageStage = memo(function AppPageStage({
  activeTab,
  sharedData,
  feedData,
  courseData,
  myPageData,
  sharedActions,
  feedActions,
  courseActions,
  myPageActions,
}: AppPageStageProps) {
  return (
    <div className="page-stage">
      {activeTab === 'feed' && (
        <PageStageFeedView
          sharedData={sharedData}
          feedData={feedData}
          sharedActions={sharedActions}
          feedActions={feedActions}
        />
      )}

      {activeTab === 'event' && <EventTab festivals={sharedData.festivals} />}

      {activeTab === 'course' && (
        <PageStageCourseView
          sharedData={sharedData}
          courseData={courseData}
          sharedActions={sharedActions}
          courseActions={courseActions}
        />
      )}

      {activeTab === 'my' && (
        <PageStageMyView
          sharedData={sharedData}
          myPageData={myPageData}
          sharedActions={sharedActions}
          myPageActions={myPageActions}
        />
      )}
    </div>
  );
});
