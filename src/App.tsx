import { useState } from 'react';
import { AppMapStageView } from './components/AppMapStageView';
import { AppPageStage } from './components/AppPageStage';
import { BottomNav } from './components/BottomNav';
import { GlobalFeedbackButton } from './components/GlobalFeedbackButton';
import { FloatingBackButton } from './components/FloatingBackButton';
import { GlobalNotificationCenter } from './components/GlobalNotificationCenter';
import { GlobalStatusBanner } from './components/GlobalStatusBanner';
import {
  useAppRouteState,
  getInitialMapViewport,
  updateMapViewportInUrl,
} from './hooks/useAppRouteState';
import { useAppDataState } from './hooks/useAppDataState';
import { useAppPageRuntimeState } from './hooks/useAppPageRuntimeState';
import { useAppShellRuntimeState } from './hooks/useAppShellRuntimeState';
import { useAppDomainState } from './hooks/useAppDomainState';
import { useAppShellCoordinator } from './hooks/useAppShellCoordinator';
import type { Tab } from './types';

export default function App() {
  const routeState = useAppRouteState();

  const [initialMapViewport] = useState(getInitialMapViewport);

  const domainState = useAppDomainState();
  const shellRuntimeState = useAppShellRuntimeState();
  const pageRuntimeState = useAppPageRuntimeState();
  const dataState = useAppDataState(routeState.selectedPlaceId);
  const {
    notifications,
    unreadNotificationCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    handleOpenGlobalNotification,
    handleOpenReviewComments,
    handleCloseReviewComments,
    handleOpenRoutePreview,
    handleOpenPlaceWithReturn,
    handleOpenReviewWithReturn,
    viewModels: {
      filteredPlaces,
      hydratedMyPage,
      selectedPlace,
      routePreviewPlaces,
      selectedFestival,
      latestStamp,
      todayStamp,
      visitCount,
      canCreateReview,
      hasCreatedReviewToday,
      placeNameById,
      globalStatus,
      reviewProofMessage,
    },
    loadMoreFeedReviews,
    loadMoreMyComments,
    activeReviewCommentsState: {
      activeReviewComments,
      activeReviewCommentsStatus,
    },
    handleClaimStamp,
    reviewActions: {
      handleCreateReview,
      handleUpdateReview,
      handleCreateComment,
      handleUpdateComment,
      handleDeleteComment,
      handleDeleteReview,
      handleToggleReviewLike,
    },
    routeActions: {
      handleToggleRouteLike,
      handlePublishRoute,
    },
    adminActions: {
      handleToggleAdminPlace,
      handleToggleAdminManualOverride,
      handleRefreshAdminImport,
    },
    shellNavigation: {
      canNavigateBack,
      handleNavigateBack,
      handleBottomNavChange,
    },
    mapStageActions: {
      handleMapOpenPlaceFeed,
      handleMapOpenPlace,
      handleMapOpenFestival,
      handleMapOpenRoutePreviewPlace,
      handleClearRoutePreview,
      handleExpandPlaceDrawer,
      handleCollapsePlaceDrawer,
      handleExpandFestivalDrawer,
      handleCollapseFestivalDrawer,
      handleRequestLogin,
      handleLocateCurrentPosition,
    },
    pageStageActions: {
      handleClearPlaceFilter,
      handleChangeRouteSort,
      handleRetryMyPage,
      handleOpenCommentFromMyPage,
      handleOpenRouteFromMyPage,
    },
    startProviderLogin,
    handleUpdateProfile,
    handleLogout,
    sessionUser,
    providers,
    activeCategory,
    setActiveCategory,
    selectedRoutePreview,
    feedPlaceFilterId,
    myPageTab,
    setMyPageTab,
    currentPosition,
    mapLocationStatus,
    mapLocationFocusKey,
    stampActionStatus,
    stampActionMessage,
    reviewSubmitting,
    reviewError,
    reviewLikeUpdatingId,
    commentSubmittingReviewId,
    commentMutatingId,
    deletingReviewId,
    routeSubmitting,
    routeError,
    routeLikeUpdatingId,
    profileSaving,
    profileError,
    myPageError,
    isLoggingOut,
    feedHasMore,
    feedLoadingMore,
    myCommentsHasMore,
    myCommentsLoadingMore,
    activeCommentReviewId,
    highlightedCommentId,
    highlightedReviewId,
    highlightedRouteId,
    courses,
    communityRoutes,
    communityRouteSort,
    reviews,
    festivals,
    selectedPlaceReviews,
    adminSummary,
    adminBusyPlaceId,
    adminLoading,
  } = useAppShellCoordinator({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
    initialMapViewport,
  });
  const { activeTab, drawerState, closeDrawer } = routeState;
  return (
    <div className="map-app-shell">
      <div className={[
        'phone-shell',
        activeTab === 'map' ? 'phone-shell--map' : '',
      ].filter(Boolean).join(' ')}>
        {globalStatus && (
          <div className="phone-shell__status-slot">
            <GlobalStatusBanner tone={globalStatus.tone} message={globalStatus.message} layout={activeTab === 'map' ? 'map' : 'page'} />
          </div>
        )}
        <div className="phone-shell__utility-slot">
          <GlobalFeedbackButton />
          {sessionUser && hydratedMyPage && (
            <GlobalNotificationCenter
              sessionUserName={sessionUser.nickname}
              notifications={hydratedMyPage.notifications}
              unreadCount={hydratedMyPage.unreadNotificationCount}
              onOpenNotification={handleOpenGlobalNotification}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onDeleteNotification={handleDeleteNotification}
            />
          )}
        </div>
        <div className="phone-shell__body">
          {activeTab === 'map' ? (
            <AppMapStageView
              mapData={{
                activeCategory,
                filteredPlaces,
                festivals,
                selectedPlace,
                selectedFestival,
                currentPosition,
                mapLocationStatus,
                mapLocationFocusKey,
                drawerState,
                sessionUser,
                selectedPlaceReviews,
                routePreview: selectedRoutePreview,
                routePreviewPlaces,
                visitCount,
                latestStamp,
                todayStamp,
                stampActionStatus,
                stampActionMessage,
                reviewProofMessage,
                reviewError,
                reviewSubmitting,
                canCreateReview,
                hasCreatedReviewToday,
                initialMapViewport,
              }}
              mapActions={{
                setActiveCategory,
                onOpenPlaceFeed: handleMapOpenPlaceFeed,
                onOpenPlace: handleMapOpenPlace,
                onOpenRoutePreviewPlace: handleMapOpenRoutePreviewPlace,
                onOpenFestival: handleMapOpenFestival,
                onCloseDrawer: closeDrawer,
                onClearRoutePreview: handleClearRoutePreview,
                onExpandPlaceDrawer: handleExpandPlaceDrawer,
                onCollapsePlaceDrawer: handleCollapsePlaceDrawer,
                onExpandFestivalDrawer: handleExpandFestivalDrawer,
                onCollapseFestivalDrawer: handleCollapseFestivalDrawer,
                onRequestLogin: handleRequestLogin,
                onClaimStamp: handleClaimStamp,
                onCreateReview: handleCreateReview,
                onLocateCurrentPosition: handleLocateCurrentPosition,
                onMapViewportChange: updateMapViewportInUrl,
              }}
            />
          ) : (
            <AppPageStage
              activeTab={activeTab}
              sharedData={{
                sessionUser,
                placeNameById,
                festivals,
              }}
              feedData={{
                reviews,
                reviewLikeUpdatingId,
                feedPlaceFilterId,
                commentSubmittingReviewId,
                commentMutatingId,
                deletingReviewId,
                activeCommentReviewId,
                activeCommentReviewComments: activeReviewComments,
                activeCommentReviewStatus: activeReviewCommentsStatus,
                highlightedCommentId,
                highlightedReviewId,
                feedHasMore,
                feedLoadingMore,
              }}
              courseData={{
                courses,
                communityRoutes,
                communityRouteSort,
                routeLikeUpdatingId,
                highlightedRouteId,
              }}
              myPageData={{
                myPage: hydratedMyPage,
                providers,
                myPageError,
                myPageTab,
                isLoggingOut,
                profileSaving,
                profileError,
                routeSubmitting,
                routeError,
                adminSummary,
                adminBusyPlaceId,
                adminLoading,
                commentsHasMore: myCommentsHasMore,
                commentsLoadingMore: myCommentsLoadingMore,
              }}
              sharedActions={{
                onRequestLogin: handleRequestLogin,
                onOpenPlace: handleOpenPlaceWithReturn,
              }}
              feedActions={{
                onLoadMoreFeed: loadMoreFeedReviews,
                onToggleReviewLike: handleToggleReviewLike,
                onCreateComment: handleCreateComment,
                onUpdateComment: handleUpdateComment,
                onDeleteComment: handleDeleteComment,
                onDeleteReview: handleDeleteReview,
                onClearPlaceFilter: handleClearPlaceFilter,
                onOpenComments: handleOpenReviewComments,
                onCloseComments: handleCloseReviewComments,
              }}
              courseActions={{
                onChangeRouteSort: handleChangeRouteSort,
                onToggleRouteLike: handleToggleRouteLike,
                onOpenRoutePreview: handleOpenRoutePreview,
              }}
              myPageActions={{
                onChangeMyPageTab: setMyPageTab,
                onLogin: startProviderLogin,
                onRetryMyPage: handleRetryMyPage,
                onLogout: handleLogout,
                onSaveNickname: handleUpdateProfile,
                onPublishRoute: handlePublishRoute,
                onOpenCommentFromMyPage: handleOpenCommentFromMyPage,
                onOpenRouteFromMyPage: handleOpenRouteFromMyPage,
                onOpenReview: handleOpenReviewWithReturn,
                onUpdateReview: handleUpdateReview,
                onDeleteReview: handleDeleteReview,
                onMarkNotificationRead: handleMarkNotificationRead,
                onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
                onDeleteNotification: handleDeleteNotification,
                onLoadMoreComments: loadMoreMyComments,
                onRefreshAdmin: handleRefreshAdminImport,
                onToggleAdminPlace: handleToggleAdminPlace,
                onToggleAdminManualOverride: handleToggleAdminManualOverride,
              }}
            />
          )}

          {canNavigateBack && <FloatingBackButton onNavigateBack={handleNavigateBack} />}

          <BottomNav activeTab={activeTab} onChange={handleBottomNavChange} />
        </div>
      </div>
    </div>
  );
}
