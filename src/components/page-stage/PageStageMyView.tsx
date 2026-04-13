import { MyPagePanel } from '../MyPagePanel';
import type { AppPageStageProps } from '../AppPageStage';

type PageStageMyViewProps = Pick<AppPageStageProps, 'sharedData' | 'myPageData' | 'sharedActions' | 'myPageActions'>;

export function PageStageMyView({
  sharedData,
  myPageData,
  sharedActions,
  myPageActions,
}: PageStageMyViewProps) {
  return (
    <MyPagePanel
      sessionData={{
        sessionUser: sharedData.sessionUser,
        myPage: myPageData.myPage,
        providers: myPageData.providers,
        myPageError: myPageData.myPageError,
      }}
      panelState={{
        activeTab: myPageData.myPageTab,
        isLoggingOut: myPageData.isLoggingOut,
        profileSaving: myPageData.profileSaving,
        profileError: myPageData.profileError,
        routeSubmitting: myPageData.routeSubmitting,
        routeError: myPageData.routeError,
        commentsHasMore: myPageData.commentsHasMore,
        commentsLoadingMore: myPageData.commentsLoadingMore,
      }}
      reviewActions={{
        onOpenPlace: sharedActions.onOpenPlace,
        onOpenComment: myPageActions.onOpenCommentFromMyPage,
        onOpenRoute: myPageActions.onOpenRouteFromMyPage,
        onOpenReview: myPageActions.onOpenReview,
        onUpdateReview: myPageActions.onUpdateReview,
        onDeleteReview: myPageActions.onDeleteReview,
        onLoadMoreComments: myPageActions.onLoadMoreComments,
      }}
      panelActions={{
        onChangeTab: myPageActions.onChangeMyPageTab,
        onLogin: myPageActions.onLogin,
        onRetry: myPageActions.onRetryMyPage,
        onLogout: myPageActions.onLogout,
        onSaveNickname: myPageActions.onSaveNickname,
        onPublishRoute: myPageActions.onPublishRoute,
      }}
      adminData={{
        adminSummary: myPageData.adminSummary,
        adminBusyPlaceId: myPageData.adminBusyPlaceId,
        adminLoading: myPageData.adminLoading,
      }}
      adminActions={{
        onRefreshAdmin: myPageActions.onRefreshAdmin,
        onToggleAdminPlace: myPageActions.onToggleAdminPlace,
        onToggleAdminManualOverride: myPageActions.onToggleAdminManualOverride,
      }}
    />
  );
}
